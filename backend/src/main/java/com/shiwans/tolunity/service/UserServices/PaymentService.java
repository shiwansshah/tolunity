package com.shiwans.tolunity.service.UserServices;

import com.shiwans.tolunity.Repo.AdminRepos.CharityDonationRepository;
import com.shiwans.tolunity.Repo.UserRepos.PaymentRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.AccessDeniedException;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.entities.Payments.CharityDonation;
import com.shiwans.tolunity.entities.Payments.Payment;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserTypeEnum;
import com.shiwans.tolunity.service.PaymentDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CharityDonationRepository charityDonationRepository;
    private final PaymentDtoMapper paymentDtoMapper;

    public ResponseEntity<?> getPayments() {
        Long currentUserId = getCurrentUserId();
        User currentUser = getCurrentUser(currentUserId);

        List<Payment> payments;
        if (currentUser.getUserType() == UserTypeEnum.OWNER) {
            List<Payment> asPayee = paymentRepository.findByPayeeIdAndDelFlgFalseOrderByDueDateDesc(currentUserId);
            List<Payment> asPayer = paymentRepository.findByPayerIdAndDelFlgFalseOrderByDueDateDesc(currentUserId);

            Map<Long, Payment> distinctPayments = new LinkedHashMap<>();
            asPayee.forEach(payment -> distinctPayments.put(payment.getId(), payment));
            asPayer.forEach(payment -> distinctPayments.put(payment.getId(), payment));

            payments = distinctPayments.values().stream()
                    .sorted(Comparator.comparing(Payment::getDueDate, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        } else {
            payments = paymentRepository.findByPayerIdAndDelFlgFalseOrderByDueDateDesc(currentUserId);
        }

        return ResponseEntity.ok(paymentDtoMapper.toDtos(payments));
    }

    public ResponseEntity<?> payBill(Long paymentId) {
        Long currentUserId = getCurrentUserId();
        Payment payment = paymentRepository.findByIdAndDelFlgFalse(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment with ID " + paymentId + " not found"));

        if ("Paid".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("This payment has already been paid");
        }
        if (!currentUserId.equals(payment.getPayerId())) {
            throw new AccessDeniedException("You are not authorized to pay this bill");
        }

        payment.setStatus("Paid");
        payment.setPaidDate(new Date());
        paymentRepository.save(payment);

        return ResponseEntity.ok(Map.of("message", "Payment successful"));
    }

    public ResponseEntity<?> createBill(Map<String, Object> request) {
        Long currentUserId = getCurrentUserId();
        User currentUser = getCurrentUser(currentUserId);

        if (currentUser.getUserType() != UserTypeEnum.OWNER) {
            throw new AccessDeniedException("Only property owners can create bills");
        }

        String title = (String) request.get("title");
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        Double amount = request.get("amount") != null ? Double.valueOf(request.get("amount").toString()) : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be a positive number");
        }

        Long payerId = request.get("payerId") != null ? Long.valueOf(request.get("payerId").toString()) : null;
        if (payerId == null) {
            throw new IllegalArgumentException("Tenant (payerId) is required");
        }

        User tenant = userRepository.findByIdAndDelFlgFalse(payerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant with ID " + payerId + " not found"));
        if (tenant.getUserType() != UserTypeEnum.TENANT) {
            throw new IllegalArgumentException("Bills can only be created for tenant users");
        }
        if (!currentUserId.equals(tenant.getOwnerId())) {
            throw new AccessDeniedException("This tenant does not belong to you");
        }

        String category = (String) request.get("category");
        if (category != null && !"RENT".equalsIgnoreCase(category)) {
            throw new IllegalArgumentException("Owners can only create RENT bills for tenants. System fees are managed by admin.");
        }

        Integer intervalDays = request.get("intervalDays") != null
                ? Integer.valueOf(request.get("intervalDays").toString())
                : 30;
        Date dueDate = new Date(System.currentTimeMillis() + ((long) intervalDays * 24 * 60 * 60 * 1000));

        Payment payment = new Payment();
        payment.setTitle(title);
        payment.setAmount(amount);
        payment.setDueDate(dueDate);
        payment.setStatus("Pending");
        payment.setCategory("RENT");
        payment.setIntervalDays(intervalDays);
        payment.setPayeeId(currentUserId);
        payment.setPayerId(payerId);

        paymentRepository.save(payment);

        return ResponseEntity.ok(Map.of("message", "Rent bill created successfully"));
    }

    public ResponseEntity<?> donateToCharity(Map<String, Object> request) {
        Long currentUserId = getCurrentUserId();
        User currentUser = getCurrentUser(currentUserId);

        Double amount = request.get("amount") != null ? Double.valueOf(request.get("amount").toString()) : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Donation amount must be a positive number");
        }

        String message = (String) request.get("message");

        CharityDonation donation = CharityDonation.builder()
                .donorId(currentUserId)
                .donorName(currentUser.getName())
                .amount(amount)
                .message(message != null ? message : "")
                .build();

        charityDonationRepository.save(donation);

        return ResponseEntity.ok(Map.of("message", "Thank you for your donation of NPR " + amount.intValue()));
    }

    private Long getCurrentUserId() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new AccessDeniedException("Unauthorized: no valid session");
        }
        return currentUserId;
    }

    private User getCurrentUser(Long currentUserId) {
        return userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }
}
