package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.RelationTypeRule;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelationTypeRuleRepository extends JpaRepository<RelationTypeRule, UUID> {
    long countByRelationTypeId(UUID relationTypeId);
    boolean existsByRelationTypeIdAndSourceTypeIdAndTargetTypeId(
            UUID relationTypeId, UUID sourceTypeId, UUID targetTypeId);
}
