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
@Table(name = "trace_artifact_versions", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_artifact_version", columnNames = {"artifact_id", "version_label"}))
public class ArtifactVersion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artifact_id", nullable = false)
    private Artifact artifact;

    @Column(name = "version_label", nullable = false, length = 80)
    private String versionLabel;

    @Column(name = "display_name", nullable = false, length = 240)
    private String displayName;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(length = 150)
    private String owner;

    @Column(name = "content_summary", columnDefinition = "TEXT")
    private String contentSummary;

    @Column(name = "content_fingerprint", length = 128)
    private String contentFingerprint;

    @Column(name = "source_updated_at")
    private Instant sourceUpdatedAt;

    protected ArtifactVersion() {
    }

    public ArtifactVersion(Artifact artifact, String versionLabel, String displayName, String status,
                           String owner, String contentSummary, String contentFingerprint,
                           Instant sourceUpdatedAt) {
        this.artifact = artifact;
        this.versionLabel = versionLabel;
        this.displayName = displayName;
        this.status = status;
        this.owner = owner;
        this.contentSummary = contentSummary;
        this.contentFingerprint = contentFingerprint;
        this.sourceUpdatedAt = sourceUpdatedAt;
    }

    public Artifact getArtifact() { return artifact; }
    public String getVersionLabel() { return versionLabel; }
    public String getDisplayName() { return displayName; }
    public String getStatus() { return status; }
    public String getOwner() { return owner; }
    public String getContentSummary() { return contentSummary; }
    public String getContentFingerprint() { return contentFingerprint; }
    public Instant getSourceUpdatedAt() { return sourceUpdatedAt; }
}
