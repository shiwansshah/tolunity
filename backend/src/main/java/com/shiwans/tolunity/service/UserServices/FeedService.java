package com.shiwans.tolunity.service.UserServices;

import com.shiwans.tolunity.Repo.UserRepos.PostCommentRepository;
import com.shiwans.tolunity.Repo.UserRepos.PostLikeRepository;
import com.shiwans.tolunity.Repo.UserRepos.PostMediaRepository;
import com.shiwans.tolunity.Repo.UserRepos.PostRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.dto.UserDTOs.CreatePostRequest;
import com.shiwans.tolunity.dto.UserDTOs.FeedPostsResponse;
import com.shiwans.tolunity.dto.UserDTOs.PostCommentResponse;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.entities.UserEntities.UserFeed.Post;
import com.shiwans.tolunity.entities.UserEntities.UserFeed.PostComment;
import com.shiwans.tolunity.entities.UserEntities.UserFeed.PostLike;
import com.shiwans.tolunity.entities.UserEntities.UserFeed.PostMedia;
import com.shiwans.tolunity.enums.MediaTypeEnum;
import com.shiwans.tolunity.enums.NotificationTypeEnum;
import com.shiwans.tolunity.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.stylesheets.MediaList;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FeedService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostMediaRepository postMediaRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private PostCommentRepository postCommentRepository;

    @Autowired
    private NotificationService notificationService;
    
    @Transactional
    public ResponseEntity<?> createPost(CreatePostRequest request) {
        try {
            boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty();
            boolean hasMedia = request.getMediaList() != null && !request.getMediaList().isEmpty();
            if (!hasContent && !hasMedia) {
                throw new IllegalArgumentException("Post must contain text or media");
            }
            Post post = new Post();

            post.setPostContent(hasContent ? request.getContent().trim() : null);

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            post.setUser(user);

            postRepository.save(post);

            if(request.getMediaList() !=null && !request.getMediaList().isEmpty()){
                request.getMediaList().forEach(media -> {
                    PostMedia postMedia = new PostMedia();
                    postMedia.setMediaUrl(media.getMediaUrl());
                    postMedia.setPost(post);
                    if("image".equalsIgnoreCase(media.getMediaType())){
                        postMedia.setMediaType(MediaTypeEnum.IMAGE);
                    } else if("video".equalsIgnoreCase(media.getMediaType())){
                        postMedia.setMediaType(MediaTypeEnum.VIDEO);
                    } else {
                        try {
                            throw new Exception("Please specify appropiate media type!");
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }
                    postMediaRepository.save(postMedia);
                });
            }
            Map<String, String> response = new HashMap<>();
            response.put("message", "Post created successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to create post: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @Transactional
    public ResponseEntity<?> editPost(Long postId, CreatePostRequest request) {

        try {

            if ((request.getContent() == null || request.getContent().trim().isEmpty()) 
                && (request.getMediaList() == null || request.getMediaList().isEmpty())) {
                throw new Exception("Post must contain text or media");
            }

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if (user == null) {
                throw new Exception("User Not Found!");
            }

            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            // check ownership
            if (!post.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "You cannot edit this post"));
            }

            // update content
            post.setPostContent(request.getContent());
            postRepository.save(post);

            // remove old media
            postMediaRepository.deleteAllByPostId(postId);

            // add updated media
            if (request.getMediaList() != null && !request.getMediaList().isEmpty()) {

                request.getMediaList().forEach(media -> {

                    PostMedia postMedia = new PostMedia();
                    postMedia.setMediaUrl(media.getMediaUrl());
                    postMedia.setPost(post);

                    if ("image".equalsIgnoreCase(media.getMediaType())) {
                        postMedia.setMediaType(MediaTypeEnum.IMAGE);
                    } else if ("video".equalsIgnoreCase(media.getMediaType())) {
                        postMedia.setMediaType(MediaTypeEnum.VIDEO);
                    } else {
                        throw new RuntimeException("Please specify appropriate media type!");
                    }

                    postMediaRepository.save(postMedia);
                });
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Post updated successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to update post: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    @Transactional
    public ResponseEntity<?> deletePost(Long postId) {

        try {

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if (user == null) {
                throw new Exception("User Not Found!");
            }

            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            // check ownership
            if (!post.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "You cannot delete this post"));
            }

            if (post.isDelFlg()) {
                return ResponseEntity.ok(Map.of("message", "Post already deleted"));
            }

            post.setDelFlg(true);

            postRepository.save(post);

            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));

        } catch (Exception e) {

            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @Transactional(readOnly = true)
    public ResponseEntity<?> getFeed(Pageable pageable) {

        try {

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if(user == null){
                throw new Exception("User Not Found!");
            }

            Long currentUserId = user.getId();

            Page<Post> posts = postRepository.findAllByDelFlgFalseOrderByCreatedAtDesc(pageable);

            Page<FeedPostsResponse> response =
                    posts.map(post -> mapToResponse(post, currentUserId));

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to fetch feed: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }



    private FeedPostsResponse mapToResponse(Post post, Long currentUserId) {

        FeedPostsResponse response = new FeedPostsResponse();

        response.setPostId(post.getId());
        response.setAuthorUsername(post.getUser().getName());
        response.setAuthorProfilePictureUrl(post.getUser().getProfilePic());
        response.setContent(post.getPostContent());
        response.setLikesCount(post.getPostLikes());
        response.setCommentsCount(post.getPostComments());
        response.setCreatedAt(post.getCreatedAt());

        boolean liked =
                postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        response.setLikedByCurrentUser(liked);

        List<PostMedia> mediaListForFeedPost =
                postMediaRepository.findAllByPostId(post.getId());

        List<FeedPostsResponse.Media> mediaList =
                mediaListForFeedPost.stream().map(media -> {

                    FeedPostsResponse.Media m = new FeedPostsResponse.Media();
                    m.setMediaUrl(media.getMediaUrl());
                    m.setMediaType(media.getMediaType().name());

                    return m;

                }).toList();

        response.setMedias(mediaList);

        return response;
    }
    @Transactional
    public ResponseEntity<?> toggleLike(Long postId) {

        try {

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if(user == null){
                throw new Exception("User Not Found!");
            }
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            Optional<PostLike> existingLike =
                    postLikeRepository.findByPostIdAndUserId(postId, user.getId());

            Map<String, Object> response = new HashMap<>();

            if (existingLike.isPresent()) {

                // UNLIKE
                postLikeRepository.delete(existingLike.get());

                if (post.getPostLikes() > 0) {
                    post.setPostLikes(post.getPostLikes() - 1);
                }

                response.put("liked", false);
                response.put("message", "Post unliked");

            } else {

                // LIKE
                PostLike like = new PostLike();
                like.setPost(post);
                like.setUser(user);

                postLikeRepository.save(like);

                post.setPostLikes(post.getPostLikes() + 1);
                notificationService.notifyPostInteraction(user.getId(), post.getUser().getId(), NotificationTypeEnum.LIKE);

                response.put("liked", true);
                response.put("message", "Post liked");
            }

            postRepository.save(post);

            response.put("likesCount", post.getPostLikes());

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to toggle like: " + e.getMessage());

            return ResponseEntity.status(500).body(error);
        }
    }

    @Transactional
    public ResponseEntity<?> createComment(Long postId, String content) {

        try {
            if (content == null || content.trim().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment content cannot be empty"));
            }

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if(user == null){
                throw new Exception("User Not Found!");
            }

            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            PostComment comment = new PostComment();
            comment.setPostComment(content.trim());
            comment.setUser(user);   // who wrote the comment
            comment.setPost(post);

            postCommentRepository.save(comment);

            post.setPostComments(post.getPostComments() + 1);
            postRepository.save(post);
            notificationService.notifyPostInteraction(user.getId(), post.getUser().getId(), NotificationTypeEnum.COMMENT);

            return ResponseEntity.ok(Map.of("message", "Comment created"));

        } catch (Exception e) {

            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Transactional
    public ResponseEntity<?> deleteComment(Long commentId) {

        try {

            User user = userRepository.findUserById(SecurityUtil.getCurrentUserId());
            if (user == null) {
                throw new Exception("User Not Found!");
            }

            PostComment comment = postCommentRepository.findById(commentId)
                    .orElseThrow(() -> new RuntimeException("Comment not found"));

            // check ownership
            if (!comment.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "You are not allowed to delete this comment"));
            }

            if (comment.isDelFlg()) {
                return ResponseEntity.ok(Map.of("message", "Comment already deleted"));
            }

            // soft delete
            comment.setDelFlg(true);
            postCommentRepository.save(comment);

            Post post = comment.getPost();

            if (post.getPostComments() > 0) {
                post.setPostComments(post.getPostComments() - 1);
                postRepository.save(post);
            }

            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));

        } catch (Exception e) {

            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getPostComments(Long postId) {
        try {
            List<PostComment> comments = postCommentRepository.findAllByPostIdAndDelFlgFalseOrderByCreatedAtDesc(postId);
            
            List<PostCommentResponse> response = comments.stream().map(comment -> 
                PostCommentResponse.builder()
                        .commentId(comment.getId())
                        .content(comment.getPostComment())
                        .username(comment.getUser().getName())
                        .userProfilePic(comment.getUser().getProfilePic())
                        .createdAt(comment.getCreatedAt())
                        .build()
            ).toList();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
