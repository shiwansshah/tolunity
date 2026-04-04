package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.service.MobileAboutContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mobile-content")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MobileContentController {

    private final MobileAboutContentService mobileAboutContentService;

    @GetMapping("/about")
    public ResponseEntity<?> getAboutContent() {
        return ResponseEntity.ok(mobileAboutContentService.getPublicContent());
    }
}
