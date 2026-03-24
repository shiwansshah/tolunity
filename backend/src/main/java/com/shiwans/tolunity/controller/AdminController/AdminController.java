package com.shiwans.tolunity.controller.AdminController;

import com.shiwans.tolunity.service.AdminServices.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return adminService.getAllUsers();
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        return adminService.toggleUserStatus(id);
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getAllPayments() {
        return adminService.getAllPayments();
    }

    @GetMapping("/fee-config")
    public ResponseEntity<?> getFeeConfigs() {
        return adminService.getFeeConfigs();
    }

    @PostMapping("/fee-config")
    public ResponseEntity<?> saveFeeConfig(@RequestBody Map<String, Object> request) {
        return adminService.saveFeeConfig(request);
    }

    @PostMapping("/generate-bills")
    public ResponseEntity<?> generateBills(@RequestBody Map<String, Object> request) {
        return adminService.generateBills(request);
    }

    @GetMapping("/charity")
    public ResponseEntity<?> getCharityData() {
        return adminService.getCharityData();
    }
}
