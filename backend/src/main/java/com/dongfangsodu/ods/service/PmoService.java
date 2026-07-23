package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.PageResponse;
import com.dongfangsodu.ods.api.PmoDtos.CreateChildRequest;
import com.dongfangsodu.ods.api.PmoDtos.CreatePmoRequest;
import com.dongfangsodu.ods.api.PmoDtos.PmoResponse;
import com.dongfangsodu.ods.api.PmoDtos.UpdatePmoRequest;
import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.domain.RiskStatus;
import com.dongfangsodu.ods.exception.BusinessRuleException;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PmoService {
    private final PmoProjectRepository projects;

    public PmoService(PmoProjectRepository projects) {
        this.projects = projects;
    }

    @Transactional(readOnly = true)
    public PageResponse<PmoResponse> search(String q, ProjectLevel level, int page, int size) {
        Page<PmoProject> result = projects.search(StringUtils.hasText(q) ? q : null, level,
                PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PageResponse<>(result.stream().map(this::toResponse).toList(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public PmoResponse createL0(CreatePmoRequest request) {
        ensureCodeAvailable(request.projectCode());
        PmoProject project = new PmoProject(request.projectCode(), request.name(), ProjectLevel.L0, null,
                request.acquisitionId(), "MANUAL");
        project.update(request.name(), request.capacity(), RiskStatus.NOT_STARTED, null, false, false);
        return toResponse(projects.save(project));
    }

    @Transactional
    public PmoResponse createL1(UUID parentId, CreateChildRequest request) {
        PmoProject parent = project(parentId);
        if (parent.getLevel() != ProjectLevel.L0 || parent.getDeletedAt() != null) {
            throw new BusinessRuleException("L1 项目必须挂在有效的 L0 项目下");
        }
        ensureCodeAvailable(request.projectCode());
        PmoProject child = new PmoProject(request.projectCode(), request.name(), ProjectLevel.L1, parent,
                parent.getAcquisitionId(), "MANUAL");
        child.update(request.name(), request.capacity(), RiskStatus.NOT_STARTED, null, false, false);
        return toResponse(projects.save(child));
    }

    @Transactional
    public PmoResponse update(UUID id, UpdatePmoRequest request) {
        PmoProject project = project(id);
        ensureActive(project);
        RiskStatus riskStatus = request.riskStatus() == null ? project.getRiskStatus() : request.riskStatus();
        project.update(request.name(), request.capacity(), riskStatus, request.mprEscalation(),
                request.keyProject(), request.highlightProject());
        return toResponse(project);
    }

    @Transactional
    public void softDelete(UUID id, String username) {
        PmoProject project = project(id);
        ensureActive(project);
        if (project.getLevel() == ProjectLevel.L0 && !projects.findByParent_IdAndDeletedAtIsNull(id).isEmpty()) {
            throw new ConflictException("该 L0 项目仍有有效 L1 子项目，不能删除");
        }
        project.markDeleted(username);
    }

    private void ensureCodeAvailable(String code) {
        if (projects.findByProjectCode(code).isPresent()) {
            throw new ConflictException("PMO 项目编号已存在");
        }
    }

    private PmoProject project(UUID id) {
        return projects.findById(id).orElseThrow(() -> new ResourceNotFoundException("PMO 项目不存在"));
    }

    private void ensureActive(PmoProject project) {
        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("PMO 项目不存在");
        }
    }

    private PmoResponse toResponse(PmoProject project) {
        UUID parentId = project.getParent() == null ? null : project.getParent().getId();
        return new PmoResponse(project.getId(), project.getProjectCode(), project.getName(), project.getLevel(),
                parentId, project.getAcquisitionId(), project.getCapacity(), project.getRiskStatus(),
                project.getMprEscalation(), project.isKeyProject(), project.isHighlightProject(),
                project.getSource(), project.getDeletedAt(), project.getDeletedBy());
    }
}
