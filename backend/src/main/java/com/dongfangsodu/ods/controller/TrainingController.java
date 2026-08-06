package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.TrainingDtos.CompleteCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.CourseResponse;
import com.dongfangsodu.ods.api.TrainingDtos.CreateCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.UpdateCourseRequest;
import com.dongfangsodu.ods.domain.TrainingStatus;
import com.dongfangsodu.ods.service.TrainingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/training/courses")
public class TrainingController {
    private final TrainingService courses;

    public TrainingController(TrainingService courses) {
        this.courses = courses;
    }

    @GetMapping
    public ApiResponse<List<CourseResponse>> list(@RequestParam(required = false) TrainingStatus status) {
        return ApiResponse.of(courses.list(status));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> create(@Valid @RequestBody CreateCourseRequest request,
                                               Authentication authentication) {
        return ApiResponse.of(courses.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateCourseRequest request,
                                               Authentication authentication) {
        return ApiResponse.of(courses.update(id, request, authentication.getName(),
                canMaintainAll(authentication)));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> publish(@PathVariable UUID id, Authentication authentication) {
        return ApiResponse.of(courses.publish(id, authentication.getName(), canMaintainAll(authentication)));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> unpublish(@PathVariable UUID id, Authentication authentication) {
        return ApiResponse.of(courses.unpublish(id, authentication.getName(), canMaintainAll(authentication)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> cancel(@PathVariable UUID id, Authentication authentication) {
        return ApiResponse.of(courses.cancel(id, authentication.getName(), canMaintainAll(authentication)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('TRAINER','TRAINING_SPECIALIST','COORDINATOR','ADMIN')")
    public ApiResponse<CourseResponse> complete(@PathVariable UUID id,
                                                 @Valid @RequestBody CompleteCourseRequest request,
                                                 Authentication authentication) {
        return ApiResponse.of(courses.complete(id, request, authentication.getName(),
                canMaintainAll(authentication)));
    }

    private boolean canMaintainAll(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(authority -> authority.equals("ROLE_COORDINATOR") || authority.equals("ROLE_ADMIN"));
    }
}
