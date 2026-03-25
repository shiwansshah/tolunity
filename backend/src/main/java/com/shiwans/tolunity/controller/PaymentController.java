package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.service.UserServices.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/my-payments")
    public ResponseEntity<?> getPayments() {
        return paymentService.getPayments();
    }

    @PostMapping("/pay/{paymentId}")
    public ResponseEntity<?> payBill(@PathVariable Long paymentId) {
        return paymentService.payBill(paymentId);
    }

    @PostMapping("/pay/{paymentId}/initiate")
    public ResponseEntity<?> initiatePayment(@PathVariable Long paymentId, @RequestBody Map<String, Object> request) {
        return paymentService.initiatePayment(paymentId, request);
    }

    @PostMapping("/pay/{paymentId}/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable Long paymentId, @RequestBody Map<String, Object> request) {
        return paymentService.verifyPayment(paymentId, request);
    }

    @GetMapping(value = "/pay/{paymentId}/esewa-redirect", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getEsewaRedirectPage(
            @PathVariable Long paymentId,
            @RequestParam String transactionUuid,
            @RequestParam String successUrl,
            @RequestParam String failureUrl
    ) {
        return paymentService.getEsewaRedirectPage(paymentId, transactionUuid, successUrl, failureUrl);
    }

    @PostMapping("/create-bill")
    public ResponseEntity<?> createBill(@RequestBody Map<String, Object> request) {
        return paymentService.createBill(request);
    }

    @PostMapping("/donate")
    public ResponseEntity<?> donateToCharity(@RequestBody Map<String, Object> request) {
        return paymentService.donateToCharity(request);
    }
}
