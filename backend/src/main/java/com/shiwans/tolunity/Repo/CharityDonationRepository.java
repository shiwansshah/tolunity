package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.CharityDonation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CharityDonationRepository extends JpaRepository<CharityDonation, Long> {
    List<CharityDonation> findByDelFlgFalseOrderByCreatedAtDesc();
    List<CharityDonation> findByDonorIdAndDelFlgFalse(Long donorId);
}
