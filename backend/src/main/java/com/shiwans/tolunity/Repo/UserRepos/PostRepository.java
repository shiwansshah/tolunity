package com.shiwans.tolunity.Repo.UserRepos;

import com.shiwans.tolunity.entities.UserEntities.UserFeed.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findAllByDelFlgFalseOrderByCreatedAtDesc(Pageable pageable);
}
