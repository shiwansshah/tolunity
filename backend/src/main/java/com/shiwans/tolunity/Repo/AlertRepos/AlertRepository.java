package com.shiwans.tolunity.Repo.AlertRepos;

import com.shiwans.tolunity.entities.Alerts.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findAllByDelFlgFalseOrderByCreatedAtDesc();
}
