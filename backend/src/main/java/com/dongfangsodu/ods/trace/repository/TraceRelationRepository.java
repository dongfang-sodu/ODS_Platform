package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.TraceRelation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraceRelationRepository extends JpaRepository<TraceRelation, UUID> {
    List<TraceRelation> findByActiveTrue();
    List<TraceRelation> findAllByOrderByCreatedAtDesc();
    Optional<TraceRelation> findBySourceVersionIdAndTargetVersionIdAndRelationTypeId(
            UUID sourceVersionId, UUID targetVersionId, UUID relationTypeId);
}
