package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "training_courses")
public class TrainingCourse extends BaseEntity {
    @Column(nullable = false, length = 250)
    private String topic;
    @Column(nullable = false)
    private Instant startAt;
    @Column(nullable = false)
    private Instant endAt;
    @Column(length = 150)
    private String trainer;
    @Column(nullable = false, length = 150)
    private String coordinator;
    @Column(nullable = false, updatable = false, length = 100)
    private String ownerUsername;
    @Column(columnDefinition = "TEXT")
    private String trainee;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    private TrainingStatus status = TrainingStatus.DRAFT;
    private BigDecimal participationRate;
    @Column(nullable = false, length = 150)
    private String trainingDept;
    @Column(length = 500)
    private String materialLocation;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String advancedEmail;
    @Column(nullable = false)
    private boolean materialUploaded;

    protected TrainingCourse() {
    }

    public TrainingCourse(String topic, Instant startAt, Instant endAt, String trainer, String coordinator,
                          String trainee, String trainingDept, String materialLocation, String description,
                          String ownerUsername) {
        this.topic = topic;
        this.startAt = startAt;
        this.endAt = endAt;
        this.trainer = trainer;
        this.coordinator = coordinator;
        this.ownerUsername = ownerUsername;
        this.trainee = trainee;
        this.trainingDept = trainingDept;
        this.materialLocation = materialLocation;
        this.description = description;
    }

    public void update(String topic, Instant startAt, Instant endAt, String trainer, String trainee,
                       String trainingDept, String materialLocation, String description, String advancedEmail) {
        this.topic = topic;
        this.startAt = startAt;
        this.endAt = endAt;
        this.trainer = trainer;
        this.trainee = trainee;
        this.trainingDept = trainingDept;
        this.materialLocation = materialLocation;
        this.description = description;
        this.advancedEmail = advancedEmail;
    }

    public void publish() { status = TrainingStatus.PUBLISHED; }
    public void unpublish() { status = TrainingStatus.DRAFT; }
    public void cancel() { status = TrainingStatus.CANCELLED; }
    public void complete(boolean materialUploaded, BigDecimal participationRate) {
        status = TrainingStatus.COMPLETED;
        this.materialUploaded = materialUploaded;
        this.participationRate = participationRate;
    }

    public String getTopic() { return topic; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public String getTrainer() { return trainer; }
    public String getCoordinator() { return coordinator; }
    public String getOwnerUsername() { return ownerUsername; }
    public String getTrainee() { return trainee; }
    public TrainingStatus getStatus() { return status; }
    public BigDecimal getParticipationRate() { return participationRate; }
    public String getTrainingDept() { return trainingDept; }
    public String getMaterialLocation() { return materialLocation; }
    public String getDescription() { return description; }
    public String getAdvancedEmail() { return advancedEmail; }
    public boolean isMaterialUploaded() { return materialUploaded; }
}
