package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.PasswordResetCodeRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.dto.LoginResponseDto;
import com.shiwans.tolunity.dto.UserLoginDto;
import com.shiwans.tolunity.dto.UserRegisterDto;
import com.shiwans.tolunity.dto.auth.ForgotPasswordRequest;
import com.shiwans.tolunity.dto.auth.ResetPasswordWithCodeRequest;
import com.shiwans.tolunity.entities.PasswordResetCode;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int PASSWORD_RESET_CODE_LENGTH = 6;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${app.password-reset.code-expiration-minutes:10}")
    private long passwordResetCodeExpirationMinutes;

    public ResponseEntity<?> register(UserRegisterDto request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (userRepository.findUserByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered!"));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(UserRolesEnum.ROLE_USER);
        user.setCreatedAt(new Date());
        user.setUserType(resolveUserType(request));

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User Registered successfully!"));
    }

    public ResponseEntity<?> login(UserLoginDto request) {
        try {
            String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
            if (normalizedEmail == null || normalizedEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));

            Optional<User> user = userRepository.findUserByEmail(normalizedEmail);
            if (user.isEmpty()) {
                throw new UsernameNotFoundException("User Not Found!");
            }

            User authenticatedUser = user.get();
            String token = jwtService.generateToken(authenticatedUser.getEmail(), authenticatedUser.getRole().toString());

            authenticatedUser.setActiveFlg(true);
            userRepository.save(authenticatedUser);

            LoginResponseDto response = new LoginResponseDto();
            response.setId(authenticatedUser.getId());
            response.setToken(token);
            response.setName(authenticatedUser.getName());
            response.setEmail(authenticatedUser.getEmail());
            response.setUserRole(normalizeRole(authenticatedUser.getRole()));
            response.setUserType(authenticatedUser.getUserType() != null ? authenticatedUser.getUserType().toString() : null);

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials"));
        }
    }

    public ResponseEntity<?> logout() {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            if (currentUserId != null) {
                User user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    user.setActiveFlg(false);
                    userRepository.save(user);
                }
            }
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Logout failed"));
        }
    }

    public ResponseEntity<?> requestPasswordReset(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        Optional<User> optionalUser = userRepository.findUserByEmail(normalizedEmail);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "If the email exists, a verification code has been sent."));
        }

        try {
            User user = optionalUser.get();
            String code = generatePasswordResetCode();
            passwordResetCodeRepository.deleteByUserId(user.getId());
            passwordResetCodeRepository.save(PasswordResetCode.builder()
                    .userId(user.getId())
                    .email(normalizedEmail)
                    .codeHash(passwordEncoder.encode(code))
                    .expiresAt(new Date(System.currentTimeMillis() + (passwordResetCodeExpirationMinutes * 60 * 1000)))
                    .build());
            emailService.sendPasswordResetCode(normalizedEmail, code);
            return ResponseEntity.ok(Map.of("message", "If the email exists, a verification code has been sent."));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", exception.getMessage()));
        }
    }

    public ResponseEntity<?> resetPasswordWithCode(ResetPasswordWithCodeRequest request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String code = request.getCode() != null ? request.getCode().trim() : null;
        String newPassword = request.getNewPassword();

        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code is required"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        }

        Optional<User> optionalUser = userRepository.findUserByEmail(normalizedEmail);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid email or verification code"));
        }

        User user = optionalUser.get();
        Optional<PasswordResetCode> optionalResetCode = passwordResetCodeRepository.findTopByUserIdAndDelFlgFalseOrderByCreatedAtDesc(user.getId());
        if (optionalResetCode.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No active verification code found"));
        }

        PasswordResetCode resetCode = optionalResetCode.get();
        if (resetCode.getExpiresAt() == null || resetCode.getExpiresAt().before(new Date())) {
            passwordResetCodeRepository.deleteByUserId(user.getId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Verification code has expired"));
        }
        if (!passwordEncoder.matches(code, resetCode.getCodeHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid email or verification code"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetCodeRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    private UserTypeEnum resolveUserType(UserRegisterDto request) {
        String requestedUserType = request.getUserType() != null && !request.getUserType().isBlank()
                ? request.getUserType()
                : request.getUserType2();

        if ("OWNER".equalsIgnoreCase(requestedUserType)) {
            return UserTypeEnum.OWNER;
        }
        if ("TENANT".equalsIgnoreCase(requestedUserType)) {
            return UserTypeEnum.TENANT;
        }

        throw new IllegalArgumentException("userType must be OWNER or TENANT");
    }

    private String normalizeRole(UserRolesEnum role) {
        if (role == null) {
            return null;
        }

        return switch (role) {
            case ROLE_ADMIN -> "ADMIN";
            case ROLE_USER -> "USER";
        };
    }

    private String generatePasswordResetCode() {
        SecureRandom secureRandom = new SecureRandom();
        int upperBound = (int) Math.pow(10, PASSWORD_RESET_CODE_LENGTH);
        int lowerBound = upperBound / 10;
        return String.valueOf(lowerBound + secureRandom.nextInt(upperBound - lowerBound));
    }
}
