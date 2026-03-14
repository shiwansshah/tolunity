package com.shiwans.tolunity.entities.UserEntities.UserFeed;

import com.shiwans.tolunity.entities.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    private Date createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Lob
    @Column(name = "post_content")
    @NotBlank(message = "Content is required!")
    private String postContent;

    @Column(name = "post_likes")
    private Long postLikes=0L;

    @Column(name = "post_comments")
    private Long postComments=0L;

    @JoinColumn(name = "user_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Column(name = "del_flg")
    private boolean delFlg = false;
}
