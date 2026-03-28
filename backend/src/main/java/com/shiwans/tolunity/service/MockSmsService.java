package com.shiwans.tolunity.service;

import com.shiwans.tolunity.entities.Notifications.Notification;
import com.shiwans.tolunity.entities.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MockSmsService implements SmsService {

    @Override
    public void sendNotificationSms(User recipient, Notification notification) {
        log.info(
                "Mock SMS sent to {} ({}): {} - {}",
                recipient.getName(),
                recipient.getPhoneNumber(),
                notification.getTitle(),
                notification.getMessage()
        );
    }
}
