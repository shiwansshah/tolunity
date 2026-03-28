package com.shiwans.tolunity.service.UserServices;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Set<String> USER_VISIBLE_CATEGORIES = Set.of("MAINTENANCE", "GARBAGE", "RENT");

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CharityDonationRepository charityDonationRepository;
    private final PaymentDtoMapper paymentDtoMapper;
    private final ObjectMapper objectMapper;

    @Value("${app.payments.khalti.base-url}")
    private String khaltiBaseUrl;

    @Value("${app.payments.khalti.secret-key:}")
    private String khaltiSecretKey;

    @Value("${app.payments.esewa.form-url}")
    private String esewaFormUrl;

    @Value("${app.payments.esewa.status-url}")
    private String esewaStatusUrl;

    @Value("${app.payments.esewa.product-code}")
    private String esewaProductCode;

    @Value("${app.payments.esewa.secret-key}")
    private String esewaSecretKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

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

        List<Payment> visiblePayments = payments.stream()
                .filter(payment -> isUserVisibleCategory(payment.getCategory()))
                .toList();

        return ResponseEntity.ok(paymentDtoMapper.toDtos(visiblePayments));
    }

    public ResponseEntity<?> getGatewayConfig() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("esewaEnabled", isEsewaConfigured());
        response.put("khaltiEnabled", isKhaltiConfigured());
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> payBill(Long paymentId) {
        validatePaymentAccess(paymentId);
        throw new IllegalArgumentException("Direct payment is disabled. Use the payment gateway initiate and verify flow.");
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

    public ResponseEntity<?> initiatePayment(Long paymentId, Map<String, Object> request) {
        Payment payment = validatePaymentAccess(paymentId);
        User currentUser = getCurrentUser(getCurrentUserId());
        String gateway = resolveGateway((String) request.get("gateway"));

        return switch (gateway) {
            case "ESEWA" -> ResponseEntity.ok(initiateEsewa(payment, request));
            case "KHALTI" -> ResponseEntity.ok(initiateKhalti(payment, currentUser, request));
            default -> throw new IllegalArgumentException("Unsupported payment gateway");
        };
    }

    public ResponseEntity<?> verifyPayment(Long paymentId, Map<String, Object> request) {
        Payment payment = validatePaymentAccess(paymentId);
        String gateway = resolveGateway(request.get("gateway") != null
                ? request.get("gateway").toString()
                : payment.getGatewayProvider());

        return switch (gateway) {
            case "ESEWA" -> ResponseEntity.ok(verifyEsewa(payment, request));
            case "KHALTI" -> ResponseEntity.ok(verifyKhalti(payment, request));
            default -> throw new IllegalArgumentException("Unsupported payment gateway");
        };
    }

    public ResponseEntity<String> getEsewaRedirectPage(Long paymentId, String transactionUuid, String successUrl, String failureUrl) {
        Payment payment = paymentRepository.findByIdAndDelFlgFalse(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment with ID " + paymentId + " not found"));

        if (!"ESEWA".equalsIgnoreCase(payment.getGatewayProvider())
                || payment.getGatewayTransactionId() == null
                || !payment.getGatewayTransactionId().equals(transactionUuid)) {
            throw new IllegalArgumentException("Invalid eSewa transaction reference");
        }

        validateHttpUrl(successUrl, "successUrl");
        validateHttpUrl(failureUrl, "failureUrl");

        String totalAmount = formatAmount(payment.getAmount());
        String signaturePayload = "total_amount=" + totalAmount
                + ",transaction_uuid=" + transactionUuid
                + ",product_code=" + esewaProductCode;
        String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>Redirecting to eSewa</title>
                </head>
                <body style="font-family: Arial, sans-serif; padding: 24px;">
                  <p>Redirecting to eSewa sandbox...</p>
                  <form id="esewaForm" action="%s" method="POST">
                    <input type="hidden" name="amount" value="%s" />
                    <input type="hidden" name="tax_amount" value="0" />
                    <input type="hidden" name="total_amount" value="%s" />
                    <input type="hidden" name="transaction_uuid" value="%s" />
                    <input type="hidden" name="product_code" value="%s" />
                    <input type="hidden" name="product_service_charge" value="0" />
                    <input type="hidden" name="product_delivery_charge" value="0" />
                    <input type="hidden" name="success_url" value="%s" />
                    <input type="hidden" name="failure_url" value="%s" />
                    <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
                    <input type="hidden" name="signature" value="%s" />
                  </form>
                  <script>document.getElementById('esewaForm').submit();</script>
                </body>
                </html>
                """.formatted(
                escapeHtml(esewaFormUrl),
                escapeHtml(totalAmount),
                escapeHtml(totalAmount),
                escapeHtml(transactionUuid),
                escapeHtml(esewaProductCode),
                escapeHtml(successUrl),
                escapeHtml(failureUrl),
                escapeHtml(createEsewaSignature(signaturePayload))
        );

        return ResponseEntity.ok(html);
    }

    public ResponseEntity<String> getEsewaCallbackPage(Long paymentId, String redirectUrl, String outcome, Map<String, String> queryParams) {
        Payment payment = paymentRepository.findByIdAndDelFlgFalse(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment with ID " + paymentId + " not found"));

        validateAppRedirectUrl(redirectUrl);

        Map<String, Object> verification = attemptEsewaCallbackVerification(payment, queryParams);
        boolean verified = Boolean.TRUE.equals(verification.get("verified"));
        String gatewayStatus = stringOrDefault(verification.get("status"), payment.getGatewayStatus());
        String resolvedOutcome = verified ? "success" : outcome;
        String redirectTarget = appendQueryParam(redirectUrl, "paymentId", paymentId.toString());
        redirectTarget = appendQueryParam(redirectTarget, "gatewayStatus", gatewayStatus != null ? gatewayStatus : "UNKNOWN");

        boolean success = "success".equalsIgnoreCase(resolvedOutcome);
        String title = success ? "Returning to TolUnity" : "Payment Not Completed";
        String message = success
                ? "eSewa returned successfully. TolUnity has checked the latest gateway status."
                : "eSewa did not complete the payment. Return to the app to review the latest gateway status.";

        String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>%s</title>
                </head>
                <body style="margin:0; font-family: Arial, sans-serif; background:#f3f6fc; color:#1a1d2e;">
                  <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;">
                    <div style="max-width:420px; width:100%%; background:#ffffff; border-radius:20px; padding:32px; box-shadow:0 18px 40px rgba(30,63,160,0.14); text-align:center;">
                      <p style="margin:0 0 12px; color:#1e3fa0; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">TolUnity Payment</p>
                      <h1 style="margin:0 0 12px; font-size:24px; line-height:1.2;">%s</h1>
                      <p style="margin:0 0 24px; color:#5a6589; line-height:1.6;">%s</p>
                      <a href="%s" style="display:inline-block; padding:14px 22px; border-radius:999px; background:#1e3fa0; color:#ffffff; text-decoration:none; font-weight:700;">Open TolUnity</a>
                    </div>
                  </div>
                  <script>
                    window.location.replace("%s");
                    setTimeout(function () {
                      window.location.href = "%s";
                    }, 800);
                  </script>
                </body>
                </html>
                """.formatted(
                escapeHtml(title),
                escapeHtml(title),
                escapeHtml(message),
                escapeHtml(redirectTarget),
                escapeHtml(redirectTarget),
                escapeHtml(redirectTarget)
        );

        return ResponseEntity.ok(html);
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
                .entrySource("APP")
                .recordedById(currentUserId)
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

    private Payment validatePaymentAccess(Long paymentId) {
        Long currentUserId = getCurrentUserId();
        Payment payment = paymentRepository.findByIdAndDelFlgFalse(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment with ID " + paymentId + " not found"));

        if (!currentUserId.equals(payment.getPayerId())) {
            throw new AccessDeniedException("You are not authorized to pay this bill");
        }
        if ("Paid".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("This payment has already been paid");
        }
        if (!isUserVisibleCategory(payment.getCategory())) {
            throw new IllegalArgumentException("This payment category is no longer supported");
        }

        return payment;
    }

    private boolean isUserVisibleCategory(String category) {
        return category != null && USER_VISIBLE_CATEGORIES.contains(category.toUpperCase(Locale.ROOT));
    }

    private String resolveGateway(String rawGateway) {
        if (rawGateway == null || rawGateway.isBlank()) {
            throw new IllegalArgumentException("gateway is required");
        }

        String gateway = rawGateway.toUpperCase(Locale.ROOT);
        if (!Set.of("ESEWA", "KHALTI").contains(gateway)) {
            throw new IllegalArgumentException("gateway must be ESEWA or KHALTI");
        }

        return gateway;
    }

    private Map<String, Object> initiateEsewa(Payment payment, Map<String, Object> request) {
        String transactionUuid = "tolunity-" + payment.getId() + "-" + System.currentTimeMillis();
        String totalAmount = formatAmount(payment.getAmount());
        String successUrl = stringOrDefault(request.get("successUrl"), stringOrDefault(request.get("returnUrl"), "http://localhost:8080/api/payments/esewa-success"));
        String failureUrl = stringOrDefault(request.get("failureUrl"), stringOrDefault(request.get("returnUrl"), "http://localhost:8080/api/payments/esewa-failure"));
        String signedFieldNames = "total_amount,transaction_uuid,product_code";
        String signaturePayload = "total_amount=" + totalAmount
                + ",transaction_uuid=" + transactionUuid
                + ",product_code=" + esewaProductCode;

        validateHttpUrl(successUrl, "successUrl");
        validateHttpUrl(failureUrl, "failureUrl");

        payment.setGatewayProvider("ESEWA");
        payment.setGatewayTransactionId(transactionUuid);
        payment.setGatewayStatus("INITIATED");
        payment.setStatusUpdatedAt(new Date());
        paymentRepository.save(payment);

        Map<String, Object> formFields = new LinkedHashMap<>();
        formFields.put("amount", totalAmount);
        formFields.put("tax_amount", "0");
        formFields.put("total_amount", totalAmount);
        formFields.put("transaction_uuid", transactionUuid);
        formFields.put("product_code", esewaProductCode);
        formFields.put("product_service_charge", "0");
        formFields.put("product_delivery_charge", "0");
        formFields.put("success_url", successUrl);
        formFields.put("failure_url", failureUrl);
        formFields.put("signed_field_names", signedFieldNames);
        formFields.put("signature", createEsewaSignature(signaturePayload));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gateway", "ESEWA");
        response.put("paymentId", payment.getId());
        response.put("flowType", "FORM_POST");
        response.put("actionUrl", esewaFormUrl);
        response.put("method", "POST");
        response.put("transactionUuid", transactionUuid);
        response.put("formFields", formFields);
        return response;
    }

    private Map<String, Object> initiateKhalti(Payment payment, User currentUser, Map<String, Object> request) {
        if (khaltiSecretKey == null || khaltiSecretKey.isBlank()) {
            throw new IllegalArgumentException("Khalti secret key is not configured. Set KHALTI_SECRET_KEY in the backend environment.");
        }

        String returnUrl = stringOrDefault(request.get("returnUrl"), "tolunity://payments/khalti");
        String websiteUrl = stringOrDefault(request.get("websiteUrl"), "https://tolunity.local");
        String purchaseOrderId = "payment-" + payment.getId() + "-" + System.currentTimeMillis();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("return_url", returnUrl);
        payload.put("website_url", websiteUrl);
        payload.put("amount", toPaisa(payment.getAmount()));
        payload.put("purchase_order_id", purchaseOrderId);
        payload.put("purchase_order_name", payment.getTitle());
        payload.put("customer_info", Map.of(
                "name", currentUser.getName(),
                "email", currentUser.getEmail(),
                "phone", currentUser.getPhoneNumber()
        ));

        Map<String, Object> responseMap = postJson(
                khaltiBaseUrl + "/epayment/initiate/",
                payload,
                Map.of(
                        "Authorization", "Key " + khaltiSecretKey,
                        "Content-Type", "application/json"
                )
        );

        String pidx = stringOrDefault(responseMap.get("pidx"), null);
        if (pidx == null || pidx.isBlank()) {
            throw new IllegalArgumentException("Khalti did not return a payment identifier");
        }

        payment.setGatewayProvider("KHALTI");
        payment.setGatewayTransactionId(pidx);
        payment.setGatewayStatus("INITIATED");
        payment.setStatusUpdatedAt(new Date());
        paymentRepository.save(payment);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gateway", "KHALTI");
        response.put("paymentId", payment.getId());
        response.put("flowType", "REDIRECT");
        response.put("pidx", pidx);
        response.put("paymentUrl", responseMap.get("payment_url"));
        response.put("expiresAt", responseMap.get("expires_at"));
        response.put("expiresIn", responseMap.get("expires_in"));
        return response;
    }

    private Map<String, Object> verifyEsewa(Payment payment, Map<String, Object> request) {
        String transactionUuid = stringOrDefault(request.get("transactionUuid"), payment.getGatewayTransactionId());
        if (transactionUuid == null || transactionUuid.isBlank()) {
            throw new IllegalArgumentException("transactionUuid is required for eSewa verification");
        }

        String totalAmount = stringOrDefault(request.get("totalAmount"), formatAmount(payment.getAmount()));
        String url = esewaStatusUrl
                + "?product_code=" + encode(esewaProductCode)
                + "&total_amount=" + encode(totalAmount)
                + "&transaction_uuid=" + encode(transactionUuid);

        Map<String, Object> responseMap = getJson(url, Collections.emptyMap());
        String status = stringOrDefault(responseMap.get("status"), "UNKNOWN");
        String referenceId = stringOrDefault(responseMap.get("refId"), null);

        payment.setGatewayProvider("ESEWA");
        payment.setGatewayTransactionId(transactionUuid);
        payment.setGatewayReferenceId(referenceId);
        payment.setGatewayStatus(status);
        payment.setStatusUpdatedAt(new Date());

        if ("COMPLETE".equalsIgnoreCase(status)) {
            markPaymentAsPaid(payment);
        } else {
            paymentRepository.save(payment);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gateway", "ESEWA");
        response.put("verified", "COMPLETE".equalsIgnoreCase(status));
        response.put("status", status);
        response.put("referenceId", referenceId);
        response.put("paymentStatus", payment.getStatus());
        return response;
    }

    private Map<String, Object> verifyKhalti(Payment payment, Map<String, Object> request) {
        if (khaltiSecretKey == null || khaltiSecretKey.isBlank()) {
            throw new IllegalArgumentException("Khalti secret key is not configured. Set KHALTI_SECRET_KEY in the backend environment.");
        }

        String pidx = stringOrDefault(request.get("pidx"), payment.getGatewayTransactionId());
        if (pidx == null || pidx.isBlank()) {
            throw new IllegalArgumentException("pidx is required for Khalti verification");
        }

        Map<String, Object> responseMap = postJson(
                khaltiBaseUrl + "/epayment/lookup/",
                Map.of("pidx", pidx),
                Map.of(
                        "Authorization", "Key " + khaltiSecretKey,
                        "Content-Type", "application/json"
                )
        );

        String status = stringOrDefault(responseMap.get("status"), "UNKNOWN");
        String referenceId = stringOrDefault(responseMap.get("transaction_id"), null);

        payment.setGatewayProvider("KHALTI");
        payment.setGatewayTransactionId(pidx);
        payment.setGatewayReferenceId(referenceId);
        payment.setGatewayStatus(status);
        payment.setStatusUpdatedAt(new Date());

        if ("Completed".equalsIgnoreCase(status)) {
            markPaymentAsPaid(payment);
        } else {
            paymentRepository.save(payment);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gateway", "KHALTI");
        response.put("verified", "Completed".equalsIgnoreCase(status));
        response.put("status", status);
        response.put("referenceId", referenceId);
        response.put("paymentStatus", payment.getStatus());
        return response;
    }

    private void markPaymentAsPaid(Payment payment) {
        payment.setStatus("Paid");
        payment.setPaidDate(new Date());
        payment.setStatusUpdatedAt(new Date());
        paymentRepository.save(payment);
    }

    private String createEsewaSignature(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(esewaSecretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hmac);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to create eSewa signature", ex);
        }
    }

    private Map<String, Object> postJson(String url, Map<String, Object> payload, Map<String, String> headers) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)));

            headers.forEach(builder::header);

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            return parseResponse(response);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Payment gateway request failed", ex);
        }
    }

    private Map<String, Object> getJson(String url, Map<String, String> headers) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET();

            headers.forEach(builder::header);

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            return parseResponse(response);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Payment gateway request failed", ex);
        }
    }

    private Map<String, Object> parseResponse(HttpResponse<String> response) throws Exception {
        Map<String, Object> responseMap = objectMapper.readValue(response.body(), new TypeReference<>() {});
        if (response.statusCode() >= 400) {
            throw new IllegalArgumentException(extractGatewayError(responseMap, response.body()));
        }
        return responseMap;
    }

    private String extractGatewayError(Map<String, Object> responseMap, String fallbackBody) {
        if (responseMap.containsKey("detail")) {
            return responseMap.get("detail").toString();
        }
        if (responseMap.containsKey("error_key")) {
            return responseMap.get("error_key").toString();
        }
        return fallbackBody;
    }

    private long toPaisa(Double amount) {
        return BigDecimal.valueOf(amount)
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
    }

    private String formatAmount(Double amount) {
        return BigDecimal.valueOf(amount)
                .setScale(2, RoundingMode.HALF_UP)
                .stripTrailingZeros()
                .toPlainString();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String stringOrDefault(Object value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? defaultValue : text;
    }

    private Map<String, Object> attemptEsewaCallbackVerification(Payment payment, Map<String, String> queryParams) {
        try {
            String transactionUuid = payment.getGatewayTransactionId();
            String totalAmount = formatAmount(payment.getAmount());

            if (queryParams != null) {
                Map<String, Object> callbackData = decodeEsewaCallbackData(queryParams.get("data"));
                transactionUuid = stringOrDefault(callbackData.get("transaction_uuid"), transactionUuid);
                totalAmount = stringOrDefault(callbackData.get("total_amount"), totalAmount);
            }

            return verifyEsewa(payment, Map.of(
                    "gateway", "ESEWA",
                    "transactionUuid", transactionUuid,
                    "totalAmount", totalAmount
            ));
        } catch (Exception ex) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("verified", false);
            response.put("status", payment.getGatewayStatus() != null ? payment.getGatewayStatus() : "INITIATED");
            return response;
        }
    }

    private Map<String, Object> decodeEsewaCallbackData(String encodedData) {
        if (encodedData == null || encodedData.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(encodedData);
            return objectMapper.readValue(decoded, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }

    private String appendQueryParam(String baseUrl, String key, String value) {
        String delimiter = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + delimiter + encode(key) + "=" + encode(value);
    }

    private boolean isEsewaConfigured() {
        return esewaFormUrl != null && !esewaFormUrl.isBlank()
                && esewaStatusUrl != null && !esewaStatusUrl.isBlank()
                && esewaProductCode != null && !esewaProductCode.isBlank()
                && esewaSecretKey != null && !esewaSecretKey.isBlank();
    }

    private boolean isKhaltiConfigured() {
        return khaltiBaseUrl != null && !khaltiBaseUrl.isBlank()
                && khaltiSecretKey != null && !khaltiSecretKey.isBlank();
    }

    private void validateHttpUrl(String value, String fieldName) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException(fieldName + " must use http or https");
            }
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException(fieldName + " is not a valid URL");
        }
    }

    private void validateAppRedirectUrl(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (scheme == null || (!"tolunitymob".equalsIgnoreCase(scheme) && !"tolunity".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException("redirectUrl must use a supported TolUnity app scheme");
            }
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("redirectUrl is not a valid URL");
        }
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
