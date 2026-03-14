package com.shiwans.tolunity.Repo.UserRepos;

import com.shiwans.tolunity.entities.UserEntities.UserFeed.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

}
