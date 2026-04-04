package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Repo.VisitorRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.dto.Visitors.VisitorCreateRequest;
import com.shiwans.tolunity.dto.Visitors.VisitorPassDto;
import com.shiwans.tolunity.dto.Visitors.VisitorVerifyRequest;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.entities.Visitors.VisitorPass;
import com.shiwans.tolunity.enums.UserTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private static final String STATUS_GENERATED = "GENERATED";
    private static final String STATUS_VISITED = "VISITED";
    private static final String STATUS_EXPIRED = "EXPIRED";
    private static final String QR_PREFIX = "tolunity-visitor:";

    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;

    public ResponseEntity<?> createVisitorPass(VisitorCreateRequest request) {
        User currentUser = getCurrentUser();
        ensureCreator(currentUser);

        String visitorName = trimToNull(request.getVisitorName());
        String visitorContact = trimToNull(request.getVisitorContact());
        Date expectedVisitAt = parseIsoDate(request.getExpectedVisitAt(), "expectedVisitAt");
        Date validFrom = parseIsoDate(request.getValidFrom(), "validFrom");
        Date validUntil = parseIsoDate(request.getValidUntil(), "validUntil");

        if (visitorName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "visitorName is required"));
        }
        if (visitorContact == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "visitorContact is required"));
        }
        if (validUntil.before(validFrom)) {
            return ResponseEntity.badRequest().body(Map.of("error", "validUntil must be after validFrom"));
        }
        if (expectedVisitAt.before(validFrom) || expectedVisitAt.after(validUntil)) {
            return ResponseEntity.badRequest().body(Map.of("error", "expectedVisitAt must be within the QR validity window"));
        }

        VisitorPass pass = VisitorPass.builder()
                .visitorName(visitorName)
                .visitorContact(visitorContact)
                .expectedVisitAt(expectedVisitAt)
                .validFrom(validFrom)
                .validUntil(validUntil)
                .qrToken(UUID.randomUUID().toString().replace("-", ""))
                .status(STATUS_GENERATED)
                .createdById(currentUser.getId())
                .createdByName(currentUser.getName())
                .createdByUserType(currentUser.getUserType().name())
                .build();

        visitorRepository.save(pass);
        return ResponseEntity.ok(toDto(pass));
    }

    public ResponseEntity<?> getMyVisitorPasses() {
        User currentUser = getCurrentUser();
        if (currentUser.getUserType() != UserTypeEnum.OWNER && currentUser.getUserType() != UserTypeEnum.TENANT) {
            throw new AccessDeniedException("Only owner and tenant users can view created visitor passes");
        }

        List<VisitorPassDto> rows = visitorRepository.findAllByCreatedByIdAndDelFlgFalseOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(rows);
    }

    public ResponseEntity<?> verifyVisitorPass(VisitorVerifyRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser.getUserType() != UserTypeEnum.SECURITY) {
            throw new AccessDeniedException("Only security users can verify visitor QR passes");
        }

        String token = resolveQrToken(request);
        if (token == null) {
            return ResponseEntity.ok(buildVerificationResponse(false, "QR data is missing or invalid", "INVALID_QR", null));
        }

        VisitorPass pass = visitorRepository.findByQrTokenAndDelFlgFalse(token).orElse(null);
        if (pass == null) {
            return ResponseEntity.ok(buildVerificationResponse(false, "Visitor QR was not found", "NOT_FOUND", null));
        }

        Date now = new Date();
        if (STATUS_VISITED.equalsIgnoreCase(pass.getStatus())) {
            return ResponseEntity.ok(buildVerificationResponse(false, "This visitor has already checked in", "ALREADY_VISITED", pass));
        }

        if (pass.getValidFrom() != null && now.before(pass.getValidFrom())) {
            return ResponseEntity.ok(buildVerificationResponse(false, "This visitor pass is not active yet", "NOT_ACTIVE", pass));
        }

        if (pass.getValidUntil() != null && now.after(pass.getValidUntil())) {
            if (!STATUS_EXPIRED.equalsIgnoreCase(pass.getStatus())) {
                pass.setStatus(STATUS_EXPIRED);
                visitorRepository.save(pass);
            }
            return ResponseEntity.ok(buildVerificationResponse(false, "This visitor pass has expired", "EXPIRED", pass));
        }

        pass.setStatus(STATUS_VISITED);
        pass.setVisitedAt(now);
        pass.setVerifiedById(currentUser.getId());
        pass.setVerifiedByName(currentUser.getName());
        visitorRepository.save(pass);

        return ResponseEntity.ok(buildVerificationResponse(true, "Visitor pass verified successfully", "VERIFIED", pass));
    }

    public ResponseEntity<?> getAdminVisitorLog(int page, int size, Long createdById, String visitStatus, String search) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<VisitorPass> specification = (root, query, criteriaBuilder) ->
                criteriaBuilder.isFalse(root.get("delFlg"));

        if (createdById != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("createdById"), createdById));
        }

        String normalizedStatus = trimToNull(visitStatus);
        if (normalizedStatus != null) {
            specification = specification.and((root, query, criteriaBuilder) -> {
                if ("VISITED".equalsIgnoreCase(normalizedStatus)) {
                    return criteriaBuilder.equal(criteriaBuilder.upper(root.get("status")), STATUS_VISITED);
                }
                if ("NOT_VISITED".equalsIgnoreCase(normalizedStatus)) {
                    return criteriaBuilder.notEqual(criteriaBuilder.upper(root.get("status")), STATUS_VISITED);
                }
                return criteriaBuilder.conjunction();
            });
        }

        String normalizedSearch = trimToNull(search);
        if (normalizedSearch != null) {
            String likeValue = "%" + normalizedSearch.toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("visitorName")), likeValue),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("visitorContact")), likeValue),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("createdByName")), likeValue)
                    ));
        }

        Page<VisitorPass> result = visitorRepository.findAll(specification, pageable);
        List<Map<String, Object>> creators = visitorRepository.findDistinctCreatorOptions().stream()
                .map(option -> Map.<String, Object>of(
                        "id", option.getId(),
                        "name", option.getName()
                ))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent().stream().map(this::toDto).toList());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("creators", creators);
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildVerificationResponse(boolean verified, String message, String code, VisitorPass pass) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("verified", verified);
        response.put("message", message);
        response.put("code", code);
        response.put("visitor", pass != null ? toDto(pass) : null);
        return response;
    }

    private VisitorPassDto toDto(VisitorPass pass) {
        refreshStatusIfExpired(pass);

        VisitorPassDto dto = new VisitorPassDto();
        dto.setId(pass.getId());
        dto.setVisitorName(pass.getVisitorName());
        dto.setVisitorContact(pass.getVisitorContact());
        dto.setExpectedVisitAt(pass.getExpectedVisitAt());
        dto.setValidFrom(pass.getValidFrom());
        dto.setValidUntil(pass.getValidUntil());
        dto.setCreatedAt(pass.getCreatedAt());
        dto.setCreatedById(pass.getCreatedById());
        dto.setCreatedByName(pass.getCreatedByName());
        dto.setCreatedByUserType(pass.getCreatedByUserType());
        dto.setQrData(QR_PREFIX + pass.getQrToken());
        dto.setVisitStatus(STATUS_VISITED.equalsIgnoreCase(pass.getStatus()) ? "VISITED" : "NOT_VISITED");
        dto.setLifecycleStatus(resolveLifecycleStatus(pass));
        dto.setVisited(STATUS_VISITED.equalsIgnoreCase(pass.getStatus()));
        dto.setVisitedAt(pass.getVisitedAt());
        dto.setVerifiedById(pass.getVerifiedById());
        dto.setVerifiedByName(pass.getVerifiedByName());
        return dto;
    }

    private void refreshStatusIfExpired(VisitorPass pass) {
        if (pass == null || pass.getValidUntil() == null) {
            return;
        }
        if (!STATUS_VISITED.equalsIgnoreCase(pass.getStatus()) && new Date().after(pass.getValidUntil()) && !STATUS_EXPIRED.equalsIgnoreCase(pass.getStatus())) {
            pass.setStatus(STATUS_EXPIRED);
            visitorRepository.save(pass);
        }
    }

    private String resolveLifecycleStatus(VisitorPass pass) {
        if (STATUS_VISITED.equalsIgnoreCase(pass.getStatus())) {
            return "VISITED";
        }

        Date now = new Date();
        if (pass.getValidUntil() != null && now.after(pass.getValidUntil())) {
            return "EXPIRED";
        }
        if (pass.getValidFrom() != null && now.before(pass.getValidFrom())) {
            return "UPCOMING";
        }
        return "ACTIVE";
    }

    private String resolveQrToken(VisitorVerifyRequest request) {
        String token = trimToNull(request.getQrToken());
        if (token != null) {
            return token;
        }

        String qrData = trimToNull(request.getQrData());
        if (qrData == null) {
            return null;
        }

        if (qrData.startsWith(QR_PREFIX)) {
            return trimToNull(qrData.substring(QR_PREFIX.length()));
        }
        return null;
    }

    private void ensureCreator(User currentUser) {
        if (currentUser.getUserType() != UserTypeEnum.OWNER && currentUser.getUserType() != UserTypeEnum.TENANT) {
            throw new AccessDeniedException("Only owner and tenant users can create visitor QR passes");
        }
    }

    private User getCurrentUser() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new AccessDeniedException("Unauthorized");
        }

        return userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private Date parseIsoDate(String value, String fieldName) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        try {
            return Date.from(Instant.parse(normalized));
        } catch (Exception ignored) {
            throw new IllegalArgumentException(fieldName + " must be a valid ISO-8601 datetime");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
