package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "trace_operation_logs")
public class OperationLog extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String actor;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "object_type", nullable = false, length = 60)
    private String objectType;

    @Column(name = "object_id", nullable = false, length = 80)
    private String objectId;

    @Column(name = "result_code", nullable = false, length = 40)
    private String resultCode;

    @Column(length = 500)
    private String summary;

    protected OperationLog() {
    }

    public OperationLog(String actor, String action, String objectType, String objectId,
                        String resultCode, String summary) {
        this.actor = actor;
        this.action = action;
        this.objectType = objectType;
        this.objectId = objectId;
        this.resultCode = resultCode;
        this.summary = summary;
    }

    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getObjectType() { return objectType; }
    public String getObjectId() { return objectId; }
    public String getResultCode() { return resultCode; }
    public String getSummary() { return summary; }
}
