package com.shiwans.tolunity.dto.auth;

import lombok.Data;

@Data
public class ResetPasswordWithCodeRequest {
    private String email;
    private String code;
    private String newPassword;
}
