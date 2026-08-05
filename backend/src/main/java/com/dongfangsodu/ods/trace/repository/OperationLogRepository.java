package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.OperationLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationLogRepository extends JpaRepository<OperationLog, UUID> {
    List<OperationLog> findTop200ByOrderByCreatedAtDesc();
}
