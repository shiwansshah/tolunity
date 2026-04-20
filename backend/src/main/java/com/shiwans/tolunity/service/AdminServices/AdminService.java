package com.shiwans.tolunity.service.AdminServices;

import com.shiwans.tolunity.Repo.AdminRepos.CharityDonationRepository;
import com.shiwans.tolunity.Repo.AdminRepos.FeeConfigRepository;
import com.shiwans.tolunity.Repo.UserRepos.PaymentRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.PhoneNumberUtil;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.config.ResourceNotFoundException;
import com.shiwans.tolunity.dto.AdminCreateUserRequest;
import com.shiwans.tolunity.dto.AdminResetUserPasswordRequest;
import com.shiwans.tolunity.entities.Payments.CharityDonation;
import com.shiwans.tolunity.entities.Payments.FeeConfig;
import com.shiwans.tolunity.entities.Payments.Payment;
import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import com.shiwans.tolunity.enums.UserTypeEnum;
import com.shiwans.tolunity.service.NotificationService;
import com.shiwans.tolunity.service.PaymentDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<?> getDashboardStats() {
        List<User> allUsers = userRepository.findAllByDelFlgFalse();
        List<Payment> adminManagedPayments = paymentRepository.findAllByDelFlgFalseOrderByDueDateDesc().stream()
                .filter(payment -> isAdminManagedCategory(payment.getCategory()))
                .toList();
        List<CharityDonation> allDonations = charityDonationRepository.findByDelFlgFalseOrderByCreatedAtDesc();

        long totalUsers = allUsers.size();
        long ownersCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.OWNER).count();
        long tenantsCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.TENANT).count();
        long securityCount = allUsers.stream().filter(user -> user.getUserType() == UserTypeEnum.SECURITY).count();

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
        stats.put("securityCount", securityCount);
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

    public ResponseEntity<?> createUser(AdminCreateUserRequest request) {
        String name = normalizeRequiredText(request.getName(), "name");
        String normalizedEmail = normalizeEmail(request.getEmail());
        String phoneNumber = normalizePhoneNumber(request.getPhoneNumber());
        String password = validatePassword(request.getPassword());
        UserTypeEnum userType = resolveAdminManagedUserType(request.getUserType());

        if (userRepository.findByNormalizedEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered!"));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(UserRolesEnum.ROLE_USER);
        user.setUserType(userType);
        user.setActiveFlg(true);
        user.setCreatedAt(new Date());

        User savedUser = userRepository.save(user);
        adminAuditService.logAction(
                "USER_CREATED",
                "USER",
                savedUser.getId(),
                "Created user account for " + savedUser.getEmail(),
                "userType=" + savedUser.getUserType()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "User created successfully",
                "user", mapUser(savedUser)
        ));
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

    public ResponseEntity<?> resetUserPassword(Long id, AdminResetUserPasswordRequest request) {
        User user = userRepository.findByIdAndDelFlgFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        if (!isAdminResettableUser(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Admins can only reset passwords for OWNER, TENANT, or SECURITY users"));
        }

        String password = validatePassword(request != null ? request.getNewPassword() : null);
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        adminAuditService.logAction(
                "USER_PASSWORD_RESET",
                "USER",
                user.getId(),
                "Reset password for " + user.getEmail(),
                "userType=" + user.getUserType()
        );

        return ResponseEntity.ok(Map.of("message", "User password reset successfully"));
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
        notificationService.notifyFeeConfigured(feeType);
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
        Set<Long> recorderIds = donations.stream()
                .map(CharityDonation::getRecordedById)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> recorderNames = userRepository.findAllById(recorderIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        Map<String, Object> result = new HashMap<>();
        result.put("totalFund", total);
        result.put("totalDonations", donations.size());
        result.put("donations", donations.stream()
                .map(donation -> mapCharityDonation(donation, recorderNames.get(donation.getRecordedById())))
                .toList());

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
        notificationService.notifyGlobalDonation("charity-manual:" + donation.getId());

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

    private Map<String, Object> mapCharityDonation(CharityDonation donation, String recordedByName) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", donation.getId());
        map.put("donorId", donation.getDonorId());
        map.put("donorName", donation.getDonorName());
        map.put("entrySource", donation.getEntrySource());
        map.put("recordedById", donation.getRecordedById());
        map.put("recordedByName", recordedByName);
        map.put("amount", donation.getAmount());
        map.put("message", donation.getMessage());
        map.put("createdAt", donation.getCreatedAt());
        return map;
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

    private String normalizeRequiredText(String rawValue, String fieldName) {
        String value = normalizeText(rawValue);
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }

    private String normalizeEmail(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        return normalizedEmail;
    }

    private String normalizePhoneNumber(String phoneNumber) {
        String normalizedPhoneNumber = PhoneNumberUtil.normalize(phoneNumber);
        if (!PhoneNumberUtil.isValidNepalMobileNumber(normalizedPhoneNumber)) {
            throw new IllegalArgumentException("Phone number must be 10 digits and start with 98 or 97");
        }
        return normalizedPhoneNumber;
    }

    private String validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        return password;
    }

    private UserTypeEnum resolveAdminManagedUserType(String rawUserType) {
        if (rawUserType == null || rawUserType.isBlank()) {
            throw new IllegalArgumentException("userType is required");
        }

        return switch (rawUserType.trim().toUpperCase(Locale.ROOT)) {
            case "OWNER" -> UserTypeEnum.OWNER;
            case "TENANT" -> UserTypeEnum.TENANT;
            case "SECURITY" -> UserTypeEnum.SECURITY;
            default -> throw new IllegalArgumentException("userType must be OWNER, TENANT, or SECURITY");
        };
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

    private boolean isAdminResettableUser(User user) {
        if (user.getRole() == UserRolesEnum.ROLE_ADMIN) {
            return false;
        }

        return user.getUserType() == UserTypeEnum.OWNER
                || user.getUserType() == UserTypeEnum.TENANT
                || user.getUserType() == UserTypeEnum.SECURITY;
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
