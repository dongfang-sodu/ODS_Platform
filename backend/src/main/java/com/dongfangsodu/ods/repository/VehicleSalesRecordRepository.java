package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.VehicleSalesRecord;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleSalesRecordRepository extends JpaRepository<VehicleSalesRecord, UUID> {
    List<VehicleSalesRecord> findByReportYearAndReportMonth(int reportYear, int reportMonth);
    List<VehicleSalesRecord> findByReportYear(int reportYear);
}
