package com.shiwans.tolunity.dto.Visitors;

import lombok.Data;

@Data
public class VisitorVerifyRequest {
    private String qrData;
    private String qrToken;
}
