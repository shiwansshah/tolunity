package com.shiwans.tolunity.dto.ComplaintDtos;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String status;
    private String resolutionNote;
    private Long createdById;
    private String createdByName;
    private long upvoteCount;
    private boolean upvotedByCurrentUser;
    private Date createdAt;
    private Date updatedAt;
    private List<MediaItem> mediaList;
    private FollowUpContact followUpContact;

    @Data
    public static class MediaItem {
        private Long id;
        private String mediaUrl;
        private String mediaType;
    }

    @Data
    public static class FollowUpContact {
        private String name;
        private String phoneNumber;
        private String email;
    }
}
