package com.shiwans.tolunity.dto;

import com.shiwans.tolunity.enums.NotificationTypeEnum;
import lombok.Data;

import java.util.Date;

@Data
public class NotificationDto {
    private Long id;
    private Long recipientUserId;
    private String title;
    private String message;
    private NotificationTypeEnum type;
    private Boolean isRead;
    private Date createdAt;
    private boolean delFlg;
}
