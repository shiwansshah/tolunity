package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.dto.ComplaintDtos.CreateComplaintRequest;
import com.shiwans.tolunity.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<?> getComplaints() {
        return complaintService.getComplaintsForUsers();
    }

    @PostMapping
    public ResponseEntity<?> createComplaint(@RequestBody CreateComplaintRequest request) {
        return complaintService.createComplaint(request);
    }

    @PostMapping("/{complaintId}/upvote")
    public ResponseEntity<?> toggleUpvote(@PathVariable Long complaintId) {
        return complaintService.toggleUpvote(complaintId);
    }
}
