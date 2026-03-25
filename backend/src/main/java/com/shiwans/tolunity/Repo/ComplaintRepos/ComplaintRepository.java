package com.shiwans.tolunity.Repo.ComplaintRepos;

import com.shiwans.tolunity.entities.Complaints.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByDelFlgFalseOrderByCreatedAtDesc();
    Optional<Complaint> findByIdAndDelFlgFalse(Long id);
}
