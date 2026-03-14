package com.shiwans.tolunity.dto.UserDTOs;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class PostCommentResponse {
    private Long commentId;
    private String content;
    private String username;
    private String userProfilePic;
    private Date createdAt;
}
