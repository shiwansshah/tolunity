package com.shiwans.tolunity.Repo.UserRepos;

import com.shiwans.tolunity.entities.Payments.CharityPaymentSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CharityPaymentSessionRepository extends JpaRepository<CharityPaymentSession, Long> {
    Optional<CharityPaymentSession> findByIdAndDelFlgFalse(Long id);
}
