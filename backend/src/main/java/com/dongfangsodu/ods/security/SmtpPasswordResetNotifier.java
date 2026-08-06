package com.dongfangsodu.ods.security;

import com.dongfangsodu.ods.domain.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@ConditionalOnProperty(name = "ods.security.password-reset-mail-enabled", havingValue = "true")
public class SmtpPasswordResetNotifier implements PasswordResetNotifier {
    private final JavaMailSender mailSender;
    private final String from;
    private final String resetBaseUrl;

    public SmtpPasswordResetNotifier(JavaMailSender mailSender,
                                     @Value("${ods.security.password-reset-mail-from}") String from,
                                     @Value("${ods.security.password-reset-base-url}") String resetBaseUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.resetBaseUrl = resetBaseUrl;
    }

    @Override
    public void send(UserAccount user, String rawToken) {
        String link = UriComponentsBuilder.fromUriString(resetBaseUrl)
                .queryParam("token", rawToken)
                .build()
                .toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("ODS 密码重置");
        message.setText("您好，" + user.getDisplayName() + "：\n\n请在 15 分钟内使用以下链接重置密码：\n"
                + link + "\n\n如果不是您本人申请，请忽略本邮件。");
        mailSender.send(message);
    }
}
