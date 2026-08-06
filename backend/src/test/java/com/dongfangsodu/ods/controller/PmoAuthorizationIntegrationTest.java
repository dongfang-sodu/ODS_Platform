package com.dongfangsodu.ods.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PmoAuthorizationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private PmoProjectRepository projects;

    @Test
    @WithMockUser(username = "pmo-user", roles = "PJM")
    void nonLpmCannotDeletePmoProject() throws Exception {
        PmoProject project = projects.save(new PmoProject("PMO-A", "Restricted project",
                ProjectLevel.L0, null, null, "MANUAL"));

        mockMvc.perform(delete("/api/v1/pmo/projects/{id}", project.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "lpm-user", roles = "LPM")
    void lpmSoftDeletesPmoProject() throws Exception {
        PmoProject project = projects.save(new PmoProject("PMO-B", "LPM project",
                ProjectLevel.L0, null, null, "MANUAL"));

        mockMvc.perform(delete("/api/v1/pmo/projects/{id}", project.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "project-manager", roles = "PROJECT_MANAGER")
    void projectManagerCanCreatePmoProject() throws Exception {
        mockMvc.perform(post("/api/v1/pmo/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"projectCode":"PMO-C","name":"Project manager project","capacity":10}
                                """))
                .andExpect(status().isOk());
    }
}
