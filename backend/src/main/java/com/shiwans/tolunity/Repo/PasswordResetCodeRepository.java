package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    void deleteByUserId(Long userId);

    Optional<PasswordResetCode> findTopByUserIdAndDelFlgFalseOrderByCreatedAtDesc(Long userId);
}
