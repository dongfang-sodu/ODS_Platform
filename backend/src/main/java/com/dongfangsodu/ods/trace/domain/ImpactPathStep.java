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
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;

@Entity
@Table(name = "trace_impact_path_steps", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_path_step_sequence", columnNames = {"path_id", "sequence_no"}))
public class ImpactPathStep extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "path_id", nullable = false)
    private ImpactPath path;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relation_id", nullable = false)
    private TraceRelation relation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_version_id", nullable = false)
    private ArtifactVersion sourceVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_version_id", nullable = false)
    private ArtifactVersion targetVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "traversal_direction", nullable = false, length = 20)
    private TraversalDirection traversalDirection;

    @Column(name = "relation_weight", nullable = false, precision = 5, scale = 4)
    private BigDecimal relationWeight;

    @Column(name = "step_score", nullable = false, precision = 7, scale = 4)
    private BigDecimal stepScore;

    protected ImpactPathStep() {
    }

    public ImpactPathStep(ImpactPath path, int sequenceNo, TraceRelation relation,
                          ArtifactVersion sourceVersion, ArtifactVersion targetVersion,
                          TraversalDirection traversalDirection, BigDecimal relationWeight,
                          BigDecimal stepScore) {
        this.path = path;
        this.sequenceNo = sequenceNo;
        this.relation = relation;
        this.sourceVersion = sourceVersion;
        this.targetVersion = targetVersion;
        this.traversalDirection = traversalDirection;
        this.relationWeight = relationWeight;
        this.stepScore = stepScore;
    }

    public int getSequenceNo() { return sequenceNo; }
    public TraceRelation getRelation() { return relation; }
    public ArtifactVersion getSourceVersion() { return sourceVersion; }
    public ArtifactVersion getTargetVersion() { return targetVersion; }
    public TraversalDirection getTraversalDirection() { return traversalDirection; }
    public BigDecimal getRelationWeight() { return relationWeight; }
    public BigDecimal getStepScore() { return stepScore; }
}
