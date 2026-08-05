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
import jakarta.persistence.Version;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trace_impact_reports")
public class ImpactReport extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "change_record_id", nullable = false)
    private ChangeRecord changeRecord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ImpactReportStatus status = ImpactReportStatus.GENERATED;

    @Column(name = "max_depth", nullable = false)
    private int maxDepth;

    @Column(name = "max_nodes", nullable = false)
    private int maxNodes;

    @Column(name = "scoring_rule_version", nullable = false, length = 30)
    private String scoringRuleVersion = "RULE_V1";

    @Column(name = "candidate_count", nullable = false)
    private int candidateCount;

    @Column(name = "truncated_by_depth", nullable = false)
    private boolean truncatedByDepth;

    @Column(name = "truncated_by_node_limit", nullable = false)
    private boolean truncatedByNodeLimit;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Version
    @Column(nullable = false)
    private long version;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("initialScore DESC")
    private List<ImpactCandidate> candidates = new ArrayList<>();

    protected ImpactReport() {
    }

    public ImpactReport(ChangeRecord changeRecord, int maxDepth, int maxNodes, String createdBy) {
        this.changeRecord = changeRecord;
        this.maxDepth = maxDepth;
        this.maxNodes = maxNodes;
        this.createdBy = createdBy;
    }

    public ChangeRecord getChangeRecord() { return changeRecord; }
    public ImpactReportStatus getStatus() { return status; }
    public int getMaxDepth() { return maxDepth; }
    public int getMaxNodes() { return maxNodes; }
    public String getScoringRuleVersion() { return scoringRuleVersion; }
    public int getCandidateCount() { return candidateCount; }
    public boolean isTruncatedByDepth() { return truncatedByDepth; }
    public boolean isTruncatedByNodeLimit() { return truncatedByNodeLimit; }
    public String getCreatedBy() { return createdBy; }
    public long getVersion() { return version; }
    public List<ImpactCandidate> getCandidates() { return List.copyOf(candidates); }

    public void addCandidate(ImpactCandidate candidate) {
        candidates.add(candidate);
        candidateCount = candidates.size();
    }

    public void markTruncated(boolean byDepth, boolean byNodeLimit) {
        this.truncatedByDepth = byDepth;
        this.truncatedByNodeLimit = byNodeLimit;
    }

    public void beginReview() { this.status = ImpactReportStatus.UNDER_REVIEW; }
    public void markReviewed() { this.status = ImpactReportStatus.REVIEWED; }
    public void markTicketsCreated() { this.status = ImpactReportStatus.TICKETS_CREATED; }
}
