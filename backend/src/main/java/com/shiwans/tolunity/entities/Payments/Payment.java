package com.shiwans.tolunity.entities.Payments;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private Double amount;
    private Date dueDate;
    
    @Column(name = "status")
    private String status; // PENDING, PAID, OVERDUE
    
    @Column(name = "category")
    private String category; // RENT, UTILITY, MAINTENANCE, FEE

    private Date paidDate;

    @Column(name = "gateway_provider")
    private String gatewayProvider;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "gateway_reference_id")
    private String gatewayReferenceId;

    @Column(name = "gateway_status")
    private String gatewayStatus;

    @Column(name = "interval_days")
    private Integer intervalDays; // Billing interval in days (e.g. 30 for monthly)

    // The user who has to pay (Tenant)
    @Column(name = "payer_id")
    private Long payerId;

    // The user who receives it (Owner/System)
    @Column(name = "payee_id")
    private Long payeeId;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;
}
