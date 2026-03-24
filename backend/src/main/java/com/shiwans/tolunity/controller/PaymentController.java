package com.shiwans.tolunity.controller;

import com.shiwans.tolunity.service.PaymentService;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/create-bill")
    public ResponseEntity<?> createBill(@RequestBody Map<String, Object> request) {
        return paymentService.createBill(request);
    }

    @PostMapping("/donate")
    public ResponseEntity<?> donateToCharity(@RequestBody Map<String, Object> request) {
        return paymentService.donateToCharity(request);
    }
}
