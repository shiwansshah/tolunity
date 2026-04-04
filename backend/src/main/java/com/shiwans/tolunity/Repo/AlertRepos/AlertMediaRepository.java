package com.shiwans.tolunity.Repo.AlertRepos;

import com.shiwans.tolunity.entities.Alerts.AlertMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertMediaRepository extends JpaRepository<AlertMedia, Long> {
    List<AlertMedia> findByAlertIdInAndDelFlgFalseOrderByIdAsc(List<Long> alertIds);
}
