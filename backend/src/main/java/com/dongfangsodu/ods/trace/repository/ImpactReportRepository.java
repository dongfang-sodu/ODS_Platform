package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.ImpactReport;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImpactReportRepository extends JpaRepository<ImpactReport, UUID> {
    List<ImpactReport> findAllByOrderByCreatedAtDesc();
}
