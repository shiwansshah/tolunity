package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.dto.LoginResponseDto;
import com.shiwans.tolunity.dto.UserLoginDto;
import com.shiwans.tolunity.dto.UserRegisterDto;
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

import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
}
