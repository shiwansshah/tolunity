package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.AlertRepos.AlertMediaRepository;
import com.shiwans.tolunity.Repo.AlertRepos.AlertReadReceiptRepository;
import com.shiwans.tolunity.Repo.AlertRepos.AlertRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.dto.AlertDtos.AlertRequest;
import com.shiwans.tolunity.dto.AlertDtos.AlertResponse;
import com.shiwans.tolunity.entities.Alerts.Alert;
import com.shiwans.tolunity.entities.Alerts.AlertMedia;
import com.shiwans.tolunity.entities.Alerts.AlertReadReceipt;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.MediaTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertMediaRepository alertMediaRepository;
    private final AlertReadReceiptRepository alertReadReceiptRepository;
    private final UserRepository userRepository;
    private final ExpoPushNotificationService expoPushNotificationService;

    @Transactional(readOnly = true)
    public List<AlertResponse> getAlertsForCurrentUser() {
        Long currentUserId = requireCurrentUserId();
        List<Alert> alerts = alertRepository.findAllByDelFlgFalseOrderByCreatedAtDesc();
        if (alerts.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> alertIds = alerts.stream().map(Alert::getId).toList();
        Map<Long, List<AlertMedia>> mediaByAlertId = alertMediaRepository.findByAlertIdInAndDelFlgFalseOrderByIdAsc(alertIds).stream()
                .collect(Collectors.groupingBy(media -> media.getAlert().getId(), LinkedHashMap::new, Collectors.toList()));

        Set<Long> readAlertIds = alertReadReceiptRepository.findByAlertIdInAndUserIdAndDelFlgFalse(alertIds, currentUserId).stream()
                .map(receipt -> receipt.getAlert().getId())
                .collect(Collectors.toSet());

        Set<Long> creatorIds = alerts.stream()
                .map(Alert::getCreatedById)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(creatorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left));

        return alerts.stream()
                .map(alert -> toResponse(
                        alert,
                        usersById.get(alert.getCreatedById()),
                        mediaByAlertId.getOrDefault(alert.getId(), Collections.emptyList()),
                        readAlertIds.contains(alert.getId())
                ))
                .toList();
    }

    @Transactional
    public ResponseEntity<?> createAlert(AlertRequest request) {
        Long currentUserId = requireCurrentUserId();
        User currentUser = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("description is required");
        }

        Alert alert = alertRepository.save(Alert.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .createdById(currentUserId)
                .build());

        if (request.getMediaList() != null) {
            List<AlertMedia> mediaItems = request.getMediaList().stream()
                    .filter(media -> media.getMediaUrl() != null && !media.getMediaUrl().isBlank())
                    .map(media -> AlertMedia.builder()
                            .alert(alert)
                            .mediaUrl(media.getMediaUrl())
                            .mediaType(resolveMediaType(media.getMediaType()))
                            .build())
                    .toList();

            if (!mediaItems.isEmpty()) {
                alertMediaRepository.saveAll(mediaItems);
            }
        }

        List<Long> recipientIds = userRepository.findAllByDelFlgFalse().stream()
                .map(User::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        expoPushNotificationService.sendToUsers(
                recipientIds,
                alert.getTitle(),
                alert.getDescription(),
                Map.of(
                        "type", "ALERT",
                        "alertId", alert.getId(),
                        "createdById", currentUserId
                )
        );

        return ResponseEntity.ok(Map.of(
                "message", "Emergency alert sent successfully",
                "alertId", alert.getId(),
                "createdByName", currentUser.getName()
        ));
    }

    @Transactional
    public void markAsRead(Long alertId) {
        Long currentUserId = requireCurrentUserId();
        Alert alert = alertRepository.findById(alertId)
                .filter(existingAlert -> !existingAlert.isDelFlg())
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));

        alertReadReceiptRepository.findByAlertIdAndUserIdAndDelFlgFalse(alertId, currentUserId)
                .orElseGet(() -> alertReadReceiptRepository.save(AlertReadReceipt.builder()
                        .alert(alert)
                        .userId(currentUserId)
                        .build()));
    }

    @Transactional
    public void markAllAsRead() {
        Long currentUserId = requireCurrentUserId();
        List<Alert> alerts = alertRepository.findAllByDelFlgFalseOrderByCreatedAtDesc();
        if (alerts.isEmpty()) {
            return;
        }

        List<Long> alertIds = alerts.stream().map(Alert::getId).toList();
        Set<Long> alreadyRead = alertReadReceiptRepository.findByAlertIdInAndUserIdAndDelFlgFalse(alertIds, currentUserId).stream()
                .map(receipt -> receipt.getAlert().getId())
                .collect(Collectors.toSet());

        List<AlertReadReceipt> newReceipts = alerts.stream()
                .filter(alert -> !alreadyRead.contains(alert.getId()))
                .map(alert -> AlertReadReceipt.builder()
                        .alert(alert)
                        .userId(currentUserId)
                        .build())
                .toList();

        if (!newReceipts.isEmpty()) {
            alertReadReceiptRepository.saveAll(newReceipts);
        }
    }

    private AlertResponse toResponse(Alert alert, User creator, List<AlertMedia> mediaItems, boolean isRead) {
        AlertResponse response = new AlertResponse();
        response.setId(alert.getId());
        response.setTitle(alert.getTitle());
        response.setDescription(alert.getDescription());
        response.setCreatedById(alert.getCreatedById());
        response.setCreatedByName(creator != null ? creator.getName() : "Community Member");
        response.setRead(isRead);
        response.setCreatedAt(alert.getCreatedAt());
        response.setMediaList(mediaItems.stream().map(this::toMediaItem).toList());
        return response;
    }

    private AlertResponse.MediaItem toMediaItem(AlertMedia media) {
        AlertResponse.MediaItem item = new AlertResponse.MediaItem();
        item.setId(media.getId());
        item.setMediaUrl(media.getMediaUrl());
        item.setMediaType(media.getMediaType() != null ? media.getMediaType().name() : null);
        return item;
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
