package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.AuthDtos.LoginResponse;
import com.dongfangsodu.ods.api.AuthDtos.UserResponse;
import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import com.dongfangsodu.ods.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserAccountRepository users;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, UserAccountRepository users, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.jwtService = jwtService;
    }

    public LoginResponse login(String username, String password) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        UserAccount user = account(principal.getUsername());
        return new LoginResponse(jwtService.generateToken(principal), "Bearer", toResponse(user));
    }

    public UserResponse currentUser(String username) {
        return toResponse(account(username));
    }

    private UserAccount account(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private UserResponse toResponse(UserAccount user) {
        return new UserResponse(user.getUsername(), user.getEmail(), user.getDisplayName(), user.getRoles());
    }
}
