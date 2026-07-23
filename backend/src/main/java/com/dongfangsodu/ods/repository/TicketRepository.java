package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.Ticket;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByAssigneeIgnoreCaseOrderByPriorityDescDueDateAsc(String assignee);
    List<Ticket> findByAssigneeIgnoreCaseAndSummaryContainingIgnoreCaseOrderByPriorityDescDueDateAsc(String assignee, String summary);
}
