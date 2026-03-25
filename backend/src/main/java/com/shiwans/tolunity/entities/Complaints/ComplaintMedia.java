package com.shiwans.tolunity.entities.Complaints;

import com.shiwans.tolunity.enums.MediaTypeEnum;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "complaint_media")
public class ComplaintMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "media_url", columnDefinition = "LONGTEXT")
    private String mediaUrl;

    @Column(name = "media_type")
    @Enumerated(EnumType.STRING)
    private MediaTypeEnum mediaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    @Column(name = "del_flg")
    private boolean delFlg = false;
}
