package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trace_impact_candidates", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_candidate_target", columnNames = {"report_id", "target_version_id"}))
public class ImpactCandidate extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private ImpactReport report;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_version_id", nullable = false)
    private ArtifactVersion targetVersion;

    @Column(name = "initial_score", nullable = false, precision = 7, scale = 3)
    private BigDecimal initialScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "initial_level", nullable = false, length = 20)
    private ImpactLevel initialLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Column(name = "review_comment", length = 1000)
    private String reviewComment;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pathRank ASC")
    private List<ImpactPath> paths = new ArrayList<>();

    protected ImpactCandidate() {
    }

    public ImpactCandidate(ImpactReport report, ArtifactVersion targetVersion,
                           BigDecimal initialScore, ImpactLevel initialLevel) {
        this.report = report;
        this.targetVersion = targetVersion;
        this.initialScore = initialScore;
        this.initialLevel = initialLevel;
    }

    public ImpactReport getReport() { return report; }
    public ArtifactVersion getTargetVersion() { return targetVersion; }
    public BigDecimal getInitialScore() { return initialScore; }
    public ImpactLevel getInitialLevel() { return initialLevel; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public String getReviewComment() { return reviewComment; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public List<ImpactPath> getPaths() { return List.copyOf(paths); }

    public void addPath(ImpactPath path) { paths.add(path); }

    public void review(ReviewStatus status, String comment, String reviewer) {
        this.reviewStatus = status;
        this.reviewComment = comment;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
    }
}
