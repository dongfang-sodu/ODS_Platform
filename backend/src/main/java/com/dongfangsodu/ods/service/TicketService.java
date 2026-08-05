package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.TicketDtos.TicketResponse;
import com.dongfangsodu.ods.api.TicketDtos.UpdateTicketRequest;
import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.TicketRepository;
import com.dongfangsodu.ods.trace.service.TicketCreationPort;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TicketService implements TicketCreationPort {
    private static final Comparator<Ticket> BUSINESS_PRIORITY_ORDER = Comparator
            .comparingInt((Ticket ticket) -> priorityRank(ticket.getPriority()))
            .thenComparing(Ticket::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()));

    private final TicketRepository tickets;

    public TicketService(TicketRepository tickets) {
        this.tickets = tickets;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> myTickets(String username, String q) {
        List<Ticket> result = StringUtils.hasText(q)
                ? tickets.findByAssigneeIgnoreCaseAndSummaryContainingIgnoreCase(username, q)
                : tickets.findByAssigneeIgnoreCase(username);
        return result.stream().sorted(BUSINESS_PRIORITY_ORDER).map(this::toResponse).toList();
    }

    @Transactional
    public TicketResponse update(UUID id, UpdateTicketRequest request, String username, boolean admin) {
        Ticket ticket = tickets.findById(id).orElseThrow(() -> new ResourceNotFoundException("工单不存在"));
        if (!admin && !ticket.getAssignee().equalsIgnoreCase(username)) {
            throw new ResourceNotFoundException("工单不存在");
        }
        ticket.changePriority(request.priority());
        if (request.status() != null) {
            ticket.changeStatus(request.status());
        }
        return toResponse(ticket);
    }

    @Override
    @Transactional
    public Ticket createImpactTicket(String summary, String description, String assignee,
                                     TicketPriority priority, LocalDate dueDate) {
        String externalKey = "ODS-IMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return tickets.save(new Ticket(externalKey, summary, description, assignee, "TRACE",
                priority, dueDate, "TRACE_IMPACT"));
    }

    private TicketResponse toResponse(Ticket ticket) {
        return new TicketResponse(ticket.getId(), ticket.getExternalKey(), ticket.getSummary(), ticket.getDescription(),
                ticket.getStatus(), ticket.getPriority(), ticket.getAssignee(), ticket.getProjectKey(),
                ticket.getDueDate(), ticket.getExternalUrl(), ticket.getSource());
    }

    private static int priorityRank(TicketPriority priority) {
        return switch (priority) {
            case CRITICAL -> 0;
            case HIGH -> 1;
            case MEDIUM -> 2;
            case LOW -> 3;
        };
    }
}
