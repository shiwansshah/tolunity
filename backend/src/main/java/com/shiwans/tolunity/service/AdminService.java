package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.CharityDonationRepository;
import com.shiwans.tolunity.Repo.FeeConfigRepository;
import com.shiwans.tolunity.Repo.PaymentRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.entities.CharityDonation;
import com.shiwans.tolunity.entities.FeeConfig;
import com.shiwans.tolunity.entities.Payment;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final FeeConfigRepository feeConfigRepository;
    private final CharityDonationRepository charityDonationRepository;
    private final PaymentDtoMapper paymentDtoMapper;

    public ResponseEntity<?> getDashboardStats() {
        List<User> allUsers = userRepository.findAllByDelFlgFalse();
        List<Payment> allPayments = paymentRepository.findAllByDelFlgFalseOrderByDueDateDesc();
        List<CharityDonation> allDonations = charityDonationRepository.findByDelFlgFalseOrderByCreatedAtDesc();

        long totalUsers = allUsers.size();
        long ownersCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.OWNER).count();
        long tenantsCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.TENANT).count();

        double collectedRevenue = allPayments.stream()
                .filter(payment -> "Paid".equalsIgnoreCase(payment.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
        double pendingRevenue = allPayments.stream()
                .filter(payment -> !"Paid".equalsIgnoreCase(payment.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
        double charityTotal = allDonations.stream()
                .mapToDouble(CharityDonation::getAmount)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("ownersCount", ownersCount);
        stats.put("tenantsCount", tenantsCount);
        stats.put("totalPayments", allPayments.size());
        stats.put("collectedRevenue", collectedRevenue);
        stats.put("pendingRevenue", pendingRevenue);
        stats.put("charityTotal", charityTotal);
        stats.put("maintenanceCollected", sumCollectedByCategory(allPayments, "MAINTENANCE"));
        stats.put("electricityCollected", sumCollectedByCategory(allPayments, "ELECTRICITY"));
        stats.put("garbageCollected", sumCollectedByCategory(allPayments, "GARBAGE"));
        stats.put("rentCollected", sumCollectedByCategory(allPayments, "RENT"));

        return ResponseEntity.ok(stats);
    }

    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> userList = userRepository.findAll().stream()
                .map(this::mapUser)
                .collect(Collectors.toList());

        return ResponseEntity.ok(userList);
    }

    public ResponseEntity<?> toggleUserStatus(Long id) {
        User user = userRepository.findByIdAndDelFlgFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        user.setActiveFlg(!user.isActiveFlg());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User status updated successfully", "isActive", user.isActiveFlg()));
    }

    public ResponseEntity<?> getAllPayments() {
        return ResponseEntity.ok(paymentDtoMapper.toDtos(paymentRepository.findAllByDelFlgFalseOrderByDueDateDesc()));
    }

    public ResponseEntity<?> getFeeConfigs() {
        return ResponseEntity.ok(feeConfigRepository.findByActiveFlgTrueOrderByFeeTypeAsc());
    }

    public ResponseEntity<?> saveFeeConfig(Map<String, Object> request) {
        String feeType = validateFeeType((String) request.get("feeType"));

        Double amount = request.get("amount") != null ? Double.valueOf(request.get("amount").toString()) : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be a positive number");
        }

        Integer intervalDays = request.get("intervalDays") != null
                ? Integer.valueOf(request.get("intervalDays").toString())
                : 30;
        String description = (String) request.get("description");

        Optional<FeeConfig> existing = feeConfigRepository.findByFeeTypeAndActiveFlgTrue(feeType);
        FeeConfig config;
        if (existing.isPresent()) {
            config = existing.get();
            config.setAmount(amount);
            config.setIntervalDays(intervalDays);
            config.setDescription(description);
        } else {
            config = FeeConfig.builder()
                    .feeType(feeType)
                    .amount(amount)
                    .intervalDays(intervalDays)
                    .description(description)
                    .activeFlg(true)
                    .build();
        }

        feeConfigRepository.save(config);
        return ResponseEntity.ok(Map.of("message", "Fee configuration saved successfully", "config", config));
    }

    public ResponseEntity<?> generateBills(Map<String, Object> request) {
        String rawFeeType = (String) request.get("feeType");
        if (rawFeeType == null || rawFeeType.isBlank()) {
            throw new IllegalArgumentException("feeType is required");
        }

        String feeType = rawFeeType.toUpperCase();
        FeeConfig config = feeConfigRepository.findByFeeTypeAndActiveFlgTrue(feeType)
                .orElseThrow(() -> new ResourceNotFoundException("No active fee config found for type: " + feeType));

        User admin = userRepository.findFirstByRoleAndDelFlgFalse(UserRolesEnum.ROLE_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("No admin user found in system"));

        List<User> payers = getEligiblePayers(feeType);
        if (payers.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No eligible payers found", "billsGenerated", 0));
        }

        Date dueDate = new Date(System.currentTimeMillis() + ((long) config.getIntervalDays() * 24 * 60 * 60 * 1000));
        int count = 0;

        for (User payer : payers) {
            Payment payment = new Payment();
            payment.setTitle(config.getFeeType() + " Fee");
            payment.setAmount(config.getAmount());
            payment.setDueDate(dueDate);
            payment.setStatus("Pending");
            payment.setCategory(config.getFeeType());
            payment.setIntervalDays(config.getIntervalDays());
            payment.setPayerId(payer.getId());
            payment.setPayeeId(admin.getId());
            paymentRepository.save(payment);
            count++;
        }

        return ResponseEntity.ok(Map.of("message", count + " bills generated successfully for " + feeType, "billsGenerated", count));
    }

    public ResponseEntity<?> getCharityData() {
        List<CharityDonation> donations = charityDonationRepository.findByDelFlgFalseOrderByCreatedAtDesc();
        double total = donations.stream().mapToDouble(CharityDonation::getAmount).sum();

        Map<String, Object> result = new HashMap<>();
        result.put("totalFund", total);
        result.put("totalDonations", donations.size());
        result.put("donations", donations);

        return ResponseEntity.ok(result);
    }

    private double sumCollectedByCategory(List<Payment> payments, String category) {
        return payments.stream()
                .filter(payment -> category.equalsIgnoreCase(payment.getCategory()) && "Paid".equalsIgnoreCase(payment.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    private Map<String, Object> mapUser(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("role", user.getRole() != null ? user.getRole().toString() : null);
        map.put("userType", user.getUserType() != null ? user.getUserType().toString() : null);
        map.put("activeFlg", user.isActiveFlg());
        map.put("delFlg", user.isDelFlg());
        return map;
    }

    private String validateFeeType(String rawFeeType) {
        if (rawFeeType == null || rawFeeType.isBlank()) {
            throw new IllegalArgumentException("feeType is required (MAINTENANCE, ELECTRICITY, or GARBAGE)");
        }

        String feeType = rawFeeType.toUpperCase();
        if (!List.of("MAINTENANCE", "ELECTRICITY", "GARBAGE").contains(feeType)) {
            throw new IllegalArgumentException("Invalid fee type. Must be MAINTENANCE, ELECTRICITY, or GARBAGE");
        }

        return feeType;
    }

    private List<User> getEligiblePayers(String feeType) {
        if ("ELECTRICITY".equalsIgnoreCase(feeType)) {
            return userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.OWNER);
        }

        List<User> payers = new ArrayList<>();
        payers.addAll(userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.OWNER));
        payers.addAll(userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.TENANT));
        return payers;
    }
}
