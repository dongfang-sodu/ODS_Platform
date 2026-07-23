package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.AuthDtos.LoginRequest;
import com.dongfangsodu.ods.api.AuthDtos.LoginResponse;
import com.dongfangsodu.ods.api.AuthDtos.UserResponse;
import com.dongfangsodu.ods.service.AuthService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.of(authService.login(request.username(), request.password()));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(Principal principal) {
        return ApiResponse.of(authService.currentUser(principal.getName()));
    }
}
