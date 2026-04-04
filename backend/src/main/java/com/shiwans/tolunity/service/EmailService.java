package com.shiwans.tolunity.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from-address:no-reply@tolunity.com}")
    private String fromAddress;

    @Value("${app.mail.from-name:TolUnity}")
    private String fromName;

    public void sendPasswordResetCode(String recipientEmail, String code) {
        if (mailHost == null || mailHost.isBlank()) {
            throw new IllegalStateException("Email service is not configured. Set MAIL_HOST, MAIL_USERNAME, and MAIL_PASSWORD.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("TolUnity password reset code");
            helper.setText(buildPasswordResetHtml(code), true);
            mailSender.send(message);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to send password reset email", exception);
        }
    }

    private String buildPasswordResetHtml(String code) {
        return """
                <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
                  <h2 style="margin-bottom: 8px;">TolUnity password reset</h2>
                  <p>Use the verification code below to reset your password.</p>
                  <div style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1d4ed8;">%s</div>
                  <p>This code expires in a few minutes. If you did not request it, you can ignore this email.</p>
                </div>
                """.formatted(code);
    }
}
