package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "trace_relation_types")
public class RelationTypeDefinition extends BaseEntity {
    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "direction_description", nullable = false, length = 300)
    private String directionDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "propagation_mode", nullable = false, length = 20)
    private PropagationMode propagationMode;

    @Column(name = "base_weight", nullable = false, precision = 5, scale = 4)
    private BigDecimal baseWeight;

    @Column(nullable = false)
    private boolean active = true;

    protected RelationTypeDefinition() {
    }

    public RelationTypeDefinition(String code, String name, String directionDescription,
                                  PropagationMode propagationMode, BigDecimal baseWeight) {
        this.code = code;
        this.name = name;
        this.directionDescription = directionDescription;
        this.propagationMode = propagationMode;
        this.baseWeight = baseWeight;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDirectionDescription() { return directionDescription; }
    public PropagationMode getPropagationMode() { return propagationMode; }
    public BigDecimal getBaseWeight() { return baseWeight; }
    public boolean isActive() { return active; }
}
