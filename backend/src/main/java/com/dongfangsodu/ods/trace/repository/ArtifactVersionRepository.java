package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtifactVersionRepository extends JpaRepository<ArtifactVersion, UUID> {
    List<ArtifactVersion> findByArtifactIdOrderByCreatedAtDesc(UUID artifactId);
    Optional<ArtifactVersion> findByArtifactIdAndVersionLabelIgnoreCase(UUID artifactId, String versionLabel);
}
