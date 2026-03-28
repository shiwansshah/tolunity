package com.shiwans.tolunity.controller.UserController;

import com.shiwans.tolunity.dto.UserDTOs.ChangePasswordRequest;
import com.shiwans.tolunity.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserProfileController {

    @Autowired
    private UserService userService;

    @PostMapping("/profile/picture")
    public ResponseEntity<?> updateProfilePicture(@RequestBody Map<String, String> request) {
        String profilePicUrl = request.get("profilePic");
        return userService.updateProfilePic(profilePicUrl);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        return userService.getCurrentUserProfile();
    }

    @PostMapping("/profile/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String phoneNumber = request.get("phoneNumber");
        return userService.updateProfile(name, phoneNumber);
    }

    @PostMapping("/password/change")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        return userService.changePassword(request);
    }
}
