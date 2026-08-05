package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.ImpactCandidate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImpactCandidateRepository extends JpaRepository<ImpactCandidate, UUID> {
    List<ImpactCandidate> findByReportId(UUID reportId);
}
