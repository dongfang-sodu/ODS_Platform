package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.PageResponse;
import com.dongfangsodu.ods.api.PmoDtos.CreateChildRequest;
import com.dongfangsodu.ods.api.PmoDtos.CreatePmoRequest;
import com.dongfangsodu.ods.api.PmoDtos.PmoResponse;
import com.dongfangsodu.ods.api.PmoDtos.UpdatePmoRequest;
import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.service.PmoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/pmo/projects")
@Validated
public class PmoController {
    private final PmoService projects;

    public PmoController(PmoService projects) {
        this.projects = projects;
    }

    @GetMapping
    public ApiResponse<PageResponse<PmoResponse>> list(@RequestParam(required = false) String q,
                                                        @RequestParam(required = false) ProjectLevel level,
                                                        @RequestParam(defaultValue = "0") @Min(0) int page,
                                                        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.of(projects.search(q, level, page, size));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PJM','PROJECT_MANAGER','DEPARTMENT_HEAD','EBE','EPO','LPM','ADMIN')")
    public ApiResponse<PmoResponse> create(@Valid @RequestBody CreatePmoRequest request) {
        return ApiResponse.of(projects.createL0(request));
    }

    @PostMapping("/{parentId}/children")
    @PreAuthorize("hasAnyRole('PJM','PROJECT_MANAGER','DEPARTMENT_HEAD','EBE','EPO','LPM','ADMIN')")
    public ApiResponse<PmoResponse> createChild(@PathVariable UUID parentId,
                                                 @Valid @RequestBody CreateChildRequest request) {
        return ApiResponse.of(projects.createL1(parentId, request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('PJM','PROJECT_MANAGER','DEPARTMENT_HEAD','EBE','EPO','LPM','ADMIN')")
    public ApiResponse<PmoResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdatePmoRequest request) {
        return ApiResponse.of(projects.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LPM','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Principal principal) {
        projects.softDelete(id, principal.getName());
    }
}
