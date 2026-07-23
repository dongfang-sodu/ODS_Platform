package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {
    @Column(nullable = false, unique = true, length = 80)
    private String code;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false, length = 150)
    private String product;
    @Column(nullable = false, length = 150)
    private String owner;
    @Column(nullable = false, length = 200)
    private String team;
    @Column(nullable = false, length = 120)
    private String qg4Reference;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectStatus status = ProjectStatus.DRAFT;
    private LocalDate milestoneDate;
    @Column(nullable = false, length = 30)
    private String source = "M1";
    @Column(nullable = false)
    private boolean immutable = true;
    @Column(nullable = false, unique = true, length = 500)
    private String dedupeKey;
    @Column(nullable = false, length = 100)
    private String createdBy;

    protected Project() {
    }

    public Project(String code, String name, String description, String product, String owner, String team,
                   String qg4Reference, LocalDate milestoneDate, String dedupeKey, String createdBy) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.product = product;
        this.owner = owner;
        this.team = team;
        this.qg4Reference = qg4Reference;
        this.milestoneDate = milestoneDate;
        this.dedupeKey = dedupeKey;
        this.createdBy = createdBy;
    }

    public void update(String name, String description, String product, String owner, String team,
                       LocalDate milestoneDate, ProjectStatus status, String dedupeKey) {
        this.name = name;
        this.description = description;
        this.product = product;
        this.owner = owner;
        this.team = team;
        this.milestoneDate = milestoneDate;
        this.status = status;
        this.dedupeKey = dedupeKey;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getProduct() { return product; }
    public String getOwner() { return owner; }
    public String getTeam() { return team; }
    public String getQg4Reference() { return qg4Reference; }
    public ProjectStatus getStatus() { return status; }
    public LocalDate getMilestoneDate() { return milestoneDate; }
    public String getSource() { return source; }
    public boolean isImmutable() { return immutable; }
    public String getDedupeKey() { return dedupeKey; }
    public String getCreatedBy() { return createdBy; }
}
