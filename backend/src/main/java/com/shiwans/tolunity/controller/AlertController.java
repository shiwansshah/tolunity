package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.dto.AlertDtos.AlertRequest;
import com.shiwans.tolunity.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(alertService.getAlertsForCurrentUser());
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@RequestBody AlertRequest request) {
        return alertService.createAlert(request);
    }

    @PutMapping("/{alertId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long alertId) {
        alertService.markAsRead(alertId);
        return ResponseEntity.ok(Map.of("message", "Alert marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        alertService.markAllAsRead();
        return ResponseEntity.ok(Map.of("message", "All alerts marked as read"));
    }
}
