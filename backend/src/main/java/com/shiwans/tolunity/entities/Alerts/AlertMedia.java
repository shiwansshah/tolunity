package com.shiwans.tolunity.entities.Alerts;

import com.shiwans.tolunity.enums.MediaTypeEnum;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "alert_media")
public class AlertMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "media_url", columnDefinition = "LONGTEXT")
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    private MediaTypeEnum mediaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    @Column(name = "del_flg", nullable = false)
    private boolean delFlg = false;
}
