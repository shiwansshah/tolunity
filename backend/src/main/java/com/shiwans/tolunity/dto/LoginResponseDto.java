package com.shiwans.tolunity.dto;

import lombok.Data;

@Data
public class LoginResponseDto {
    private String token;
    private String name;
    private String userRole;
}
