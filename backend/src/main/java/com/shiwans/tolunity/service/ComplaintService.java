package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.ComplaintRepos.ComplaintMediaRepository;
import com.shiwans.tolunity.Repo.ComplaintRepos.ComplaintRepository;
import com.shiwans.tolunity.Repo.ComplaintRepos.ComplaintUpvoteRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.dto.ComplaintDtos.ComplaintResponse;
import com.shiwans.tolunity.dto.ComplaintDtos.CreateComplaintRequest;
import com.shiwans.tolunity.dto.ComplaintDtos.UpdateComplaintStatusRequest;
import com.shiwans.tolunity.entities.Complaints.Complaint;
import com.shiwans.tolunity.entities.Complaints.ComplaintMedia;
import com.shiwans.tolunity.entities.Complaints.ComplaintUpvote;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.MediaTypeEnum;
import com.shiwans.tolunity.service.AdminServices.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("OPEN", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED");

    private final ComplaintRepository complaintRepository;
    private final ComplaintMediaRepository complaintMediaRepository;
    private final ComplaintUpvoteRepository complaintUpvoteRepository;
    private final UserRepository userRepository;
    private final AdminAuditService adminAuditService;

    @Value("${app.complaints.followup.name}")
    private String followUpName;

    @Value("${app.complaints.followup.phone}")
    private String followUpPhone;

    @Value("${app.complaints.followup.email}")
    private String followUpEmail;

    public ResponseEntity<?> getComplaintsForUsers() {
        return ResponseEntity.ok(mapComplaints());
    }

    public ResponseEntity<?> getComplaintsForAdmins() {
        return ResponseEntity.ok(mapComplaints());
    }

    public ResponseEntity<?> createComplaint(CreateComplaintRequest request) {
        Long currentUserId = requireCurrentUserId();
        User currentUser = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("description is required");
        }

        Complaint complaint = Complaint.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : "General")
                .status("OPEN")
                .resolutionNote("Awaiting admin review")
                .createdById(currentUser.getId())
                .build();

        Complaint savedComplaint = complaintRepository.save(complaint);

        if (request.getMediaList() != null) {
            List<ComplaintMedia> mediaItems = request.getMediaList().stream()
                    .filter(media -> media.getMediaUrl() != null && !media.getMediaUrl().isBlank())
                    .map(media -> ComplaintMedia.builder()
                            .complaint(savedComplaint)
                            .mediaUrl(media.getMediaUrl())
                            .mediaType(resolveMediaType(media.getMediaType()))
                            .build())
                    .toList();
            if (!mediaItems.isEmpty()) {
                complaintMediaRepository.saveAll(mediaItems);
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Complaint submitted successfully",
                "complaintId", savedComplaint.getId()
        ));
    }

    public ResponseEntity<?> toggleUpvote(Long complaintId) {
        Long currentUserId = requireCurrentUserId();
        Complaint complaint = complaintRepository.findByIdAndDelFlgFalse(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        ComplaintUpvote upvote = complaintUpvoteRepository.findByComplaintIdAndUserId(complaintId, currentUserId)
                .orElseGet(() -> ComplaintUpvote.builder()
                        .complaint(complaint)
                        .userId(currentUserId)
                        .build());

        boolean willBeUpvoted = upvote.getId() == null || upvote.isDelFlg();
        upvote.setComplaint(complaint);
        upvote.setUserId(currentUserId);
        upvote.setDelFlg(!willBeUpvoted);
        complaintUpvoteRepository.save(upvote);

        long upvoteCount = complaintUpvoteRepository.findByComplaintIdInAndDelFlgFalse(List.of(complaintId)).size();
        return ResponseEntity.ok(Map.of(
                "upvoted", willBeUpvoted,
                "upvoteCount", upvoteCount
        ));
    }

    public ResponseEntity<?> updateComplaintStatus(Long complaintId, UpdateComplaintStatusRequest request) {
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new IllegalArgumentException("status is required");
        }

        String normalizedStatus = request.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("status must be OPEN, UNDER_REVIEW, IN_PROGRESS, RESOLVED, or CLOSED");
        }

        Complaint complaint = complaintRepository.findByIdAndDelFlgFalse(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        complaint.setStatus(normalizedStatus);
        complaint.setResolutionNote(request.getResolutionNote() != null && !request.getResolutionNote().isBlank()
                ? request.getResolutionNote().trim()
                : complaint.getResolutionNote());
        complaintRepository.save(complaint);
        adminAuditService.logAction(
                "COMPLAINT_UPDATED",
                "COMPLAINT",
                complaint.getId(),
                "Updated complaint #" + complaint.getId() + " to " + normalizedStatus,
                "resolutionNote=" + (complaint.getResolutionNote() != null ? complaint.getResolutionNote() : "")
        );

        return ResponseEntity.ok(Map.of("message", "Complaint updated successfully"));
    }

    private List<ComplaintResponse> mapComplaints() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        List<Complaint> complaints = complaintRepository.findAllByDelFlgFalseOrderByCreatedAtDesc();
        if (complaints.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> complaintIds = complaints.stream().map(Complaint::getId).toList();
        List<ComplaintUpvote> upvotes = complaintUpvoteRepository.findByComplaintIdInAndDelFlgFalse(complaintIds);

        Map<Long, List<ComplaintMedia>> mediaByComplaintId = complaintMediaRepository
                .findByComplaintIdInAndDelFlgFalseOrderByIdAsc(complaintIds)
                .stream()
                .collect(Collectors.groupingBy(media -> media.getComplaint().getId(), LinkedHashMap::new, Collectors.toList()));

        Map<Long, Long> upvoteCounts = upvotes.stream()
                .collect(Collectors.groupingBy(upvote -> upvote.getComplaint().getId(), Collectors.counting()));

        Map<Long, Boolean> upvotedByCurrentUser = currentUserId == null
                ? Collections.emptyMap()
                : upvotes.stream()
                        .filter(upvote -> currentUserId.equals(upvote.getUserId()))
                        .collect(Collectors.toMap(upvote -> upvote.getComplaint().getId(), upvote -> true, (left, right) -> left));

        Set<Long> creatorIds = complaints.stream()
                .map(Complaint::getCreatedById)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> usersById = userRepository.findAllById(creatorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return complaints.stream()
                .map(complaint -> toResponse(
                        complaint,
                        usersById.get(complaint.getCreatedById()),
                        mediaByComplaintId.getOrDefault(complaint.getId(), Collections.emptyList()),
                        upvoteCounts.getOrDefault(complaint.getId(), 0L),
                        upvotedByCurrentUser.getOrDefault(complaint.getId(), false)
                ))
                .sorted(Comparator
                        .comparingLong(ComplaintResponse::getUpvoteCount).reversed()
                        .thenComparing(ComplaintResponse::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ComplaintResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private ComplaintResponse toResponse(
            Complaint complaint,
            User creator,
            List<ComplaintMedia> mediaItems,
            long upvoteCount,
            boolean upvotedByCurrentUser
    ) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setTitle(complaint.getTitle());
        response.setDescription(complaint.getDescription());
        response.setCategory(complaint.getCategory());
        response.setStatus(complaint.getStatus());
        response.setResolutionNote(complaint.getResolutionNote());
        response.setCreatedById(complaint.getCreatedById());
        response.setCreatedByName(creator != null ? creator.getName() : "Community Member");
        response.setUpvoteCount(upvoteCount);
        response.setUpvotedByCurrentUser(upvotedByCurrentUser);
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        response.setMediaList(mediaItems.stream().map(this::toMediaItem).toList());
        response.setFollowUpContact(buildFollowUpContact());
        return response;
    }

    private ComplaintResponse.MediaItem toMediaItem(ComplaintMedia media) {
        ComplaintResponse.MediaItem item = new ComplaintResponse.MediaItem();
        item.setId(media.getId());
        item.setMediaUrl(media.getMediaUrl());
        item.setMediaType(media.getMediaType() != null ? media.getMediaType().name() : null);
        return item;
    }

    private ComplaintResponse.FollowUpContact buildFollowUpContact() {
        ComplaintResponse.FollowUpContact contact = new ComplaintResponse.FollowUpContact();
        contact.setName(followUpName);
        contact.setPhoneNumber(followUpPhone);
        contact.setEmail(followUpEmail);
        return contact;
    }

    private MediaTypeEnum resolveMediaType(String mediaType) {
        if (mediaType == null || mediaType.isBlank()) {
            return MediaTypeEnum.IMAGE;
        }

        return switch (mediaType.trim().toUpperCase(Locale.ROOT)) {
            case "VIDEO" -> MediaTypeEnum.VIDEO;
            case "AUDIO" -> MediaTypeEnum.AUDIO;
            case "DOCUMENT" -> MediaTypeEnum.DOCUMENT;
            default -> MediaTypeEnum.IMAGE;
        };
    }

    private Long requireCurrentUserId() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new AccessDeniedException("Unauthorized: no valid session");
        }
        return currentUserId;
    }
}
