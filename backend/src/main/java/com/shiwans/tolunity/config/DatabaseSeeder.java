package com.shiwans.tolunity.config;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${app.seed.admin.email}")
    private String adminEmail;

    @Value("${app.seed.admin.password}")
    private String adminPassword;

    @Value("${app.seed.admin.name}")
    private String adminName;

    @Value("${app.seed.admin.phone}")
    private String adminPhone;

    @Override
    public void run(String... args) throws Exception {
        normalizeUserColumns();

        String normalizedAdminEmail = adminEmail.trim().toLowerCase();
        Optional<User> existingAdmin = userRepo.findUserByEmail(normalizedAdminEmail);
        
        if (existingAdmin.isEmpty()) {
            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(normalizedAdminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setPhoneNumber(adminPhone);
            admin.setRole(UserRolesEnum.ROLE_ADMIN);
            admin.setUserType(UserTypeEnum.ADMIN);
            admin.setCreatedAt(new Date());
            admin.setActiveFlg(true);
            admin.setDelFlg(false);
            
            userRepo.save(admin);
            System.out.println("Admin user seeded: " + normalizedAdminEmail);
            return;
        }

        User admin = existingAdmin.get();
        boolean updated = false;

        if (admin.getRole() != UserRolesEnum.ROLE_ADMIN) {
            admin.setRole(UserRolesEnum.ROLE_ADMIN);
            updated = true;
        }
        if (admin.getUserType() != UserTypeEnum.ADMIN) {
            admin.setUserType(UserTypeEnum.ADMIN);
            updated = true;
        }
        if (updated) {
            userRepo.save(admin);
            System.out.println("Admin user normalized: " + normalizedAdminEmail);
        }
    }

    private void normalizeUserColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE user MODIFY COLUMN user_type VARCHAR(32) NULL");
        } catch (Exception ignored) {
            // Ignore if the table/column is already compatible in this environment.
        }
        try {
            jdbcTemplate.execute("ALTER TABLE user MODIFY COLUMN user_role VARCHAR(32) NULL");
        } catch (Exception ignored) {
            // Ignore if the table/column is already compatible in this environment.
        }
        try {
            jdbcTemplate.execute("UPDATE user SET user_type = UPPER(user_type) WHERE user_type IS NOT NULL");
        } catch (Exception ignored) {
            // Ignore if the table/column is already compatible in this environment.
        }
        try {
            jdbcTemplate.execute("UPDATE user SET user_role = UPPER(user_role) WHERE user_role IS NOT NULL");
        } catch (Exception ignored) {
            // Ignore if the table/column is already compatible in this environment.
        }
    }
}
