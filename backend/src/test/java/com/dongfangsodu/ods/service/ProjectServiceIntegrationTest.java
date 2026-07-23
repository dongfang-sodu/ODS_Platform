package com.dongfangsodu.ods.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dongfangsodu.ods.api.ProjectDtos.CreateProjectRequest;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateProjectRequest;
import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.domain.ProjectStatus;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.repository.AcquisitionProjectRepository;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import com.dongfangsodu.ods.repository.ProjectRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProjectServiceIntegrationTest {
    @Autowired
    private ProjectService service;
    @Autowired
    private ProjectRepository projects;
    @Autowired
    private AcquisitionProjectRepository acquisitions;
    @Autowired
    private PmoProjectRepository pmoProjects;

    @Test
    void creatingAcquisitionProjectAlsoCreatesExactlyOnePmoL0() {
        var request = request("ODS-001", "Platform foundation");

        var created = service.create(request, "tpjm");

        assertThat(projects.findById(created.id())).isPresent();
        assertThat(acquisitions.findByProject_Id(created.id())).isPresent();
        assertThat(pmoProjects.findByProjectCode("ODS-001")).isPresent();
        assertThat(pmoProjects.findByProjectCode("ODS-001").orElseThrow().getLevel().name()).isEqualTo("L0");
    }

    @Test
    void duplicateProductTeamAndMilestoneRequiresExplicitReuse() {
        service.create(request("ODS-001", "Platform foundation"), "tpjm");

        assertThatThrownBy(() -> service.create(request("ODS-002", "Duplicate project"), "tpjm"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("复用");
    }

    @Test
    void manualPmoWithSameCodePreventsM1Creation() {
        pmoProjects.saveAndFlush(new PmoProject("ODS-MANUAL", "Manual PMO", ProjectLevel.L0, null,
                null, "MANUAL"));

        assertThatThrownBy(() -> service.create(request("ODS-MANUAL", "M1 project"), "tpjm"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("PMO 项目编号已存在");
        assertThat(projects.findByCode("ODS-MANUAL")).isEmpty();
    }

    @Test
    void softDeletedPmoWithSameCodePreventsM1Creation() {
        PmoProject deleted = new PmoProject("ODS-DELETED", "Deleted PMO", ProjectLevel.L0, null,
                null, "MANUAL");
        deleted.markDeleted("lpm");
        pmoProjects.saveAndFlush(deleted);

        assertThatThrownBy(() -> service.create(request("ODS-DELETED", "M1 project"), "tpjm"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("包括已删除项目");
        assertThat(projects.findByCode("ODS-DELETED")).isEmpty();
    }

    @Test
    void updatingM1NameSynchronizesItsAcquisitionPmo() {
        var created = service.create(request("ODS-SYNC", "Original name"), "tpjm");

        service.update(created.id(), updateRequest("Renamed project"));

        PmoProject synchronizedPmo = pmoProjects.findByProjectCode("ODS-SYNC").orElseThrow();
        assertThat(synchronizedPmo.getName()).isEqualTo("Renamed project");
        assertThat(synchronizedPmo.getSource()).isEqualTo("ACQUISITION");
    }

    @Test
    void updatingM1DoesNotRenameManualPmo() {
        var created = service.create(request("ODS-MANUAL-SYNC", "Original name"), "tpjm");
        PmoProject acquisitionPmo = pmoProjects.findByProjectCode("ODS-MANUAL-SYNC").orElseThrow();
        String acquisitionId = acquisitionPmo.getAcquisitionId();
        pmoProjects.delete(acquisitionPmo);
        pmoProjects.flush();
        pmoProjects.saveAndFlush(new PmoProject("ODS-MANUAL-SYNC", "Manual name", ProjectLevel.L0, null,
                acquisitionId, "MANUAL"));

        service.update(created.id(), updateRequest("Renamed project"));

        assertThat(pmoProjects.findByProjectCode("ODS-MANUAL-SYNC").orElseThrow().getName())
                .isEqualTo("Manual name");
    }

    private CreateProjectRequest request(String code, String name) {
        return new CreateProjectRequest(code, name, "Graduation project", "ODS", "Project Owner",
                "Platform Team", "QG4-2026-001", LocalDate.of(2026, 12, 31), "XC-AS");
    }

    private UpdateProjectRequest updateRequest(String name) {
        return new UpdateProjectRequest(name, "Graduation project", "ODS", "Project Owner",
                "Platform Team", LocalDate.of(2026, 12, 31), ProjectStatus.ACTIVE);
    }
}
