package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "tickets")
public class Ticket extends BaseEntity {
    @Column(nullable = false, unique = true, length = 120)
    private String externalKey;
    @Column(nullable = false, length = 300)
    private String summary;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status = TicketStatus.TODO;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority = TicketPriority.MEDIUM;
    @Column(nullable = false, length = 150)
    private String assignee;
    @Column(length = 80)
    private String projectKey;
    private LocalDate dueDate;
    @Column(length = 500)
    private String externalUrl;
    @Column(nullable = false, length = 40)
    private String source = "LOCAL";

    protected Ticket() {
    }

    public Ticket(String externalKey, String summary, String assignee, String projectKey,
                  TicketPriority priority, LocalDate dueDate) {
        this.externalKey = externalKey;
        this.summary = summary;
        this.assignee = assignee;
        this.projectKey = projectKey;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    public void changePriority(TicketPriority priority) { this.priority = priority; }
    public void changeStatus(TicketStatus status) { this.status = status; }
    public String getExternalKey() { return externalKey; }
    public String getSummary() { return summary; }
    public String getDescription() { return description; }
    public TicketStatus getStatus() { return status; }
    public TicketPriority getPriority() { return priority; }
    public String getAssignee() { return assignee; }
    public String getProjectKey() { return projectKey; }
    public LocalDate getDueDate() { return dueDate; }
    public String getExternalUrl() { return externalUrl; }
    public String getSource() { return source; }
}
