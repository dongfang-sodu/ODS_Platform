package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.AuthDtos.LoginResponse;
import com.dongfangsodu.ods.api.AuthDtos.MessageResponse;
import com.dongfangsodu.ods.api.AuthDtos.SessionResponse;
import com.dongfangsodu.ods.api.AuthDtos.UserResponse;
import com.dongfangsodu.ods.domain.PasswordResetToken;
import com.dongfangsodu.ods.domain.RefreshToken;
import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.PasswordResetTokenRepository;
import com.dongfangsodu.ods.repository.RefreshTokenRepository;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import com.dongfangsodu.ods.security.JwtService;
import com.dongfangsodu.ods.security.OpaqueTokenService;
import com.dongfangsodu.ods.security.PasswordResetNotifier;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final int MAXIMUM_LOGIN_ATTEMPTS = 5;
    private static final Duration LOGIN_LOCK_DURATION = Duration.ofMinutes(3);
    private static final Duration PASSWORD_RESET_DURATION = Duration.ofMinutes(15);

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserAccountRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository passwordResetTokens;
    private final JwtService jwtService;
    private final OpaqueTokenService opaqueTokens;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetNotifier passwordResetNotifier;
    private final Duration refreshTokenDuration;

    public AuthService(AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       UserAccountRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordResetTokenRepository passwordResetTokens,
                       JwtService jwtService,
                       OpaqueTokenService opaqueTokens,
                       PasswordEncoder passwordEncoder,
                       PasswordResetNotifier passwordResetNotifier,
                       @Value("${ods.security.refresh-token-hours:8}") long refreshTokenHours) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordResetTokens = passwordResetTokens;
        this.jwtService = jwtService;
        this.opaqueTokens = opaqueTokens;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetNotifier = passwordResetNotifier;
        this.refreshTokenDuration = Duration.ofHours(refreshTokenHours);
    }

    @Transactional(noRollbackFor = AuthenticationException.class)
    public LoginResponse login(String username, String password, String clientIp) {
        try {
            var authentication = authenticationManager.authenticate(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            username, password));
            UserDetails principal = (UserDetails) authentication.getPrincipal();
            UserAccount user = account(principal.getUsername());
            user.clearLoginFailures();
            return issueSession(user, principal, clientIp);
        } catch (AuthenticationException exception) {
            users.findByUsername(username).ifPresent(user -> {
                Instant now = Instant.now();
                if (user.isEnabled() && !user.isLockedAt(now)) {
                    user.recordFailedLogin(MAXIMUM_LOGIN_ATTEMPTS, now.plus(LOGIN_LOCK_DURATION));
                    users.saveAndFlush(user);
                }
            });
            throw exception;
        }
    }

    @Transactional
    public LoginResponse refresh(String rawRefreshToken, String clientIp) {
        Instant now = Instant.now();
        RefreshToken current = refreshTokens.findByTokenHash(opaqueTokens.hash(rawRefreshToken))
                .orElseThrow(() -> new BadCredentialsException("刷新令牌无效"));
        if (!current.isUsableAt(now)) {
            throw new BadCredentialsException("刷新令牌已失效");
        }

        UserAccount user = current.getUser();
        UserDetails principal = userDetailsService.loadUserByUsername(user.getUsername());
        String replacement = opaqueTokens.generate();
        String replacementHash = opaqueTokens.hash(replacement);
        current.revoke(now, replacementHash);
        refreshTokens.save(new RefreshToken(user, replacementHash, now.plus(refreshTokenDuration), clientIp));
        return response(user, principal, replacement);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokens.findByTokenHash(opaqueTokens.hash(rawRefreshToken))
                .filter(token -> token.getRevokedAt() == null)
                .ifPresent(token -> token.revoke(Instant.now(), null));
    }

    @Transactional
    public void logoutAll(String username) {
        refreshTokens.revokeAllForUser(account(username).getId(), Instant.now());
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> sessions(String username) {
        return refreshTokens.findByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        account(username).getId(), Instant.now()).stream()
                .map(token -> new SessionResponse(token.getId(), token.getCreatedAt(), token.getExpiresAt(),
                        token.getCreatedByIp()))
                .toList();
    }

    @Transactional
    public void logoutSession(String username, UUID sessionId) {
        RefreshToken token = refreshTokens.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("登录会话不存在"));
        if (!token.getUser().getId().equals(account(username).getId())) {
            throw new ResourceNotFoundException("登录会话不存在");
        }
        token.revoke(Instant.now(), null);
    }

    @Transactional
    public MessageResponse requestPasswordReset(String email) {
        users.findByEmailIgnoreCase(email).filter(UserAccount::isEnabled).ifPresent(user -> {
            Instant now = Instant.now();
            passwordResetTokens.invalidateAllForUser(user.getId(), now);
            String rawToken = opaqueTokens.generate();
            passwordResetTokens.save(new PasswordResetToken(
                    user, opaqueTokens.hash(rawToken), now.plus(PASSWORD_RESET_DURATION)));
            passwordResetNotifier.send(user, rawToken);
        });
        return new MessageResponse("如果邮箱对应有效账号，系统将发送一次性密码重置链接");
    }

    @Transactional
    public MessageResponse confirmPasswordReset(String rawToken, String newPassword) {
        Instant now = Instant.now();
        PasswordResetToken resetToken = passwordResetTokens.findByTokenHash(opaqueTokens.hash(rawToken))
                .orElseThrow(() -> new BadCredentialsException("密码重置链接无效"));
        if (!resetToken.isUsableAt(now)) {
            throw new BadCredentialsException("密码重置链接已失效");
        }
        UserAccount user = resetToken.getUser();
        user.changePassword(passwordEncoder.encode(newPassword), now);
        passwordResetTokens.invalidateAllForUser(user.getId(), now);
        refreshTokens.revokeAllForUser(user.getId(), now);
        return new MessageResponse("密码已重置，请重新登录");
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String username) {
        return toResponse(account(username));
    }

    private LoginResponse issueSession(UserAccount user, UserDetails principal, String clientIp) {
        String rawRefreshToken = opaqueTokens.generate();
        refreshTokens.save(new RefreshToken(user, opaqueTokens.hash(rawRefreshToken),
                Instant.now().plus(refreshTokenDuration), clientIp));
        return response(user, principal, rawRefreshToken);
    }

    private LoginResponse response(UserAccount user, UserDetails principal, String rawRefreshToken) {
        return new LoginResponse(jwtService.generateToken(principal), rawRefreshToken,
                jwtService.expirationSeconds(), "Bearer", toResponse(user));
    }

    private UserAccount account(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private UserResponse toResponse(UserAccount user) {
        return new UserResponse(user.getUsername(), user.getEmail(), user.getDisplayName(), user.getRoles());
    }
}
