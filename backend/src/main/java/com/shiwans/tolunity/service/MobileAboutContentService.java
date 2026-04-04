package com.shiwans.tolunity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiwans.tolunity.Repo.MobileAboutContentRepository;
import com.shiwans.tolunity.entities.MobileAboutContent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MobileAboutContentService {

    private final MobileAboutContentRepository mobileAboutContentRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> getPublicContent() {
        return toResponse(findLatestContent().orElseGet(this::buildDefaultContent));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminContent() {
        return toResponse(findLatestContent().orElseGet(this::buildDefaultContent));
    }

    @Transactional
    public Map<String, Object> saveContent(Map<String, Object> request) {
        MobileAboutContent content = findLatestContent().orElseGet(this::buildDefaultContent);

        String title = normalizeText(request.get("title"));
        if (title == null) {
            throw new IllegalArgumentException("title is required");
        }

        String description = normalizeText(request.get("description"));
        List<Map<String, Object>> mediaItems = normalizeMediaItems(request.get("mediaItems"));

        content.setTitle(title);
        content.setDescription(description != null ? description : "");
        content.setMediaJson(writeMediaJson(mediaItems));

        mobileAboutContentRepository.save(content);
        return toResponse(content);
    }

    private java.util.Optional<MobileAboutContent> findLatestContent() {
        return mobileAboutContentRepository.findTopByDelFlgFalseOrderByIdDesc();
    }

    private MobileAboutContent buildDefaultContent() {
        return MobileAboutContent.builder()
                .title("About TolUnity")
                .description("TolUnity helps residents, tenants, and administrators stay connected in one place.")
                .mediaJson("[]")
                .build();
    }

    private Map<String, Object> toResponse(MobileAboutContent content) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", content.getId());
        response.put("title", content.getTitle());
        response.put("description", content.getDescription() != null ? content.getDescription() : "");
        response.put("mediaItems", readMediaJson(content.getMediaJson()));
        response.put("updatedAt", content.getUpdatedAt());
        return response;
    }

    private List<Map<String, Object>> normalizeMediaItems(Object rawMediaItems) {
        if (!(rawMediaItems instanceof List<?> items)) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> normalized = new ArrayList<>();
        int index = 0;
        for (Object rawItem : items) {
            if (!(rawItem instanceof Map<?, ?> itemMap)) {
                continue;
            }

            String mediaUrl = normalizeText(itemMap.get("mediaUrl"));
            if (mediaUrl == null) {
                continue;
            }

            String mediaType = normalizeMediaType(normalizeText(itemMap.get("mediaType")));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", normalizeText(itemMap.get("id")) != null ? normalizeText(itemMap.get("id")) : "media-" + (++index));
            item.put("mediaType", mediaType);
            item.put("mediaUrl", mediaUrl);
            normalized.add(item);
        }

        return normalized;
    }

    private String normalizeMediaType(String mediaType) {
        if (mediaType == null) {
            return "IMAGE";
        }

        String normalized = mediaType.toUpperCase(Locale.ROOT);
        return "VIDEO".equals(normalized) ? "VIDEO" : "IMAGE";
    }

    private List<Map<String, Object>> readMediaJson(String mediaJson) {
        if (mediaJson == null || mediaJson.isBlank()) {
            return new ArrayList<>();
        }

        try {
            return objectMapper.readValue(mediaJson, new TypeReference<>() {});
        } catch (Exception exception) {
            return new ArrayList<>();
        }
    }

    private String writeMediaJson(List<Map<String, Object>> mediaItems) {
        try {
            return objectMapper.writeValueAsString(mediaItems);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Failed to serialize media items");
        }
    }

    private String normalizeText(Object rawValue) {
        if (rawValue == null) {
            return null;
        }

        String normalized = rawValue.toString().trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
