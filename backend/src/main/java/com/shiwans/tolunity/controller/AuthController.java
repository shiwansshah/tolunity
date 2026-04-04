package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.dto.UserLoginDto;
import com.shiwans.tolunity.dto.UserRegisterDto;
import com.shiwans.tolunity.dto.auth.ForgotPasswordRequest;
import com.shiwans.tolunity.dto.auth.ResetPasswordWithCodeRequest;
import com.shiwans.tolunity.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return authService.logout();
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody ForgotPasswordRequest request) {
        return authService.requestPasswordReset(request);
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPasswordWithCode(@RequestBody ResetPasswordWithCodeRequest request) {
        return authService.resetPasswordWithCode(request);
    }
}
