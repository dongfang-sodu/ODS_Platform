package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "trace_change_records")
public class ChangeRecord extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_version_id", nullable = false)
    private ArtifactVersion sourceVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 30)
    private ChangeType changeType;

    @Column(name = "before_content", columnDefinition = "TEXT")
    private String beforeContent;

    @Column(name = "after_content", columnDefinition = "TEXT")
    private String afterContent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    protected ChangeRecord() {
    }

    public ChangeRecord(ArtifactVersion sourceVersion, ChangeType changeType, String beforeContent,
                        String afterContent, String description, String createdBy) {
        this.sourceVersion = sourceVersion;
        this.changeType = changeType;
        this.beforeContent = beforeContent;
        this.afterContent = afterContent;
        this.description = description;
        this.createdBy = createdBy;
    }

    public ArtifactVersion getSourceVersion() { return sourceVersion; }
    public ChangeType getChangeType() { return changeType; }
    public String getBeforeContent() { return beforeContent; }
    public String getAfterContent() { return afterContent; }
    public String getDescription() { return description; }
    public String getCreatedBy() { return createdBy; }
}
