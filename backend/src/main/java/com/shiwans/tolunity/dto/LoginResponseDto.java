package com.shiwans.tolunity.dto;

import lombok.Data;

@Data
public class LoginResponseDto {
    private Long id;
    private String token;
    private String name;
    private String email;
    private String userRole;
    private String userType;
}
