package com.dongfangsodu.ods.security;

import com.dongfangsodu.ods.domain.UserAccount;

public interface PasswordResetNotifier {
    void send(UserAccount user, String rawToken);
}
