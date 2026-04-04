package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.dto.UserDTOs.ChangePasswordRequest;
import com.shiwans.tolunity.dto.UserDTOs.PushTokenRequest;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "phoneNumber", user.getPhoneNumber(),
                    "profilePic", user.getProfilePic() != null ? user.getProfilePic() : "",
                    "expoPushToken", user.getExpoPushToken() != null ? user.getExpoPushToken() : "",
                    "userRole", normalizeRole(user.getRole()),
                    "userType", user.getUserType() != null ? user.getUserType().toString() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load profile: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> updateProfilePic(String profilePicUrl) {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);
            
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            user.setProfilePic(profilePicUrl);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "Profile picture updated successfully",
                "profilePic", profilePicUrl != null ? profilePicUrl : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update profile picture: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> updateProfile(String name, String phoneNumber) {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            if (name != null) user.setName(name);
            if (phoneNumber != null) user.setPhoneNumber(phoneNumber);

            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "name", user.getName(),
                "phoneNumber", user.getPhoneNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> changePassword(ChangePasswordRequest request) {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            // Verify current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.status(400).body(Map.of("error", "Incorrect current password"));
            }

            // Update with new password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to change password: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> registerPushToken(PushTokenRequest request) {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            String token = request.getExpoPushToken() != null ? request.getExpoPushToken().trim() : null;
            if (token == null || token.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "expoPushToken is required"));
            }

            userRepository.findAllByExpoPushTokenAndDelFlgFalse(token).stream()
                    .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                    .forEach(existingUser -> {
                        existingUser.setExpoPushToken(null);
                        userRepository.save(existingUser);
                    });

            user.setExpoPushToken(token);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Push token registered successfully",
                    "expoPushToken", token
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to register push token: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> clearPushToken() {
        try {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User user = userRepository.findUserById(currentUserId);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            user.setExpoPushToken(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Push token cleared successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to clear push token: " + e.getMessage()));
        }
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
