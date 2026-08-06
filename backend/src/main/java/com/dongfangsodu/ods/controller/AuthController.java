package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.AuthDtos.LoginRequest;
import com.dongfangsodu.ods.api.AuthDtos.LoginResponse;
import com.dongfangsodu.ods.api.AuthDtos.MessageResponse;
import com.dongfangsodu.ods.api.AuthDtos.PasswordResetConfirmRequest;
import com.dongfangsodu.ods.api.AuthDtos.PasswordResetRequest;
import com.dongfangsodu.ods.api.AuthDtos.RefreshRequest;
import com.dongfangsodu.ods.api.AuthDtos.SessionResponse;
import com.dongfangsodu.ods.api.AuthDtos.UserResponse;
import com.dongfangsodu.ods.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                            HttpServletRequest servletRequest) {
        return ApiResponse.of(authService.login(request.username(), request.password(),
                servletRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request,
                                              HttpServletRequest servletRequest) {
        return ApiResponse.of(authService.refresh(request.refreshToken(), servletRequest.getRemoteAddr()));
    }

    @PostMapping("/logout")
    public ApiResponse<MessageResponse> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ApiResponse.of(new MessageResponse("已退出登录"));
    }

    @PostMapping("/logout-all")
    public ApiResponse<MessageResponse> logoutAll(Principal principal) {
        authService.logoutAll(principal.getName());
        return ApiResponse.of(new MessageResponse("所有登录会话已注销"));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<SessionResponse>> sessions(Principal principal) {
        return ApiResponse.of(authService.sessions(principal.getName()));
    }

    @DeleteMapping("/sessions/{id}")
    public ApiResponse<MessageResponse> logoutSession(@PathVariable UUID id, Principal principal) {
        authService.logoutSession(principal.getName(), id);
        return ApiResponse.of(new MessageResponse("登录会话已注销"));
    }

    @PostMapping("/password-reset/request")
    public ApiResponse<MessageResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        return ApiResponse.of(authService.requestPasswordReset(request.email()));
    }

    @PostMapping("/password-reset/confirm")
    public ApiResponse<MessageResponse> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        return ApiResponse.of(authService.confirmPasswordReset(request.token(), request.newPassword()));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(Principal principal) {
        return ApiResponse.of(authService.currentUser(principal.getName()));
    }
}
