package com.dongfangsodu.ods.security;

import com.dongfangsodu.ods.domain.UserAccount;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "ods.security.password-reset-mail-enabled", havingValue = "false",
        matchIfMissing = true)
public class DisabledPasswordResetNotifier implements PasswordResetNotifier {
    @Override
    public void send(UserAccount user, String rawToken) {
    }
}
