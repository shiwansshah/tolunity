package com.shiwans.tolunity.config;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Optional<User> existingAdmin = userRepo.findUserByEmail("admin@tolunity.com");
        
        if (existingAdmin.isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@tolunity.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPhoneNumber("admin");
            admin.setRole(UserRolesEnum.ROLE_ADMIN);
            admin.setCreatedAt(new Date());
            admin.setActiveFlg(true);
            admin.setDelFlg(false);
            
            userRepo.save(admin);
            System.out.println("Admin user seeded: admin@tolunity.com | Password: admin123");
        }
    }
}
