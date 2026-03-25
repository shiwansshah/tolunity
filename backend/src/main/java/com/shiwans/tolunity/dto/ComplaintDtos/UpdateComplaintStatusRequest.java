package com.shiwans.tolunity.dto.ComplaintDtos;

import lombok.Data;

@Data
public class UpdateComplaintStatusRequest {
    private String status;
    private String resolutionNote;
}
