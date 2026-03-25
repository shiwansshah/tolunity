package com.shiwans.tolunity.Repo.ComplaintRepos;

import com.shiwans.tolunity.entities.Complaints.ComplaintUpvote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ComplaintUpvoteRepository extends JpaRepository<ComplaintUpvote, Long> {
    Optional<ComplaintUpvote> findByComplaintIdAndUserId(Long complaintId, Long userId);
    List<ComplaintUpvote> findByComplaintIdInAndDelFlgFalse(Collection<Long> complaintIds);
}
