package com.shiwans.tolunity.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.notifications.reminder-scan-interval-ms:300000}")
    public void sendPaymentReminders() {
        notificationService.notifyPendingFeePaymentsDueSoon();
    }
}
