package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "trace_relation_type_rules", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_relation_rule", columnNames = {"relation_type_id", "source_type_id", "target_type_id"}))
public class RelationTypeRule extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relation_type_id", nullable = false)
    private RelationTypeDefinition relationType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_type_id", nullable = false)
    private ArtifactType sourceType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_type_id", nullable = false)
    private ArtifactType targetType;

    protected RelationTypeRule() {
    }

    public RelationTypeRule(RelationTypeDefinition relationType, ArtifactType sourceType, ArtifactType targetType) {
        this.relationType = relationType;
        this.sourceType = sourceType;
        this.targetType = targetType;
    }

    public RelationTypeDefinition getRelationType() { return relationType; }
    public ArtifactType getSourceType() { return sourceType; }
    public ArtifactType getTargetType() { return targetType; }
}
