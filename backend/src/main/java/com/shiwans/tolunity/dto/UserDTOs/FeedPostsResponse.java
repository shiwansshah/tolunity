package com.shiwans.tolunity.dto.UserDTOs;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
public class FeedPostsResponse {
    private Long postId;
    private String authorUsername;
    private String authorProfilePictureUrl;
    private String content;
    private Long likesCount;
    private Long commentsCount;
    private Boolean likedByCurrentUser;
    private List<Media> medias;
    private Date createdAt;

    @Data
    public static class Media{

        private String mediaUrl;
        private String mediaType;
    }
}
