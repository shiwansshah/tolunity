package com.shiwans.tolunity.Repo.ComplaintRepos;

import com.shiwans.tolunity.entities.Complaints.ComplaintMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ComplaintMediaRepository extends JpaRepository<ComplaintMedia, Long> {
    List<ComplaintMedia> findByComplaintIdInAndDelFlgFalseOrderByIdAsc(Collection<Long> complaintIds);
}
