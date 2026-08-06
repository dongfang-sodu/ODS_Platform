package com.dongfangsodu.ods.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dongfangsodu.ods.domain.Role;
import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import java.util.Set;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthenticationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserAccountRepository users;
    @Autowired
    private PlatformUserDetailsService userDetails;
    @Autowired
    private JwtService tokens;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void currentUserRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void tokenStopsWorkingAfterUserIsDisabled() throws Exception {
        UserAccount account = users.save(new UserAccount("security-user", "security@ods.local",
                passwordEncoder.encode("StrongTestPassword!"), "Security User", Set.of(Role.USER)));
        String token = tokens.generateToken(userDetails.loadUserByUsername(account.getUsername()));
        account.setEnabled(false);
        users.flush();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void tokenForDeletedUserReturnsUnauthorized() throws Exception {
        UserAccount account = users.save(new UserAccount("deleted-user", "deleted@ods.local",
                passwordEncoder.encode("StrongTestPassword!"), "Deleted User", Set.of(Role.USER)));
        String token = tokens.generateToken(userDetails.loadUserByUsername(account.getUsername()));
        users.delete(account);
        users.flush();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void loginIssuesRotatingRefreshToken() throws Exception {
        users.save(new UserAccount("refresh-user", "refresh@ods.local",
                passwordEncoder.encode("StrongTestPassword!"), "Refresh User", Set.of(Role.USER)));

        String loginBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"refresh-user","password":"StrongTestPassword!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(900))
                .andReturn().getResponse().getContentAsString();
        JsonNode login = objectMapper.readTree(loginBody).path("data");
        String firstRefreshToken = login.path("refreshToken").asText();

        String refreshBody = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("refreshToken", firstRefreshToken))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String replacement = objectMapper.readTree(refreshBody).path("data").path("refreshToken").asText();
        org.assertj.core.api.Assertions.assertThat(replacement).isNotBlank().isNotEqualTo(firstRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("refreshToken", firstRefreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCanListAndRevokeOwnSessions() throws Exception {
        users.save(new UserAccount("session-user", "session@ods.local",
                passwordEncoder.encode("StrongTestPassword!"), "Session User", Set.of(Role.USER)));

        String loginBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"session-user","password":"StrongTestPassword!"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode login = objectMapper.readTree(loginBody).path("data");
        String accessToken = login.path("token").asText();

        String sessionsBody = mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(sessionsBody).path("data").get(0).path("id").asText();

        mockMvc.perform(delete("/api/v1/auth/sessions/{id}", sessionId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void fiveFailedLoginsLockAccount() throws Exception {
        users.save(new UserAccount("locked-user", "locked@ods.local",
                passwordEncoder.encode("StrongTestPassword!"), "Locked User", Set.of(Role.USER)));
        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"username":"locked-user","password":"WrongPassword!1"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"locked-user","password":"StrongTestPassword!"}
                                """))
                .andExpect(status().isUnauthorized());
        org.assertj.core.api.Assertions.assertThat(users.findByUsername("locked-user").orElseThrow()
                .getLockedUntil()).isAfter(java.time.Instant.now());
    }

    @Test
    void passwordResetRequestDoesNotRevealWhetherEmailExists() throws Exception {
        mockMvc.perform(post("/api/v1/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"unknown@ods.local"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").exists());
    }
}
