package com.dongfangsodu.ods.trace.domain;

import com.dongfangsodu.ods.domain.BaseEntity;
import com.dongfangsodu.ods.domain.Ticket;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "trace_analysis_ticket_links", uniqueConstraints = @UniqueConstraint(
        name = "uk_trace_candidate_ticket", columnNames = {"candidate_id", "ticket_id"}))
public class AnalysisTicketLink extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private ImpactCandidate candidate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    protected AnalysisTicketLink() {
    }

    public AnalysisTicketLink(ImpactCandidate candidate, Ticket ticket) {
        this.candidate = candidate;
        this.ticket = ticket;
    }

    public ImpactCandidate getCandidate() { return candidate; }
    public Ticket getTicket() { return ticket; }
}
