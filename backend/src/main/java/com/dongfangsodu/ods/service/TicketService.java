package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.TicketDtos.TicketResponse;
import com.dongfangsodu.ods.api.TicketDtos.UpdateTicketRequest;
import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.TicketRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TicketService {
    private final TicketRepository tickets;

    public TicketService(TicketRepository tickets) {
        this.tickets = tickets;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> myTickets(String username, String q) {
        List<Ticket> result = StringUtils.hasText(q)
                ? tickets.findByAssigneeIgnoreCaseAndSummaryContainingIgnoreCaseOrderByPriorityDescDueDateAsc(username, q)
                : tickets.findByAssigneeIgnoreCaseOrderByPriorityDescDueDateAsc(username);
        return result.stream().map(this::toResponse).toList();
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

    private TicketResponse toResponse(Ticket ticket) {
        return new TicketResponse(ticket.getId(), ticket.getExternalKey(), ticket.getSummary(), ticket.getDescription(),
                ticket.getStatus(), ticket.getPriority(), ticket.getAssignee(), ticket.getProjectKey(),
                ticket.getDueDate(), ticket.getExternalUrl(), ticket.getSource());
    }
}
