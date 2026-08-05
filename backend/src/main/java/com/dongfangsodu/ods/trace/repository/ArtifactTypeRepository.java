package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.ArtifactType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtifactTypeRepository extends JpaRepository<ArtifactType, UUID> {
    Optional<ArtifactType> findByCodeIgnoreCase(String code);
}
