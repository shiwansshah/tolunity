package com.shiwans.tolunity.controller.UserController;


import com.shiwans.tolunity.dto.UserDTOs.CreatePostRequest;
import com.shiwans.tolunity.service.UserServices.FeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class UserFeedController {

    private final FeedService feedService;

    @PostMapping("/createPost")
    public ResponseEntity<?> createPost(@Valid @RequestBody CreatePostRequest request) {
        return feedService.createPost(request);
    }

    @PostMapping("/editPost/{postId}")
    public ResponseEntity<?> editPost(
            @PathVariable Long postId,
            @Valid @RequestBody CreatePostRequest request) {

        return feedService.editPost(postId, request);
    }

    @PostMapping("/deletePost/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId) {

        return feedService.deletePost(postId);
    }

    @GetMapping("/getFeed")
    public ResponseEntity<?> getFeed(Pageable pageable) {
        return feedService.getFeed(pageable);
    }

    @PostMapping("/likePost/{postId}")
    public ResponseEntity<?> likePost(@PathVariable Long postId) {
        return feedService.toggleLike(postId);
    }
}
