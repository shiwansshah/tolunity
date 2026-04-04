package com.shiwans.tolunity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpoPushNotificationService {

    private static final int MAX_BATCH_SIZE = 100;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.push.expo.enabled:true}")
    private boolean expoPushEnabled;

    @Value("${app.push.expo.endpoint:https://exp.host/--/api/v2/push/send}")
    private String expoPushEndpoint;

    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        if (userId == null) {
            return;
        }

        userRepository.findByIdAndDelFlgFalse(userId)
                .map(User::getExpoPushToken)
                .filter(this::isValidExpoPushToken)
                .ifPresent(token -> sendMessages(List.of(buildMessage(token, title, body, data))));
    }

    public void sendToUsers(Collection<Long> userIds, String title, String body, Map<String, Object> data) {
        if (!expoPushEnabled || userIds == null || userIds.isEmpty()) {
            return;
        }

        List<String> tokens = userRepository.findAllByIdInAndDelFlgFalse(new LinkedHashSet<>(userIds)).stream()
                .map(User::getExpoPushToken)
                .filter(this::isValidExpoPushToken)
                .distinct()
                .toList();

        if (tokens.isEmpty()) {
            return;
        }

        List<Map<String, Object>> messages = tokens.stream()
                .map(token -> buildMessage(token, title, body, data))
                .toList();

        sendMessages(messages);
    }

    private void sendMessages(List<Map<String, Object>> messages) {
        if (!expoPushEnabled || messages == null || messages.isEmpty()) {
            return;
        }

        for (int start = 0; start < messages.size(); start += MAX_BATCH_SIZE) {
            int end = Math.min(start + MAX_BATCH_SIZE, messages.size());
            List<Map<String, Object>> batch = messages.subList(start, end);
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(expoPushEndpoint))
                        .timeout(Duration.ofSeconds(15))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(batch)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 400) {
                    System.err.println("Expo push delivery failed with status " + response.statusCode() + ": " + response.body());
                }
            } catch (IOException | InterruptedException exception) {
                if (exception instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                System.err.println("Failed to deliver Expo push notification: " + exception.getMessage());
            }
        }
    }

    private Map<String, Object> buildMessage(String token, String title, String body, Map<String, Object> data) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("to", token);
        message.put("title", title);
        message.put("body", body);
        message.put("sound", "default");
        message.put("channelId", "default");
        message.put("priority", "high");
        if (data != null && !data.isEmpty()) {
            message.put("data", data);
        }
        return message;
    }

    private boolean isValidExpoPushToken(String token) {
        return expoPushEnabled
                && token != null
                && !token.isBlank()
                && (token.startsWith("ExpoPushToken[") || token.startsWith("ExponentPushToken["));
    }
}
