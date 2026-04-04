package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.MobileAboutContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MobileAboutContentRepository extends JpaRepository<MobileAboutContent, Long> {

    Optional<MobileAboutContent> findTopByDelFlgFalseOrderByIdDesc();
}
