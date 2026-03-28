package com.shiwans.tolunity.service;

import com.shiwans.tolunity.entities.Notifications.Notification;
import com.shiwans.tolunity.entities.User;

public interface SmsService {
    void sendNotificationSms(User recipient, Notification notification);
}
