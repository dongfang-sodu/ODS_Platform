package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "video_guidelines")
public class VideoGuideline extends BaseEntity {
    @Column(nullable = false, length = 250)
    private String title;
    @Column(nullable = false, length = 120)
    private String category;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false, length = 500)
    private String videoUrl;
    @Column(length = 500)
    private String thumbnailUrl;
    @Column(nullable = false)
    private int sortOrder;
    @Column(nullable = false)
    private boolean published = true;

    protected VideoGuideline() {
    }

    public VideoGuideline(String title, String category, String description, String videoUrl,
                          String thumbnailUrl, int sortOrder) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.videoUrl = videoUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.sortOrder = sortOrder;
    }

    public void update(String title, String category, String description, String videoUrl,
                       String thumbnailUrl, int sortOrder, boolean published) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.videoUrl = videoUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.sortOrder = sortOrder;
        this.published = published;
    }

    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getVideoUrl() { return videoUrl; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public int getSortOrder() { return sortOrder; }
    public boolean isPublished() { return published; }
}
