package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(name = "trace_artifacts", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_artifact_source", columnNames = {"source_module", "source_object_type", "source_object_id"}))
public class Artifact extends BaseEntity {
    @Column(name = "source_module", nullable = false, length = 60)
    private String sourceModule;

    @Column(name = "source_object_type", nullable = false, length = 80)
    private String sourceObjectType;

    @Column(name = "source_object_id", nullable = false, length = 160)
    private String sourceObjectId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artifact_type_id", nullable = false)
    private ArtifactType type;

    @Column(name = "current_version_id")
    private UUID currentVersionId;

    @Column(nullable = false, length = 30)
    private String sourceStatus = "AVAILABLE";

    protected Artifact() {
    }

    public Artifact(String sourceModule, String sourceObjectType, String sourceObjectId, ArtifactType type) {
        this.sourceModule = sourceModule;
        this.sourceObjectType = sourceObjectType;
        this.sourceObjectId = sourceObjectId;
        this.type = type;
    }

    public String getSourceModule() { return sourceModule; }
    public String getSourceObjectType() { return sourceObjectType; }
    public String getSourceObjectId() { return sourceObjectId; }
    public ArtifactType getType() { return type; }
    public UUID getCurrentVersionId() { return currentVersionId; }
    public String getSourceStatus() { return sourceStatus; }
    public void useCurrentVersion(UUID versionId) { this.currentVersionId = versionId; }
    public void markSourceMissing() { this.sourceStatus = "SOURCE_MISSING"; }
}
