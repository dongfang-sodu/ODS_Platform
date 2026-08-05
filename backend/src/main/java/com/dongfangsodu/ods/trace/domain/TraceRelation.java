package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "trace_relations", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_relation", columnNames = {"source_version_id", "target_version_id", "relation_type_id"}))
public class TraceRelation extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_version_id", nullable = false)
    private ArtifactVersion sourceVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_version_id", nullable = false)
    private ArtifactVersion targetVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relation_type_id", nullable = false)
    private RelationTypeDefinition relationType;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "deactivated_reason", length = 500)
    private String deactivatedReason;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    protected TraceRelation() {
    }

    public TraceRelation(ArtifactVersion sourceVersion, ArtifactVersion targetVersion,
                         RelationTypeDefinition relationType, String rationale, String createdBy) {
        this.sourceVersion = sourceVersion;
        this.targetVersion = targetVersion;
        this.relationType = relationType;
        this.rationale = rationale;
        this.createdBy = createdBy;
    }

    public ArtifactVersion getSourceVersion() { return sourceVersion; }
    public ArtifactVersion getTargetVersion() { return targetVersion; }
    public RelationTypeDefinition getRelationType() { return relationType; }
    public String getRationale() { return rationale; }
    public String getCreatedBy() { return createdBy; }
    public boolean isActive() { return active; }
    public String getDeactivatedReason() { return deactivatedReason; }
    public Instant getDeactivatedAt() { return deactivatedAt; }

    public void changeActive(boolean active, String reason) {
        this.active = active;
        this.deactivatedReason = active ? null : reason;
        this.deactivatedAt = active ? null : Instant.now();
    }
}
