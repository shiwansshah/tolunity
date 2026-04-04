package com.shiwans.tolunity.dto.Visitors;

import lombok.Data;

@Data
public class VisitorCreateRequest {
    private String visitorName;
    private String visitorContact;
    private String expectedVisitAt;
    private String validFrom;
    private String validUntil;
}
