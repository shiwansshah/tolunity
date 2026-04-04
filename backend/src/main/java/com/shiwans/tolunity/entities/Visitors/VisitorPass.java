package com.shiwans.tolunity.entities.Visitors;

import jakarta.persistence.*;
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
@Table(name = "visitor_pass")
public class VisitorPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_name", nullable = false)
    private String visitorName;

    @Column(name = "visitor_contact", nullable = false)
    private String visitorContact;

    @Column(name = "expected_visit_at", nullable = false)
    private Date expectedVisitAt;

    @Column(name = "valid_from", nullable = false)
    private Date validFrom;

    @Column(name = "valid_until", nullable = false)
    private Date validUntil;

    @Column(name = "qr_token", nullable = false, unique = true, length = 120)
    private String qrToken;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

    @Column(name = "created_by_name", nullable = false)
    private String createdByName;

    @Column(name = "created_by_user_type", nullable = false, length = 32)
    private String createdByUserType;

    @Column(name = "verified_by_id")
    private Long verifiedById;

    @Column(name = "verified_by_name")
    private String verifiedByName;

    @Column(name = "visited_at")
    private Date visitedAt;

    @Column(name = "del_flg", nullable = false)
    @Builder.Default
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
