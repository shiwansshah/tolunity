package com.shiwans.tolunity.dto.UserDTOs;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePostRequest {

    @NotNull
    private String content;
    private List<CreatePostRequest.Media> mediaList;

    @Data
    public static class Media{
        private String mediaUrl;
        private String mediaType;

    }
}
