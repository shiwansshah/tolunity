package com.shiwans.tolunity.Repo.AlertRepos;

import com.shiwans.tolunity.entities.Alerts.AlertReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertReadReceiptRepository extends JpaRepository<AlertReadReceipt, Long> {
    List<AlertReadReceipt> findByAlertIdInAndUserIdAndDelFlgFalse(List<Long> alertIds, Long userId);
    Optional<AlertReadReceipt> findByAlertIdAndUserIdAndDelFlgFalse(Long alertId, Long userId);
}
