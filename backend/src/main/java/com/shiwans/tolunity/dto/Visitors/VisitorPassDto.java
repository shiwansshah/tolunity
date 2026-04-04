package com.shiwans.tolunity.dto.Visitors;

import lombok.Data;

import java.util.Date;

@Data
public class VisitorPassDto {
    private Long id;
    private String visitorName;
    private String visitorContact;
    private Date expectedVisitAt;
    private Date validFrom;
    private Date validUntil;
    private Date createdAt;
    private Long createdById;
    private String createdByName;
    private String createdByUserType;
    private String qrData;
    private String visitStatus;
    private String lifecycleStatus;
    private boolean visited;
    private Date visitedAt;
    private Long verifiedById;
    private String verifiedByName;
}
