package com.shiwans.tolunity.controller;


import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.dto.LoginResponseDto;
import com.shiwans.tolunity.dto.UserLoginDto;
import com.shiwans.tolunity.dto.UserRegisterDto;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto request){

        List<User> userList = userRepo.findAll();
        for (User user : userList){
            if(request.getEmail().equals(user.getEmail())){
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered!"));
            }

        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(UserRolesEnum.ROLE_USER);
        user.setCreatedAt(new Date());

        userRepo.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User Registered successfully!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDto request){
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            Optional<User> user = userRepo.findUserByEmail(request.getEmail().toLowerCase());
            if (user.isEmpty()) {
                throw new UsernameNotFoundException("User Not Found!");
            }

            String token = jwtService.generateToken(user.get().getEmail(), user.get().getRole().toString());

            user.get().setActiveFlg(true);
            userRepo.save(user.get());

            LoginResponseDto response = new LoginResponseDto();
            response.setToken(token);
            response.setName(user.get().getName());
            response.setEmail(user.get().getEmail());
            response.setUserRole(user.get().getRole().toString());

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials"));

        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            Long currentUserId = com.shiwans.tolunity.Util.SecurityUtil.getCurrentUserId();
            if (currentUserId != null) {
                User user = userRepo.findById(currentUserId).orElse(null);
                if (user != null) {
                    user.setActiveFlg(false);
                    userRepo.save(user);
                }
            }
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Logout failed"));
        }
    }
}
