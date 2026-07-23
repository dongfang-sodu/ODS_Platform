package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.AcquisitionProject;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcquisitionProjectRepository extends JpaRepository<AcquisitionProject, UUID> {
    Optional<AcquisitionProject> findByProject_Id(UUID projectId);
}
