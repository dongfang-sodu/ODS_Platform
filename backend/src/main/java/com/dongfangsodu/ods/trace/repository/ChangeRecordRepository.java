package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.ChangeRecord;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChangeRecordRepository extends JpaRepository<ChangeRecord, UUID> {
}
