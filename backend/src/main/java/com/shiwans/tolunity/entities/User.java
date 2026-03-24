package com.shiwans.tolunity.entities;


import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Column(name = "phone_number")
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @Column(name = "email", unique = true)
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Column(name = "profile_pic", columnDefinition = "LONGTEXT")
    private String profilePic; // URL or path to profile picture

    @Column(name = "user_role")
    @Enumerated(EnumType.STRING)
    private UserRolesEnum role;       //ROLE_USER, ROLE_ADMIN

    @Column(name= "user_type")
    @Enumerated(EnumType.STRING)
    private UserTypeEnum userType;

    @Column(name = "active_flg")
    private boolean activeFlg = true;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @Column(name = "owner_id")
    private Long ownerId; // For TENANT to select their OWNER

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}



