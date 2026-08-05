package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.trace.api.TraceDtos.OperationLogResponse;
import com.dongfangsodu.ods.trace.domain.OperationLog;
import com.dongfangsodu.ods.trace.repository.OperationLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationLogService {
    private final OperationLogRepository logs;

    public OperationLogService(OperationLogRepository logs) {
        this.logs = logs;
    }

    public void success(String actor, String action, String objectType, Object objectId, String summary) {
        logs.save(new OperationLog(actor, action, objectType, String.valueOf(objectId), "SUCCESS", summary));
    }

    @Transactional(readOnly = true)
    public List<OperationLogResponse> recent() {
        return logs.findTop200ByOrderByCreatedAtDesc().stream().map(log -> new OperationLogResponse(
                log.getId(), log.getActor(), log.getAction(), log.getObjectType(), log.getObjectId(),
                log.getResultCode(), log.getSummary(), log.getCreatedAt())).toList();
    }
}
