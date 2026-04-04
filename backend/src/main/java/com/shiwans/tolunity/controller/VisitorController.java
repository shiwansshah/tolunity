package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.dto.Visitors.VisitorCreateRequest;
import com.shiwans.tolunity.dto.Visitors.VisitorVerifyRequest;
import com.shiwans.tolunity.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/visitors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;

    @GetMapping("/my")
    public ResponseEntity<?> getMyVisitors() {
        return visitorService.getMyVisitorPasses();
    }

    @PostMapping
    public ResponseEntity<?> createVisitor(@RequestBody VisitorCreateRequest request) {
        return visitorService.createVisitorPass(request);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyVisitor(@RequestBody VisitorVerifyRequest request) {
        return visitorService.verifyVisitorPass(request);
    }
}
