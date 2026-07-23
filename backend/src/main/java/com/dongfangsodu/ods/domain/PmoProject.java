package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pmo_projects")
public class PmoProject extends BaseEntity {
    @Column(nullable = false, unique = true, length = 80)
    private String projectCode;
    @Column(nullable = false, length = 200)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ProjectLevel level;
    @ManyToOne(fetch = FetchType.LAZY)
    private PmoProject parent;
    private String acquisitionId;
    private BigDecimal capacity;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RiskStatus riskStatus = RiskStatus.NOT_STARTED;
    @Column(columnDefinition = "TEXT")
    private String mprEscalation;
    @Column(nullable = false)
    private boolean keyProject;
    @Column(nullable = false)
    private boolean highlightProject;
    @Column(nullable = false, length = 30)
    private String source;
    private Instant deletedAt;
    @Column(length = 100)
    private String deletedBy;

    protected PmoProject() {
    }

    public PmoProject(String projectCode, String name, ProjectLevel level, PmoProject parent,
                      String acquisitionId, String source) {
        this.projectCode = projectCode;
        this.name = name;
        this.level = level;
        this.parent = parent;
        this.acquisitionId = acquisitionId;
        this.source = source;
    }

    public void update(String name, BigDecimal capacity, RiskStatus riskStatus, String mprEscalation,
                       boolean keyProject, boolean highlightProject) {
        this.name = name;
        this.capacity = capacity;
        this.riskStatus = riskStatus;
        this.mprEscalation = mprEscalation;
        this.keyProject = keyProject;
        this.highlightProject = highlightProject;
    }

    public void synchronizeName(String name) {
        this.name = name;
    }

    public void markDeleted(String username) {
        deletedAt = Instant.now();
        deletedBy = username;
    }
    public String getProjectCode() { return projectCode; }
    public String getName() { return name; }
    public ProjectLevel getLevel() { return level; }
    public PmoProject getParent() { return parent; }
    public String getAcquisitionId() { return acquisitionId; }
    public BigDecimal getCapacity() { return capacity; }
    public RiskStatus getRiskStatus() { return riskStatus; }
    public String getMprEscalation() { return mprEscalation; }
    public boolean isKeyProject() { return keyProject; }
    public boolean isHighlightProject() { return highlightProject; }
    public String getSource() { return source; }
    public Instant getDeletedAt() { return deletedAt; }
    public String getDeletedBy() { return deletedBy; }
}
