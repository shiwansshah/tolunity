package com.shiwans.tolunity.dto.AlertDtos;

import lombok.Data;

import java.util.List;

@Data
public class AlertRequest {
    private String title;
    private String description;
    private List<MediaPayload> mediaList;

    @Data
    public static class MediaPayload {
        private String mediaUrl;
        private String mediaType;
    }
}
