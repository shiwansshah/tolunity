package com.shiwans.tolunity.service.AdminServices;

import com.shiwans.tolunity.Repo.AdminRepos.CharityDonationRepository;
import com.shiwans.tolunity.Repo.AdminRepos.FeeConfigRepository;
import com.shiwans.tolunity.Repo.UserRepos.PaymentRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.entities.Payments.CharityDonation;
import com.shiwans.tolunity.entities.Payments.FeeConfig;
import com.shiwans.tolunity.entities.Payments.Payment;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import com.shiwans.tolunity.service.PaymentDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Set<String> ADMIN_MANAGED_FEE_TYPES = Set.of("MAINTENANCE", "GARBAGE");
    private static final Set<String> REPORT_VISIBLE_PAYMENT_TYPES = Set.of("MAINTENANCE", "GARBAGE", "RENT");
    private static final Set<String> PAYMENT_STATUSES = Set.of("PENDING", "PAID", "OVERDUE");

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final FeeConfigRepository feeConfigRepository;
    private final CharityDonationRepository charityDonationRepository;
    private final PaymentDtoMapper paymentDtoMapper;
    private final AdminAuditService adminAuditService;

    public ResponseEntity<?> getDashboardStats() {
        List<User> allUsers = userRepository.findAllByDelFlgFalse();
        List<Payment> adminManagedPayments = paymentRepository.findAllByDelFlgFalseOrderByDueDateDesc().stream()
                .filter(payment -> isAdminManagedCategory(payment.getCategory()))
                .toList();
        List<CharityDonation> allDonations = charityDonationRepository.findByDelFlgFalseOrderByCreatedAtDesc();

        long totalUsers = allUsers.size();
        long ownersCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.OWNER).count();
        long tenantsCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.TENANT).count();

        double collectedRevenue = adminManagedPayments.stream()
                .filter(payment -> "Paid".equalsIgnoreCase(payment.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
        double pendingRevenue = adminManagedPayments.stream()
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
        stats.put("totalPayments", adminManagedPayments.size());
        stats.put("collectedRevenue", collectedRevenue);
        stats.put("pendingRevenue", pendingRevenue);
        stats.put("charityTotal", charityTotal);
        stats.put("maintenanceCollected", sumCollectedByCategory(adminManagedPayments, "MAINTENANCE"));
        stats.put("garbageCollected", sumCollectedByCategory(adminManagedPayments, "GARBAGE"));

        return ResponseEntity.ok(stats);
    }

    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> userList = userRepository.findAllByDelFlgFalse().stream()
                .map(this::mapUser)
                .collect(Collectors.toList());

        return ResponseEntity.ok(userList);
    }

    public ResponseEntity<?> toggleUserStatus(Long id) {
        User user = userRepository.findByIdAndDelFlgFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        user.setActiveFlg(!user.isActiveFlg());
        userRepository.save(user);
        adminAuditService.logAction(
                "USER_STATUS_UPDATED",
                "USER",
                user.getId(),
                "Updated user access for " + user.getEmail(),
                "activeFlg=" + user.isActiveFlg()
        );

        return ResponseEntity.ok(Map.of("message", "User status updated successfully", "isActive", user.isActiveFlg()));
    }

    public ResponseEntity<?> getAllPayments() {
        List<Payment> reportPayments = paymentRepository.findAllByDelFlgFalseOrderByDueDateDesc().stream()
                .filter(payment -> isReportVisibleCategory(payment.getCategory()))
                .toList();
        return ResponseEntity.ok(paymentDtoMapper.toDtos(reportPayments));
    }

    public ResponseEntity<?> getFeeConfigs() {
        return ResponseEntity.ok(feeConfigRepository.findByActiveFlgTrueOrderByFeeTypeAsc().stream()
                .filter(config -> ADMIN_MANAGED_FEE_TYPES.contains(config.getFeeType()))
                .toList());
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
        adminAuditService.logAction(
                "FEE_CONFIG_SAVED",
                "FEE_CONFIG",
                config.getId(),
                "Saved " + feeType + " fee configuration",
                "amount=" + amount + ", intervalDays=" + intervalDays + ", description=" + (description != null ? description : "")
        );
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

        List<User> payers = getEligiblePayers();
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

        adminAuditService.logAction(
                "BILLS_GENERATED",
                "PAYMENT_BATCH",
                null,
                "Generated " + count + " " + feeType + " bills",
                "feeType=" + feeType + ", intervalDays=" + config.getIntervalDays() + ", amount=" + config.getAmount()
        );

        return ResponseEntity.ok(Map.of("message", count + " bills generated successfully for " + feeType, "billsGenerated", count));
    }

    public ResponseEntity<?> updatePaymentTransaction(Long paymentId, Map<String, Object> request) {
        Payment payment = paymentRepository.findByIdAndDelFlgFalse(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment with ID " + paymentId + " not found"));

        if (!isAdminManagedCategory(payment.getCategory())) {
            throw new IllegalArgumentException("Only maintenance and garbage payments can be manually updated by admin");
        }

        String normalizedStatus = normalizePaymentStatus((String) request.get("status"));
        String provider = normalizeText(request.get("gatewayProvider"));
        String referenceId = normalizeText(request.get("gatewayReferenceId"));
        String gatewayStatus = normalizeText(request.get("gatewayStatus"));
        String note = normalizeText(request.get("transactionNote"));
        Date paidDate = parseOptionalDate(request.get("paidDate"));

        if (normalizedStatus != null) {
            payment.setStatus(toTitleCase(normalizedStatus));
        }

        if (provider != null) {
            payment.setGatewayProvider(provider.toUpperCase(Locale.ROOT));
        } else if ("PAID".equals(normalizedStatus) && (payment.getGatewayProvider() == null || payment.getGatewayProvider().isBlank())) {
            payment.setGatewayProvider("MANUAL");
        }

        if (referenceId != null || request.containsKey("gatewayReferenceId")) {
            payment.setGatewayReferenceId(referenceId);
        }

        if (gatewayStatus != null) {
            payment.setGatewayStatus(gatewayStatus);
        } else if ("PAID".equals(normalizedStatus) && (payment.getGatewayStatus() == null || payment.getGatewayStatus().isBlank())) {
            payment.setGatewayStatus("MANUALLY_CONFIRMED");
        }

        if (note != null || request.containsKey("transactionNote")) {
            payment.setTransactionNote(note);
        }

        if ("PAID".equals(normalizedStatus)) {
            payment.setPaidDate(paidDate != null ? paidDate : new Date());
        } else if (normalizedStatus != null) {
            payment.setPaidDate(null);
        }

        Long currentUserId = requireCurrentUserId();
        payment.setStatusUpdatedAt(new Date());
        payment.setStatusUpdatedBy(currentUserId);
        paymentRepository.save(payment);

        adminAuditService.logAction(
                "PAYMENT_TRANSACTION_UPDATED",
                "PAYMENT",
                payment.getId(),
                "Updated " + payment.getCategory() + " transaction for payment #" + payment.getId(),
                "status=" + payment.getStatus()
                        + ", gatewayProvider=" + safeText(payment.getGatewayProvider())
                        + ", gatewayStatus=" + safeText(payment.getGatewayStatus())
                        + ", referenceId=" + safeText(payment.getGatewayReferenceId())
                        + ", paidDate=" + (payment.getPaidDate() != null ? payment.getPaidDate() : "null")
        );

        return ResponseEntity.ok(paymentDtoMapper.toDtos(List.of(payment)).get(0));
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

    public ResponseEntity<?> addManualCharityEntry(Map<String, Object> request) {
        Long currentUserId = requireCurrentUserId();
        User currentUser = userRepository.findByIdAndDelFlgFalse(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current admin not found"));

        String donorName = normalizeText(request.get("donorName"));
        if (donorName == null) {
            throw new IllegalArgumentException("donorName is required");
        }

        Double amount = request.get("amount") != null ? Double.valueOf(request.get("amount").toString()) : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be a positive number");
        }

        String message = normalizeText(request.get("message"));

        CharityDonation donation = CharityDonation.builder()
                .donorId(currentUserId)
                .donorName(donorName)
                .entrySource("MANUAL")
                .recordedById(currentUserId)
                .amount(amount)
                .message(message != null ? message : "")
                .build();

        charityDonationRepository.save(donation);
        adminAuditService.logAction(
                "CHARITY_ENTRY_CREATED",
                "CHARITY_DONATION",
                donation.getId(),
                "Added manual charity entry for " + donorName,
                "amount=" + amount + ", recordedBy=" + currentUser.getEmail()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Manual charity entry recorded successfully",
                "donation", donation
        ));
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
        map.put("role", normalizeRole(user.getRole()));
        map.put("userType", user.getUserType() != null ? user.getUserType().toString() : null);
        map.put("activeFlg", user.isActiveFlg());
        map.put("delFlg", user.isDelFlg());
        return map;
    }

    private String validateFeeType(String rawFeeType) {
        if (rawFeeType == null || rawFeeType.isBlank()) {
            throw new IllegalArgumentException("feeType is required (MAINTENANCE or GARBAGE)");
        }

        String feeType = rawFeeType.toUpperCase();
        if (!ADMIN_MANAGED_FEE_TYPES.contains(feeType)) {
            throw new IllegalArgumentException("Invalid fee type. Must be MAINTENANCE or GARBAGE");
        }

        return feeType;
    }

    private List<User> getEligiblePayers() {
        Set<Long> uniqueIds = new HashSet<>();
        List<User> payers = new ArrayList<>();

        userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.OWNER).forEach(user -> {
            if (uniqueIds.add(user.getId())) {
                payers.add(user);
            }
        });
        userRepository.findByUserTypeAndDelFlgFalse(UserTypeEnum.TENANT).forEach(user -> {
            if (uniqueIds.add(user.getId())) {
                payers.add(user);
            }
        });

        return payers;
    }

    private boolean isAdminManagedCategory(String category) {
        return category != null && ADMIN_MANAGED_FEE_TYPES.contains(category.toUpperCase());
    }

    private boolean isReportVisibleCategory(String category) {
        return category != null && REPORT_VISIBLE_PAYMENT_TYPES.contains(category.toUpperCase(Locale.ROOT));
    }

    private Long requireCurrentUserId() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResourceNotFoundException("Current admin not found");
        }
        return currentUserId;
    }

    private String normalizePaymentStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!PAYMENT_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status must be Pending, Paid, or Overdue");
        }

        return normalized;
    }

    private Date parseOptionalDate(Object rawValue) {
        if (rawValue == null || rawValue.toString().isBlank()) {
            return null;
        }

        try {
            return Date.from(Instant.parse(rawValue.toString()));
        } catch (DateTimeParseException ignored) {
            try {
                return java.sql.Date.valueOf(rawValue.toString());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("paidDate must be an ISO timestamp or yyyy-MM-dd date");
            }
        }
    }

    private String normalizeText(Object rawValue) {
        if (rawValue == null) {
            return null;
        }

        String value = rawValue.toString().trim();
        return value.isEmpty() ? null : value;
    }

    private String toTitleCase(String value) {
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }

    private String safeText(String value) {
        return value != null ? value : "";
    }

    private String normalizeRole(UserRolesEnum role) {
        if (role == null) {
            return null;
        }

        return switch (role) {
            case ROLE_ADMIN -> "ADMIN";
            case ROLE_USER -> "USER";
        };
    }
}
