package com.dongfangsodu.ods.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dongfangsodu.ods.domain.Role;
import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import java.util.Set;
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
}
