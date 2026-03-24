package com.shiwans.tolunity.Repo.AdminRepos;

import com.shiwans.tolunity.entities.Payments.FeeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface FeeConfigRepository extends JpaRepository<FeeConfig, Long> {
    Optional<FeeConfig> findByFeeTypeAndActiveFlgTrue(String feeType);
    List<FeeConfig> findByActiveFlgTrueOrderByFeeTypeAsc();
}
