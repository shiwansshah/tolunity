package com.shiwans.tolunity.service.AdminServices;

import com.shiwans.tolunity.Repo.AdminRepos.AdminAuditLogRepository;
import com.shiwans.tolunity.Repo.UserRepository;
import com.shiwans.tolunity.Util.SecurityUtil;
import com.shiwans.tolunity.dto.AdminAuditLogDto;
import com.shiwans.tolunity.entities.Admin.AdminAuditLog;
import com.shiwans.tolunity.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final UserRepository userRepository;

    public void logAction(String actionType, String targetType, Long targetId, String summary, String details) {
        Long actorId = SecurityUtil.getCurrentUserId();
        User actor = actorId != null ? userRepository.findByIdAndDelFlgFalse(actorId).orElse(null) : null;

        AdminAuditLog log = AdminAuditLog.builder()
                .actorId(actorId)
                .actorName(actor != null ? actor.getName() : "System")
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .summary(summary)
                .details(details)
                .build();

        adminAuditLogRepository.save(log);
    }

    public ResponseEntity<?> getAuditLogs() {
        List<AdminAuditLogDto> logs = adminAuditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(logs);
    }

    private AdminAuditLogDto toDto(AdminAuditLog log) {
        AdminAuditLogDto dto = new AdminAuditLogDto();
        dto.setId(log.getId());
        dto.setActorId(log.getActorId());
        dto.setActorName(log.getActorName());
        dto.setActionType(log.getActionType());
        dto.setTargetType(log.getTargetType());
        dto.setTargetId(log.getTargetId());
        dto.setSummary(log.getSummary());
        dto.setDetails(log.getDetails());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
