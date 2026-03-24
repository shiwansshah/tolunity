package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantOwnerService {

    private final UserRepository userRepository;

    public ResponseEntity<?> getAllOwners() {
        List<Map<String, Object>> owners = userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.OWNER).stream()
                .map(owner -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", owner.getId());
                    map.put("name", owner.getName());
                    map.put("email", owner.getEmail());
                    map.put("profilePic", owner.getProfilePic());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(owners);
    }

    public ResponseEntity<?> selectOwner(Map<String, Long> request) {
        Long ownerId = request.get("ownerId");
        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (currentUserId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        if (ownerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "ownerId is required"));
        }

        User tenant = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        User owner = userRepository.findByIdAndDelFlgFalse(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        if (tenant.getUserType() != UserTypeEnum.TENANT) {
            throw new AccessDeniedException("Only tenant users can select an owner");
        }
        if (owner.getUserType() != UserTypeEnum.OWNER) {
            return ResponseEntity.badRequest().body(Map.of("error", "Selected user is not an owner"));
        }

        tenant.setOwnerId(ownerId);
        userRepository.save(tenant);

        return ResponseEntity.ok(Map.of("message", "Owner selected successfully"));
    }

    public ResponseEntity<?> getMyTenants() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User currentUser = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        if (currentUser.getUserType() != UserTypeEnum.OWNER) {
            throw new AccessDeniedException("Only owner users can access tenant assignments");
        }

        List<Map<String, Object>> tenants = userRepository.findByOwnerIdAndDelFlgFalse(currentUserId).stream()
                .map(tenant -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", tenant.getId());
                    map.put("name", tenant.getName());
                    map.put("email", tenant.getEmail());
                    map.put("phoneNumber", tenant.getPhoneNumber());
                    map.put("profilePic", tenant.getProfilePic());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(tenants);
    }

    public ResponseEntity<?> removeTenant(Long tenantId) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User currentUser = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        if (currentUser.getUserType() != UserTypeEnum.OWNER) {
            throw new AccessDeniedException("Only owner users can remove tenants");
        }

        User tenant = userRepository.findByIdAndDelFlgFalse(tenantId).orElse(null);
        if (tenant != null && currentUserId.equals(tenant.getOwnerId())) {
            tenant.setOwnerId(null);
            userRepository.save(tenant);
            return ResponseEntity.ok(Map.of("message", "Tenant removed successfully"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Tenant not found or not owned by you"));
    }

    public ResponseEntity<?> hasOwner() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        User user = currentUserId != null ? userRepository.findByIdAndDelFlgFalse(currentUserId).orElse(null) : null;
        boolean hasOwner = user != null && user.getOwnerId() != null;
        return ResponseEntity.ok(Map.of("hasOwner", hasOwner));
    }
}
