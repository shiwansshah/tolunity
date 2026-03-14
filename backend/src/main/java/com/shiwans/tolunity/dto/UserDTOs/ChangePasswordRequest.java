package com.shiwans.tolunity.dto.UserDTOs;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
