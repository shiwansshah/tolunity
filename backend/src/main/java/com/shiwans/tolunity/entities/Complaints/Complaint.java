package com.shiwans.tolunity.entities.Complaints;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String category;

    private String status;

    @Column(name = "resolution_note", columnDefinition = "LONGTEXT")
    private String resolutionNote;

    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private Date updatedAt;
}
