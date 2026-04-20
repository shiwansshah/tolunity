package com.shiwans.tolunity.service;

import com.shiwans.tolunity.exception.EmailDeliveryException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from-address:shiwans099@gmail.com}")
    private String fromAddress;

    @Value("${app.mail.from-name:TolUnity}")
    private String fromName;

    public void sendPasswordResetCode(String recipientEmail, String code) {
        validateMailConfiguration();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("TolUnity password reset code");
            helper.setText(buildPasswordResetHtml(code), true);
            mailSender.send(message);
        } catch (MailAuthenticationException exception) {
            log.error("Mail authentication failed while sending password reset email to {} via host {} using username {}",
                    recipientEmail, mailHost, mailUsername, exception);
            throw new EmailDeliveryException(
                    "Password reset email could not be sent right now. Please try again later.",
                    "Mail authentication failed while sending password reset email",
                    exception);
        } catch (MailSendException exception) {
            log.error("SMTP server rejected or could not deliver password reset email to {} via host {}",
                    recipientEmail, mailHost, exception);
            throw new EmailDeliveryException(
                    "Password reset email could not be sent right now. Please try again later.",
                    "SMTP server rejected password reset email",
                    exception);
        } catch (MailException exception) {
            log.error("Mail transport error while sending password reset email to {} via host {}",
                    recipientEmail, mailHost, exception);
            throw new EmailDeliveryException(
                    "Password reset email could not be sent right now. Please try again later.",
                    "Mail transport failed while sending password reset email",
                    exception);
        } catch (Exception exception) {
            log.error("Unexpected error while preparing password reset email for {}", recipientEmail, exception);
            throw new EmailDeliveryException(
                    "Password reset email could not be sent right now. Please try again later.",
                    "Unexpected error while preparing password reset email",
                    exception);
        }
    }

    private void validateMailConfiguration() {
        if (mailHost == null || mailHost.isBlank()) {
            throw new EmailDeliveryException(
                    "Password reset email is not available right now.",
                    "Email service is not configured: MAIL_HOST is missing");
        }
        if (mailUsername == null || mailUsername.isBlank()) {
            throw new EmailDeliveryException(
                    "Password reset email is not available right now.",
                    "Email service is not configured: MAIL_USERNAME is missing");
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            throw new EmailDeliveryException(
                    "Password reset email is not available right now.",
                    "Email service is not configured: MAIL_PASSWORD is missing");
        }
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new EmailDeliveryException(
                    "Password reset email is not available right now.",
                    "Email service is not configured: MAIL_FROM_ADDRESS or spring.mail.username is missing");
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
