package com.shiwans.tolunity.Repo.UserRepos;

import com.shiwans.tolunity.entities.UserEntities.UserFeed.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    List<PostMedia> findAllByPostId(Long postId);
    void deleteAllByPostId(Long postId);
}
