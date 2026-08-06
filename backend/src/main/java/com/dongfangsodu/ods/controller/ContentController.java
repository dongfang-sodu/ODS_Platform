package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.ContentDtos.KnowledgeNodeResponse;
import com.dongfangsodu.ods.api.ContentDtos.VideoRequest;
import com.dongfangsodu.ods.api.ContentDtos.VideoResponse;
import com.dongfangsodu.ods.service.ContentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ContentController {
    private final ContentService content;

    public ContentController(ContentService content) {
        this.content = content;
    }

    @GetMapping("/video-guidelines")
    public ApiResponse<List<VideoResponse>> videos() {
        return ApiResponse.of(content.videos());
    }

    @PostMapping("/video-guidelines")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINING_SPECIALIST','MARKET_SPECIALIST')")
    public ApiResponse<VideoResponse> createVideo(@Valid @RequestBody VideoRequest request) {
        return ApiResponse.of(content.createVideo(request));
    }

    @PutMapping("/video-guidelines/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINING_SPECIALIST','MARKET_SPECIALIST')")
    public ApiResponse<VideoResponse> updateVideo(@PathVariable UUID id,
                                                   @Valid @RequestBody VideoRequest request) {
        return ApiResponse.of(content.updateVideo(id, request));
    }

    @GetMapping("/knowledge/tree")
    public ApiResponse<List<KnowledgeNodeResponse>> knowledgeTree() {
        return ApiResponse.of(content.knowledgeTree());
    }
}
