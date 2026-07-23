package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "acquisition_projects")
public class AcquisitionProject extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    private Project project;
    @Column(nullable = false, length = 80)
    private String offlineStatus = "Not started";
    @Column(nullable = false, length = 80)
    private String committeeStatus = "Not started";
    @Column(nullable = false, length = 80)
    private String salesforceStatus = "Not started";
    @Column(nullable = false, length = 120)
    private String ownerDepartment;
    private Instant lastSyncedAt;

    protected AcquisitionProject() {
    }

    public AcquisitionProject(Project project, String ownerDepartment) {
        this.project = project;
        this.ownerDepartment = ownerDepartment;
    }

    public void updateStatuses(String offlineStatus, String committeeStatus, String salesforceStatus) {
        this.offlineStatus = offlineStatus;
        this.committeeStatus = committeeStatus;
        this.salesforceStatus = salesforceStatus;
    }

    public void markSynced() { this.lastSyncedAt = Instant.now(); }
    public Project getProject() { return project; }
    public String getOfflineStatus() { return offlineStatus; }
    public String getCommitteeStatus() { return committeeStatus; }
    public String getSalesforceStatus() { return salesforceStatus; }
    public String getOwnerDepartment() { return ownerDepartment; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
}
