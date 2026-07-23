package com.dongfangsodu.ods.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.dongfangsodu.ods.api.ProjectDtos.CreateProjectRequest;
import com.dongfangsodu.ods.domain.AcquisitionProject;
import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.Project;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.repository.AcquisitionProjectRepository;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import com.dongfangsodu.ods.repository.ProjectRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class ProjectServiceConcurrencyTest {
    @Mock
    private ProjectRepository projects;
    @Mock
    private AcquisitionProjectRepository acquisitions;
    @Mock
    private PmoProjectRepository pmoProjects;
    @InjectMocks
    private ProjectService service;

    @Test
    void concurrentPmoUniqueConstraintViolationBecomesConflictException() {
        CreateProjectRequest request = new CreateProjectRequest("ODS-RACE", "Concurrent project",
                "Graduation project", "ODS", "Project Owner", "Platform Team", "QG4-2026-001",
                LocalDate.of(2026, 12, 31), "XC-AS");
        Project persistedProject = mock(Project.class);
        AcquisitionProject persistedAcquisition = mock(AcquisitionProject.class);
        when(pmoProjects.existsByProjectCode("ODS-RACE")).thenReturn(false);
        when(projects.findByCode("ODS-RACE")).thenReturn(Optional.empty());
        when(projects.findByDedupeKey("ods|platform team|2026-12-31")).thenReturn(Optional.empty());
        when(projects.saveAndFlush(any(Project.class))).thenReturn(persistedProject);
        when(persistedProject.getCode()).thenReturn("ODS-RACE");
        when(persistedProject.getName()).thenReturn("Concurrent project");
        when(acquisitions.saveAndFlush(any(AcquisitionProject.class))).thenReturn(persistedAcquisition);
        when(persistedAcquisition.getId()).thenReturn(UUID.randomUUID());
        when(pmoProjects.saveAndFlush(any(PmoProject.class)))
                .thenThrow(new DataIntegrityViolationException("simulated concurrent insert"));

        assertThatThrownBy(() -> service.create(request, "tpjm"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("其他请求占用")
                .hasCauseInstanceOf(DataIntegrityViolationException.class);
    }
}
