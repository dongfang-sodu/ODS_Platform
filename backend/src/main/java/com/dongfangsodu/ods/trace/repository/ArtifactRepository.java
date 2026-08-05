package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.Artifact;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {
    Optional<Artifact> findBySourceModuleIgnoreCaseAndSourceObjectTypeIgnoreCaseAndSourceObjectId(
            String sourceModule, String sourceObjectType, String sourceObjectId);
}
