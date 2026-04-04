package com.shiwans.tolunity.controller.AdminController;

import com.shiwans.tolunity.dto.ComplaintDtos.UpdateComplaintStatusRequest;
import com.shiwans.tolunity.service.MobileAboutContentService;
import com.shiwans.tolunity.service.AdminServices.AdminAuditService;
import com.shiwans.tolunity.service.ComplaintService;
import com.shiwans.tolunity.service.AdminServices.AdminService;
import com.shiwans.tolunity.service.VisitorService;
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
    private final AdminAuditService adminAuditService;
    private final ComplaintService complaintService;
    private final VisitorService visitorService;
    private final MobileAboutContentService mobileAboutContentService;

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

    @PutMapping("/payments/{paymentId}/transaction")
    public ResponseEntity<?> updatePaymentTransaction(@PathVariable Long paymentId, @RequestBody Map<String, Object> request) {
        return adminService.updatePaymentTransaction(paymentId, request);
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

    @PostMapping("/charity/manual")
    public ResponseEntity<?> addManualCharityEntry(@RequestBody Map<String, Object> request) {
        return adminService.addManualCharityEntry(request);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return adminAuditService.getAuditLogs();
    }

    @GetMapping("/visitors")
    public ResponseEntity<?> getVisitorLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long createdById,
            @RequestParam(required = false) String visitStatus,
            @RequestParam(required = false) String search
    ) {
        return visitorService.getAdminVisitorLog(page, size, createdById, visitStatus, search);
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> getComplaints() {
        return complaintService.getComplaintsForAdmins();
    }

    @PutMapping("/complaints/{complaintId}/status")
    public ResponseEntity<?> updateComplaintStatus(
            @PathVariable Long complaintId,
            @RequestBody UpdateComplaintStatusRequest request
    ) {
        return complaintService.updateComplaintStatus(complaintId, request);
    }

    @GetMapping("/mobile-about")
    public ResponseEntity<?> getMobileAboutContent() {
        return ResponseEntity.ok(mobileAboutContentService.getAdminContent());
    }

    @PutMapping("/mobile-about")
    public ResponseEntity<?> saveMobileAboutContent(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(mobileAboutContentService.saveContent(request));
    }
}
