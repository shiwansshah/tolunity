package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByDelFlgFalseOrderByDueDateDesc();
    List<Payment> findByPayerIdAndDelFlgFalseOrderByDueDateDesc(Long payerId);
    List<Payment> findByPayeeIdAndDelFlgFalseOrderByDueDateDesc(Long payeeId);
    Optional<Payment> findByIdAndDelFlgFalse(Long id);
}
