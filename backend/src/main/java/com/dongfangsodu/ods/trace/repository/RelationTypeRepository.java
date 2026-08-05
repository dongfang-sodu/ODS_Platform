package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.RelationTypeDefinition;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelationTypeRepository extends JpaRepository<RelationTypeDefinition, UUID> {
    Optional<RelationTypeDefinition> findByCodeIgnoreCase(String code);
}
