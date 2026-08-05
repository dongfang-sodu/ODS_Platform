package com.dongfangsodu.ods.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dongfangsodu.ods.domain.AcquisitionProject;
import com.dongfangsodu.ods.domain.Project;
import com.dongfangsodu.ods.repository.AcquisitionProjectRepository;
import com.dongfangsodu.ods.repository.ProjectRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
class AcquisitionAuthorizationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ProjectRepository projects;
    @Autowired
    private AcquisitionProjectRepository acquisitions;

    @Test
    @WithMockUser(username = "project-reader", roles = "USER")
    void authenticatedUserCanReadAcquisitionStatus() throws Exception {
        Project project = saveAcquisitionProject();

        mockMvc.perform(get("/api/v1/projects/{id}/acquisition-status", project.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offlineStatus").value("Not started"))
                .andExpect(jsonPath("$.data.ownerDepartment").value("PCB"));
    }

    @Test
    @WithMockUser(username = "project-reader", roles = "USER")
    void ordinaryUserCannotUpdateAcquisitionStatus() throws Exception {
        Project project = saveAcquisitionProject();

        mockMvc.perform(updateRequest(project))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"PCB", "SCP", "ADMIN"})
    void authorizedRolesCanUpdateAcquisitionStatus(String role) throws Exception {
        Project project = saveAcquisitionProject();

        mockMvc.perform(updateRequest(project).with(user("status-editor").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offlineStatus").value("Qualified"))
                .andExpect(jsonPath("$.data.committeeStatus").value("Approved"))
                .andExpect(jsonPath("$.data.salesforceStatus").value("Won"))
                .andExpect(jsonPath("$.data.ownerDepartment").value("PCB"));
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder updateRequest(Project project) {
        return patch("/api/v1/projects/{id}/acquisition-status", project.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "offlineStatus": "Qualified",
                          "committeeStatus": "Approved",
                          "salesforceStatus": "Won"
                        }
                        """);
    }

    private Project saveAcquisitionProject() {
        String suffix = UUID.randomUUID().toString();
        Project project = projects.save(new Project("ACQ-" + suffix, "Acquisition test", null,
                "ADAS", "Project Owner", "XC-AS", "QG4-TEST", LocalDate.of(2026, 12, 1),
                "acquisition-test-" + suffix, "test-user"));
        acquisitions.save(new AcquisitionProject(project, "PCB"));
        return project;
    }
}
