package com.shiwans.tolunity.service;

import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.dto.PaymentDto;
import com.shiwans.tolunity.entities.Payments.Payment;
import com.shiwans.tolunity.entities.User;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class PaymentDtoMapper {

    private final UserRepository userRepository;

    public PaymentDtoMapper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public java.util.List<PaymentDto> toDtos(Collection<Payment> payments) {
        if (payments == null || payments.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> userIds = payments.stream()
                .flatMap(payment -> Stream.of(payment.getPayerId(), payment.getPayeeId()))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return payments.stream()
                .map(payment -> toDto(payment, usersById))
                .collect(Collectors.toList());
    }

    private PaymentDto toDto(Payment payment, Map<Long, User> usersById) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        dto.setTitle(payment.getTitle());
        dto.setAmount(payment.getAmount());
        dto.setDueDate(payment.getDueDate());
        dto.setStatus(payment.getStatus());
        dto.setCategory(payment.getCategory());
        dto.setPayerId(payment.getPayerId());
        dto.setPayeeId(payment.getPayeeId());
        dto.setIcon(resolveIcon(payment.getCategory()));
        dto.setGatewayProvider(payment.getGatewayProvider());
        dto.setGatewayStatus(payment.getGatewayStatus());

        User payer = payment.getPayerId() != null ? usersById.get(payment.getPayerId()) : null;
        if (payer != null) {
            dto.setPayerName(payer.getName());
        }

        User payee = payment.getPayeeId() != null ? usersById.get(payment.getPayeeId()) : null;
        if (payee != null) {
            dto.setPayeeName(payee.getName());
        }

        return dto;
    }

    private String resolveIcon(String category) {
        if (category == null) {
            return "cash-outline";
        }

        return switch (category.toUpperCase()) {
            case "RENT" -> "home-outline";
            case "MAINTENANCE" -> "construct-outline";
            case "GARBAGE" -> "trash-outline";
            case "CHARITY" -> "heart-outline";
            default -> "cash-outline";
        };
    }
}
