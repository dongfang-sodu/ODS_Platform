package com.dongfangsodu.ods.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.dongfangsodu.ods.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

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

    public record LoginResponse(String token, String tokenType, UserResponse user) {
    }

    public record UserResponse(String username, String email, String displayName, Set<Role> roles) {
    }
}
