package com.shiwans.tolunity.dto.AlertDtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AlertResponse {
    private Long id;
    private String title;
    private String description;
    private Long createdById;
    private String createdByName;
    @JsonProperty("isRead")
    private boolean isRead;
    private Date createdAt;
    private List<MediaItem> mediaList;

    @Data
    public static class MediaItem {
        private Long id;
        private String mediaUrl;
        private String mediaType;
    }
}
