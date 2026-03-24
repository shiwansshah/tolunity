package com.shiwans.tolunity.entities.Payments;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Table(name = "charity_donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharityDonation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "donor_id", nullable = false)
    private Long donorId;

    @Column(name = "donor_name")
    private String donorName;

    @Column(nullable = false)
    private Double amount;

    private String message;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;
}
