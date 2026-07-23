package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public final class ProjectDtos {
    private ProjectDtos() {
    }

    public record CreateProjectRequest(
            @NotBlank @Size(max = 80) String code,
            @NotBlank @Size(max = 200) String name,
            String description,
            @NotBlank @Size(max = 150) String product,
            @NotBlank @Size(max = 150) String owner,
            @NotBlank @Size(max = 200) String team,
            @NotBlank @Size(max = 120) String qg4Reference,
            LocalDate milestoneDate,
            @NotBlank @Size(max = 120) String acquisitionDepartment) {
    }

    public record UpdateProjectRequest(
            @NotBlank @Size(max = 200) String name,
            String description,
            @NotBlank @Size(max = 150) String product,
            @NotBlank @Size(max = 150) String owner,
            @NotBlank @Size(max = 200) String team,
            LocalDate milestoneDate,
            ProjectStatus status) {
    }

    public record ProjectResponse(
            UUID id,
            String code,
            String name,
            String description,
            String product,
            String owner,
            String team,
            String qg4Reference,
            ProjectStatus status,
            LocalDate milestoneDate,
            String source,
            boolean immutable,
            String createdBy,
            boolean acquisitionLinked) {
    }

    public record AcquisitionStatusResponse(UUID projectId, String offlineStatus, String committeeStatus,
                                            String salesforceStatus, String ownerDepartment) {
    }

    public record UpdateAcquisitionStatusRequest(@NotBlank @Size(max = 80) String offlineStatus,
                                                 @NotBlank @Size(max = 80) String committeeStatus,
                                                 @NotBlank @Size(max = 80) String salesforceStatus) {
    }
}
