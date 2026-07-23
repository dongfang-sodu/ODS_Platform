package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.PageResponse;
import com.dongfangsodu.ods.api.ProjectDtos.AcquisitionStatusResponse;
import com.dongfangsodu.ods.api.ProjectDtos.CreateProjectRequest;
import com.dongfangsodu.ods.api.ProjectDtos.ProjectResponse;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateAcquisitionStatusRequest;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateProjectRequest;
import com.dongfangsodu.ods.domain.ProjectStatus;
import com.dongfangsodu.ods.service.ProjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/projects")
@Validated
public class ProjectController {
    private final ProjectService projects;

    public ProjectController(ProjectService projects) {
        this.projects = projects;
    }

    @GetMapping
    public ApiResponse<PageResponse<ProjectResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String owner,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.of(projects.search(q, status, owner, page, size));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TPJM','ADMIN')")
    public ApiResponse<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest request, Principal principal) {
        return ApiResponse.of(projects.create(request, principal.getName()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> find(@PathVariable UUID id) {
        return ApiResponse.of(projects.find(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TPJM','PJM','LPM','ADMIN')")
    public ApiResponse<ProjectResponse> update(@PathVariable UUID id,
                                                @Valid @RequestBody UpdateProjectRequest request) {
        return ApiResponse.of(projects.update(id, request));
    }

    @GetMapping("/{id}/acquisition-status")
    public ApiResponse<AcquisitionStatusResponse> acquisitionStatus(@PathVariable UUID id) {
        return ApiResponse.of(projects.acquisitionStatus(id));
    }

    @PatchMapping("/{id}/acquisition-status")
    @PreAuthorize("hasAnyRole('PCB','SCP','ADMIN')")
    public ApiResponse<AcquisitionStatusResponse> updateAcquisitionStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateAcquisitionStatusRequest request) {
        return ApiResponse.of(projects.updateAcquisitionStatus(id, request));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String owner) {
        java.util.List<ProjectResponse> result = projects.export(q, status, owner);
        StringBuilder csv = new StringBuilder("\uFEFFcode,name,product,owner,status,qg4,milestone\n");
        result.forEach(project -> csv.append(value(project.code())).append(',')
                .append(value(project.name())).append(',').append(value(project.product())).append(',')
                .append(value(project.owner())).append(',').append(project.status()).append(',')
                .append(value(project.qg4Reference())).append(',')
                .append(project.milestoneDate() == null ? "" : project.milestoneDate()).append('\n'));
        byte[] body = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }

    private String value(String value) {
        String safe = value == null ? "" : value;
        if (!safe.isEmpty() && "=+-@".indexOf(safe.charAt(0)) >= 0) {
            safe = "'" + safe;
        }
        return '"' + safe.replace("\"", "\"\"") + '"';
    }
}
