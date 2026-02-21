package com.shiwans.tolunity.controller;


import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.dto.LoginResponseDto;
import com.shiwans.tolunity.dto.UserLoginDto;
import com.shiwans.tolunity.dto.UserRegisterDto;
import com.shiwans.tolunity.entities.User;
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
import java.util.Map;
import java.util.Optional;

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

        if(userRepo.findUserByEmail(request.getEmail()).isPresent()){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered!"));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole("ROLE_USER");
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

            String token = jwtService.generateToken(user.get().getId(), user.get().getRole());

            LoginResponseDto response = new LoginResponseDto();
            response.setToken(token);
            response.setName(user.get().getName());
            response.setEmail(user.get().getEmail());
            response.setUserRole(user.get().getRole());

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials"));

        }
    }
}
