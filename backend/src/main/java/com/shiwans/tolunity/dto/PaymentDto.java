package com.shiwans.tolunity.dto;

import lombok.Data;
import java.util.Date;

@Data
public class PaymentDto {
    private Long id;
    private String title;
    private Double amount;
    private Date dueDate;
    private String status;
    private String category;
    private Long payerId;
    private Long payeeId;
    private String payerName;
    private String payeeName;
    private String icon; // Provided for the mobile app
    private String gatewayProvider;
    private String gatewayStatus;
}
