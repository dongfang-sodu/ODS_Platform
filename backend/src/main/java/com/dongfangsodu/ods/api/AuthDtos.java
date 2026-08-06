package com.dongfangsodu.ods.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.dongfangsodu.ods.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.time.Instant;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank @Size(max = 100) String username,
                               @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
                               @NotBlank @Size(max = 255) String password) {
        @Override
        public String toString() {
            return "LoginRequest[username=" + username + ", password=[REDACTED]]";
        }
    }

    public record LoginResponse(String token, String refreshToken, long expiresInSeconds,
                                String tokenType, UserResponse user) {
    }

    public record RefreshRequest(@NotBlank @Size(max = 512) String refreshToken) {
    }

    public record PasswordResetRequest(@NotBlank @Email @Size(max = 255) String email) {
    }

    public record PasswordResetConfirmRequest(
            @NotBlank @Size(max = 512) String token,
            @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
            @NotBlank @Size(min = 12, max = 255)
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "密码必须包含大写字母、小写字母、数字和特殊字符")
            String newPassword) {
    }

    public record MessageResponse(String message) {
    }

    public record SessionResponse(UUID id, Instant createdAt, Instant expiresAt, String createdByIp) {
    }

    public record UserResponse(String username, String email, String displayName, Set<Role> roles) {
    }
}
