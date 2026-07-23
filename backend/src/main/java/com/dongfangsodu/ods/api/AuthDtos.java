package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank @Size(max = 100) String username,
                               @NotBlank @Size(max = 255) String password) {
    }

    public record LoginResponse(String token, String tokenType, UserResponse user) {
    }

    public record UserResponse(String username, String email, String displayName, Set<Role> roles) {
    }
}
