package com.shiwans.tolunity.entities.UserEntities.UserFeed;

import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.MediaTypeEnum;
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
@Table(name = "post_media")
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "media_url", columnDefinition = "LONGTEXT")
    private String mediaUrl;

    @Column(name = "media_type")
    @Enumerated(EnumType.STRING)
    private MediaTypeEnum mediaType;

    @Column(name = "del_flg")
    private boolean delFlg = false;

    @JoinColumn(name = "post_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Post post;

}
