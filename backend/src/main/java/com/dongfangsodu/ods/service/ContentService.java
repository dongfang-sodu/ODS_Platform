package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.ContentDtos.KnowledgeNodeResponse;
import com.dongfangsodu.ods.api.ContentDtos.VideoRequest;
import com.dongfangsodu.ods.api.ContentDtos.VideoResponse;
import com.dongfangsodu.ods.domain.KnowledgeNode;
import com.dongfangsodu.ods.domain.VideoGuideline;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.KnowledgeNodeRepository;
import com.dongfangsodu.ods.repository.VideoGuidelineRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {
    private final VideoGuidelineRepository videos;
    private final KnowledgeNodeRepository knowledgeNodes;

    public ContentService(VideoGuidelineRepository videos, KnowledgeNodeRepository knowledgeNodes) {
        this.videos = videos;
        this.knowledgeNodes = knowledgeNodes;
    }

    @Transactional(readOnly = true)
    public List<VideoResponse> videos() {
        return videos.findByPublishedTrueOrderByCategoryAscSortOrderAsc().stream().map(this::toVideo).toList();
    }

    @Transactional
    public VideoResponse createVideo(VideoRequest request) {
        VideoGuideline video = new VideoGuideline(request.title(), request.category(), request.description(),
                request.videoUrl(), request.thumbnailUrl(), request.sortOrder());
        video.update(request.title(), request.category(), request.description(), request.videoUrl(),
                request.thumbnailUrl(), request.sortOrder(), request.published());
        return toVideo(videos.save(video));
    }

    @Transactional
    public VideoResponse updateVideo(UUID id, VideoRequest request) {
        VideoGuideline video = videos.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("视频指南不存在"));
        video.update(request.title(), request.category(), request.description(), request.videoUrl(),
                request.thumbnailUrl(), request.sortOrder(), request.published());
        return toVideo(video);
    }

    @Transactional(readOnly = true)
    public List<KnowledgeNodeResponse> knowledgeTree() {
        return knowledgeNodes.findAll().stream().map(this::toNode).toList();
    }

    private VideoResponse toVideo(VideoGuideline video) {
        return new VideoResponse(video.getId(), video.getTitle(), video.getCategory(), video.getDescription(),
                video.getVideoUrl(), video.getThumbnailUrl(), video.getSortOrder(), video.isPublished());
    }

    private KnowledgeNodeResponse toNode(KnowledgeNode node) {
        UUID parentId = node.getParent() == null ? null : node.getParent().getId();
        return new KnowledgeNodeResponse(node.getId(), node.getName(), node.getNodeType(), parentId,
                node.getResourceUrl(), node.getDescription(), node.getSortOrder());
    }
}
