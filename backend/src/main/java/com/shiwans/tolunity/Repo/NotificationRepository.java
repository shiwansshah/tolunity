package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.Notifications.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdAndDelFlgFalseOrderByCreatedAtDesc(Long recipientUserId);

    Optional<Notification> findByIdAndRecipientUserIdAndDelFlgFalse(Long id, Long recipientUserId);

    boolean existsByRecipientUserIdAndReferenceKeyAndDelFlgFalse(Long recipientUserId, String referenceKey);
}
