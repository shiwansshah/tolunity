package com.shiwans.tolunity.Repo.UserRepos;

import com.shiwans.tolunity.entities.Payments.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByDelFlgFalseOrderByDueDateDesc();
    List<Payment> findAllByDelFlgFalseAndDueDateBetweenOrderByDueDateAsc(Date start, Date end);
    List<Payment> findByPayerIdAndDelFlgFalseOrderByDueDateDesc(Long payerId);
    List<Payment> findByPayeeIdAndDelFlgFalseOrderByDueDateDesc(Long payeeId);
    Optional<Payment> findByIdAndDelFlgFalse(Long id);
}
