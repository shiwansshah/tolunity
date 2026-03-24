package com.shiwans.tolunity.entities.Payments;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "fee_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fee_type", nullable = false, unique = true)
    private String feeType; // MAINTENANCE, ELECTRICITY, GARBAGE

    @Column(nullable = false)
    private Double amount;

    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays; // e.g. 30 = monthly

    private String description;

    @Column(name = "active_flg")
    private boolean activeFlg = true;

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
