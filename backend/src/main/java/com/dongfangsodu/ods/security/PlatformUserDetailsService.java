package com.dongfangsodu.ods.security;

import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import java.time.Instant;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PlatformUserDetailsService implements UserDetailsService {
    private final UserAccountRepository users;

    public PlatformUserDetailsService(UserAccountRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = users.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在"));
        String[] roles = account.getRoles().stream().map(Enum::name).toArray(String[]::new);
        return User.withUsername(account.getUsername())
                .password(account.getPasswordHash())
                .roles(roles)
                .disabled(!account.isEnabled())
                .accountLocked(account.isLockedAt(Instant.now()))
                .build();
    }
}
