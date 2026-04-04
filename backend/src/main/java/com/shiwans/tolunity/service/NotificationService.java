package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.NotificationRepository;
import com.shiwans.tolunity.Repo.UserRepos.PaymentRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.dto.NotificationDto;
import com.shiwans.tolunity.entities.Notifications.Notification;
import com.shiwans.tolunity.entities.Payments.Payment;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.NotificationTypeEnum;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Set<String> REMINDER_CATEGORIES = Set.of("MAINTENANCE", "GARBAGE");

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SmsService smsService;
    private final ExpoPushNotificationService expoPushNotificationService;

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(Long requestedUserId) {
        validateNotificationAccess(requestedUserId);
        return notificationRepository.findByRecipientUserIdAndDelFlgFalseOrderByCreatedAtDesc(requestedUserId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void markAsRead(Long requestedUserId, Long notificationId) {
        validateNotificationAccess(requestedUserId);
        Notification notification = notificationRepository.findByIdAndRecipientUserIdAndDelFlgFalse(notificationId, requestedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long requestedUserId) {
        validateNotificationAccess(requestedUserId);
        List<Notification> notifications = notificationRepository.findByRecipientUserIdAndDelFlgFalseOrderByCreatedAtDesc(requestedUserId);
        notifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifyPostInteraction(Long actorUserId, Long postOwnerId, NotificationTypeEnum type) {
        if (postOwnerId == null || postOwnerId.equals(actorUserId)) {
            return;
        }

        String message = type == NotificationTypeEnum.COMMENT
                ? "Someone commented on your post"
                : "Someone liked your post";

        createNotification(
                postOwnerId,
                "New Interaction",
                message,
                type,
                false,
                null
        );
    }

    @Transactional
    public void notifyFeeConfigured(String feeType) {
        String normalizedFeeType = feeType != null ? feeType.trim().toLowerCase(Locale.ROOT) : "community";
        createNotifications(
                getResidentUserIds(),
                "Fee Update",
                "New " + normalizedFeeType + " fee has been set",
                NotificationTypeEnum.FEE,
                false,
                null
        );
    }

    @Transactional
    public void notifyRentSet(Long tenantUserId) {
        createNotification(
                tenantUserId,
                "Rent Update",
                "Your rent has been set by the owner",
                NotificationTypeEnum.RENT,
                true,
                null
        );
    }

    @Transactional
    public void notifyRentPaid(Long ownerUserId, Long paymentId) {
        createNotification(
                ownerUserId,
                "Rent Payment Received",
                "Tenant has completed rent payment",
                NotificationTypeEnum.RENT,
                true,
                paymentId != null ? "rent-paid:" + paymentId : null
        );
    }

    @Transactional
    public void notifyComplaintUpdated(Long recipientUserId, Long complaintId) {
        createNotification(
                recipientUserId,
                "Complaint Update",
                "Your complaint status has been updated",
                NotificationTypeEnum.COMPLAINT,
                false,
                complaintId != null ? "complaint-update:" + complaintId + ":" + System.currentTimeMillis() : null
        );
    }

    @Transactional
    public void notifyGlobalDonation(String referenceKey) {
        Set<Long> allRecipientIds = userRepository.findAllByDelFlgFalse().stream()
                .map(User::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        createNotifications(
                allRecipientIds,
                "Charity Donation",
                "A new donation has been made to charity",
                NotificationTypeEnum.DONATION,
                false,
                referenceKey
        );
    }

    @Transactional
    public void notifyPendingFeePaymentsDueSoon() {
        Date now = new Date();
        Date reminderCutoff = new Date(now.getTime() + (12L * 60 * 60 * 1000));

        List<Payment> dueSoonPayments = paymentRepository.findAllByDelFlgFalseAndDueDateBetweenOrderByDueDateAsc(now, reminderCutoff);
        dueSoonPayments.stream()
                .filter(payment -> payment.getPayerId() != null)
                .filter(payment -> payment.getCategory() != null && REMINDER_CATEGORIES.contains(payment.getCategory().toUpperCase(Locale.ROOT)))
                .filter(payment -> !"Paid".equalsIgnoreCase(payment.getStatus()))
                .forEach(payment -> createNotification(
                        payment.getPayerId(),
                        "Payment Reminder",
                        "Reminder: Your payment is due in 12 hours",
                        NotificationTypeEnum.PAYMENT,
                        true,
                        "payment-reminder:" + payment.getId()
                ));
    }

    private void createNotifications(
            Collection<Long> recipientUserIds,
            String title,
            String message,
            NotificationTypeEnum type,
            boolean sendSms,
            String referenceKey
    ) {
        if (recipientUserIds == null || recipientUserIds.isEmpty()) {
            return;
        }

        recipientUserIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .forEach(recipientUserId -> createNotification(recipientUserId, title, message, type, sendSms, referenceKey));
    }

    private void createNotification(
            Long recipientUserId,
            String title,
            String message,
            NotificationTypeEnum type,
            boolean sendSms,
            String referenceKey
    ) {
        if (recipientUserId == null) {
            return;
        }

        User recipient = userRepository.findByIdAndDelFlgFalse(recipientUserId).orElse(null);
        if (recipient == null) {
            return;
        }

        if (referenceKey != null
                && notificationRepository.existsByRecipientUserIdAndReferenceKeyAndDelFlgFalse(recipientUserId, referenceKey)) {
            return;
        }

        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .delFlg(false)
                .referenceKey(referenceKey)
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        expoPushNotificationService.sendToUser(
                recipientUserId,
                savedNotification.getTitle(),
                savedNotification.getMessage(),
                Map.of(
                        "type", savedNotification.getType() != null ? savedNotification.getType().name() : "NOTIFICATION",
                        "notificationId", savedNotification.getId()
                )
        );

        if (sendSms) {
            smsService.sendNotificationSms(recipient, savedNotification);
        }
    }

    private Set<Long> getResidentUserIds() {
        return userRepository.findAllByDelFlgFalse().stream()
                .filter(user -> user.getRole() != UserRolesEnum.ROLE_ADMIN)
                .filter(user -> user.getUserType() == UserTypeEnum.OWNER || user.getUserType() == UserTypeEnum.TENANT)
                .map(User::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setRecipientUserId(notification.getRecipientUserId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setDelFlg(notification.isDelFlg());
        return dto;
    }

    private void validateNotificationAccess(Long requestedUserId) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new AccessDeniedException("Unauthorized: no valid session");
        }

        if (currentUserId.equals(requestedUserId)) {
            return;
        }

        Authentication authentication = SecurityUtil.getAuthentication();
        boolean isAdmin = authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));

        if (!isAdmin) {
            throw new AccessDeniedException("You are not allowed to access these notifications");
        }
    }
}
