package com.shiwans.tolunity.controller.UserController;

import com.shiwans.tolunity.service.UserServices.TenantOwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TenantOwnerController {

    private final TenantOwnerService tenantOwnerService;

    @GetMapping("/owners")
    public ResponseEntity<?> getAllOwners() {
        return tenantOwnerService.getAllOwners();
    }

    @PostMapping("/select-owner")
    public ResponseEntity<?> selectOwner(@RequestBody Map<String, Long> request) {
        return tenantOwnerService.selectOwner(request);
    }

    @GetMapping("/my-tenants")
    public ResponseEntity<?> getMyTenants() {
        return tenantOwnerService.getMyTenants();
    }

    @PostMapping("/remove-tenant/{tenantId}")
    public ResponseEntity<?> removeTenant(@PathVariable Long tenantId) {
        return tenantOwnerService.removeTenant(tenantId);
    }

    @GetMapping("/has-owner")
    public ResponseEntity<?> hasOwner() {
        return tenantOwnerService.hasOwner();
    }
}
