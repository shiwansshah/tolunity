package com.shiwans.tolunity.entities.Complaints;

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
@Table(name = "complaint_upvotes")
public class ComplaintUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;
}
