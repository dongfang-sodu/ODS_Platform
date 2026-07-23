package com.dongfangsodu.ods.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dongfangsodu.ods.domain.TrainingCourse;
import com.dongfangsodu.ods.repository.TrainingCourseRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
class TrainingAuthorizationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TrainingCourseRepository courses;

    @Test
    @WithMockUser(username = "other-trainer", roles = "TRAINER")
    void trainerCannotPublishAnotherOwnersCourse() throws Exception {
        TrainingCourse course = saveCourse("course-owner");

        mockMvc.perform(post("/api/v1/training/courses/{id}/publish", course.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "course-owner", roles = "TRAINER")
    void trainerCanMaintainOwnCourse() throws Exception {
        TrainingCourse course = saveCourse("course-owner");

        mockMvc.perform(post("/api/v1/training/courses/{id}/publish", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data.ownerUsername").value("course-owner"));
    }

    @Test
    @WithMockUser(username = "academy-coordinator", roles = "COORDINATOR")
    void coordinatorCanMaintainAnyCourse() throws Exception {
        TrainingCourse course = saveCourse("course-owner");

        mockMvc.perform(post("/api/v1/training/courses/{id}/publish", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }

    @Test
    @WithMockUser(username = "platform-admin", roles = "ADMIN")
    void adminCanMaintainAnyCourse() throws Exception {
        TrainingCourse course = saveCourse("course-owner");

        mockMvc.perform(post("/api/v1/training/courses/{id}/cancel", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    @WithMockUser(username = "reader", roles = "USER")
    void authenticatedUserCanReadCourseList() throws Exception {
        saveCourse("course-owner");

        mockMvc.perform(get("/api/v1/training/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ownerUsername").value("course-owner"));
    }

    @Test
    @WithMockUser(username = "new-trainer", roles = "TRAINER")
    void createUsesAuthenticatedUsernameAsOwner() throws Exception {
        mockMvc.perform(post("/api/v1/training/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "topic": "New owned course",
                                  "startAt": "2026-08-01T09:00:00Z",
                                  "endAt": "2026-08-01T10:00:00Z",
                                  "trainer": "Academy Trainer",
                                  "coordinator": "EDS Academy",
                                  "trainee": "XC-AS team",
                                  "trainingDept": "EDS",
                                  "description": "Owned by current authentication"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ownerUsername").value("new-trainer"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }

    private TrainingCourse saveCourse(String ownerUsername) {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return courses.save(new TrainingCourse("Academy course", start, start.plus(1, ChronoUnit.HOURS),
                "Academy Trainer", "EDS Academy", "XC-AS team", "EDS", null,
                "Course description", ownerUsername));
    }
}
