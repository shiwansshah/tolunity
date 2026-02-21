package com.shiwans.tolunity.dto;

import lombok.Data;

@Data
public class UserRegisterDto {
    private String name;
    private String email;
    private String phoneNumber;
    private String password;
    private String userType;
}
