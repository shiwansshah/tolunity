package com.shiwans.tolunity.entities.Payments;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "charity_payment_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharityPaymentSession {

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

    @Column(name = "gateway_provider")
    private String gatewayProvider;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "gateway_reference_id")
    private String gatewayReferenceId;

    @Column(name = "gateway_status")
    private String gatewayStatus;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
