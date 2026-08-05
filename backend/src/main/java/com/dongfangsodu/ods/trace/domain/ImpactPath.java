package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trace_impact_paths", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_candidate_path_rank", columnNames = {"candidate_id", "path_rank"}))
public class ImpactPath extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private ImpactCandidate candidate;

    @Column(name = "path_rank", nullable = false)
    private int pathRank;

    @Column(name = "total_score", nullable = false, precision = 7, scale = 3)
    private BigDecimal totalScore;

    @Column(nullable = false)
    private int length;

    @Column(nullable = false)
    private boolean primaryPath;

    @OneToMany(mappedBy = "path", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNo ASC")
    private List<ImpactPathStep> steps = new ArrayList<>();

    protected ImpactPath() {
    }

    public ImpactPath(ImpactCandidate candidate, int pathRank, BigDecimal totalScore,
                      int length, boolean primaryPath) {
        this.candidate = candidate;
        this.pathRank = pathRank;
        this.totalScore = totalScore;
        this.length = length;
        this.primaryPath = primaryPath;
    }

    public int getPathRank() { return pathRank; }
    public BigDecimal getTotalScore() { return totalScore; }
    public int getLength() { return length; }
    public boolean isPrimaryPath() { return primaryPath; }
    public List<ImpactPathStep> getSteps() { return List.copyOf(steps); }
    public void addStep(ImpactPathStep step) { steps.add(step); }
}
