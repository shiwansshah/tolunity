package com.shiwans.tolunity.dto;

import lombok.Data;

import java.util.Date;

@Data
public class AdminAuditLogDto {
    private Long id;
    private Long actorId;
    private String actorName;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String summary;
    private String details;
    private Date createdAt;
}
