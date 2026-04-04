package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.Visitors.VisitorPass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VisitorRepository extends JpaRepository<VisitorPass, Long>, JpaSpecificationExecutor<VisitorPass> {

    List<VisitorPass> findAllByCreatedByIdAndDelFlgFalseOrderByCreatedAtDesc(Long createdById);

    Optional<VisitorPass> findByQrTokenAndDelFlgFalse(String qrToken);

    Page<VisitorPass> findAll(Specification<VisitorPass> specification, Pageable pageable);

    @Query("""
            select distinct v.createdById as id, v.createdByName as name
            from VisitorPass v
            where v.delFlg = false
            order by v.createdByName asc
            """)
    List<VisitorCreatorOption> findDistinctCreatorOptions();

    interface VisitorCreatorOption {
        Long getId();
        String getName();
    }
}
