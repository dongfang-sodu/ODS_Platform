package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.NodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class ContentDtos {
    private ContentDtos() {
    }

    public record VideoRequest(@NotBlank @Size(max = 250) String title,
                               @NotBlank @Size(max = 120) String category,
                               String description,
                               @NotBlank @Size(max = 500) String videoUrl,
                               @Size(max = 500) String thumbnailUrl, int sortOrder,
                               boolean published) {
    }

    public record VideoResponse(UUID id, String title, String category, String description, String videoUrl,
                                String thumbnailUrl, int sortOrder, boolean published) {
    }

    public record KnowledgeNodeResponse(UUID id, String name, NodeType nodeType, UUID parentId,
                                        String resourceUrl, String description, int sortOrder) {
    }
}
