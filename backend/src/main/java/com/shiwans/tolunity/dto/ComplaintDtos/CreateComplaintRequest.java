package com.shiwans.tolunity.dto.ComplaintDtos;

import lombok.Data;

import java.util.List;

@Data
public class CreateComplaintRequest {
    private String title;
    private String description;
    private String category;
    private List<MediaPayload> mediaList;

    @Data
    public static class MediaPayload {
        private String mediaUrl;
        private String mediaType;
    }
}
