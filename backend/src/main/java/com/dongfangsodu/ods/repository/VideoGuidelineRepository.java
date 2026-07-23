package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.VideoGuideline;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoGuidelineRepository extends JpaRepository<VideoGuideline, UUID> {
    List<VideoGuideline> findByPublishedTrueOrderByCategoryAscSortOrderAsc();
}
