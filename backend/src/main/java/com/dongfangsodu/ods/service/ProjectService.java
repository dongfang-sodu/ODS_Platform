package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.PageResponse;
import com.dongfangsodu.ods.api.ProjectDtos.AcquisitionStatusResponse;
import com.dongfangsodu.ods.api.ProjectDtos.CreateProjectRequest;
import com.dongfangsodu.ods.api.ProjectDtos.ProjectResponse;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateAcquisitionStatusRequest;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateProjectRequest;
import com.dongfangsodu.ods.domain.AcquisitionProject;
import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.Project;
import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.domain.ProjectStatus;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.AcquisitionProjectRepository;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import com.dongfangsodu.ods.repository.ProjectRepository;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ProjectService {
    private static final String ACQUISITION_SOURCE = "ACQUISITION";

    private final ProjectRepository projects;
    private final AcquisitionProjectRepository acquisitions;
    private final PmoProjectRepository pmoProjects;

    public ProjectService(ProjectRepository projects, AcquisitionProjectRepository acquisitions,
                          PmoProjectRepository pmoProjects) {
        this.projects = projects;
        this.acquisitions = acquisitions;
        this.pmoProjects = pmoProjects;
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, String username) {
        if (pmoProjects.existsByProjectCode(request.code())) {
            throw new ConflictException("PMO 项目编号已存在（包括已删除项目），不能创建同编号的 M1 项目");
        }
        if (projects.findByCode(request.code()).isPresent()) {
            throw new ConflictException("项目编号已存在");
        }
        String dedupeKey = dedupeKey(request.product(), request.team(), request.milestoneDate());
        if (projects.findByDedupeKey(dedupeKey).isPresent()) {
            throw new ConflictException("相同产品、团队和里程碑的项目已存在，请复用或确认是否需要合并");
        }
        try {
            Project project = projects.saveAndFlush(new Project(
                    request.code(), request.name(), request.description(), request.product(), request.owner(),
                    request.team(), request.qg4Reference(), request.milestoneDate(), dedupeKey, username));
            AcquisitionProject acquisition = acquisitions.saveAndFlush(
                    new AcquisitionProject(project, request.acquisitionDepartment()));
            PmoProject pmoProject = new PmoProject(project.getCode(), project.getName(), ProjectLevel.L0, null,
                    acquisition.getId().toString(), ACQUISITION_SOURCE);
            acquisition.markSynced();
            pmoProjects.saveAndFlush(pmoProject);
            return toResponse(project, true);
        } catch (DataIntegrityViolationException exception) {
            throw concurrentConflict(exception);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> search(String q, ProjectStatus status, String owner, int page, int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Project> result = projects.search(blankToNull(q), status, blankToNull(owner), pageable);
        return new PageResponse<>(result.stream().map(project -> toResponse(project,
                        acquisitions.findByProject_Id(project.getId()).isPresent())).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ProjectResponse find(UUID id) {
        Project project = project(id);
        return toResponse(project, acquisitions.findByProject_Id(id).isPresent());
    }

    @Transactional(readOnly = true)
    public java.util.List<ProjectResponse> export(String q, ProjectStatus status, String owner) {
        return projects.search(blankToNull(q), status, blankToNull(owner), Pageable.unpaged()).stream()
                .map(project -> toResponse(project, acquisitions.findByProject_Id(project.getId()).isPresent()))
                .toList();
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request) {
        Project project = project(id);
        String dedupeKey = dedupeKey(request.product(), request.team(), request.milestoneDate());
        projects.findByDedupeKey(dedupeKey)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("相同产品、团队和里程碑的项目已存在，请复用或确认是否需要合并");
                });
        try {
            project.update(request.name(), request.description(), request.product(), request.owner(), request.team(),
                    request.milestoneDate(), request.status() == null ? project.getStatus() : request.status(),
                    dedupeKey);
            var acquisition = acquisitions.findByProject_Id(id);
            acquisition.ifPresent(link -> pmoProjects
                    .findByProjectCodeAndAcquisitionIdAndSource(project.getCode(), link.getId().toString(),
                            ACQUISITION_SOURCE)
                    .ifPresent(pmo -> {
                        pmo.synchronizeName(request.name());
                        link.markSynced();
                    }));
            projects.flush();
            return toResponse(project, acquisition.isPresent());
        } catch (DataIntegrityViolationException exception) {
            throw concurrentConflict(exception);
        }
    }

    @Transactional(readOnly = true)
    public AcquisitionStatusResponse acquisitionStatus(UUID projectId) {
        return toAcquisitionResponse(acquisition(projectId));
    }

    @Transactional
    public AcquisitionStatusResponse updateAcquisitionStatus(UUID projectId, UpdateAcquisitionStatusRequest request) {
        AcquisitionProject acquisition = acquisition(projectId);
        acquisition.updateStatuses(request.offlineStatus(), request.committeeStatus(), request.salesforceStatus());
        return toAcquisitionResponse(acquisition);
    }

    private Project project(UUID id) {
        return projects.findById(id).orElseThrow(() -> new ResourceNotFoundException("项目不存在"));
    }

    private AcquisitionProject acquisition(UUID projectId) {
        return acquisitions.findByProject_Id(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("项目未关联 Acquisition 状态"));
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    private String dedupeKey(String product, String team, java.time.LocalDate milestoneDate) {
        return product.trim().toLowerCase(java.util.Locale.ROOT) + "|"
                + team.trim().toLowerCase(java.util.Locale.ROOT) + "|"
                + (milestoneDate == null ? "none" : milestoneDate);
    }

    private ConflictException concurrentConflict(DataIntegrityViolationException cause) {
        ConflictException conflict = new ConflictException(
                "项目编号或唯一性信息已被其他请求占用，请刷新后重试");
        conflict.initCause(cause);
        return conflict;
    }

    private ProjectResponse toResponse(Project project, boolean acquisitionLinked) {
        return new ProjectResponse(project.getId(), project.getCode(), project.getName(), project.getDescription(),
                project.getProduct(), project.getOwner(), project.getTeam(), project.getQg4Reference(),
                project.getStatus(), project.getMilestoneDate(), project.getSource(), project.isImmutable(),
                project.getCreatedBy(), acquisitionLinked);
    }

    private AcquisitionStatusResponse toAcquisitionResponse(AcquisitionProject acquisition) {
        return new AcquisitionStatusResponse(acquisition.getProject().getId(), acquisition.getOfflineStatus(),
                acquisition.getCommitteeStatus(), acquisition.getSalesforceStatus(), acquisition.getOwnerDepartment());
    }
}
