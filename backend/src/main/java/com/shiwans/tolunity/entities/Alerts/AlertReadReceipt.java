package com.shiwans.tolunity.entities.Alerts;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "alert_read_receipts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_alert_receipt_alert_user", columnNames = {"alert_id", "user_id"})
        }
)
public class AlertReadReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "read_at", nullable = false, updatable = false)
    private Date readAt;

    @Column(name = "del_flg", nullable = false)
    private boolean delFlg = false;
}
