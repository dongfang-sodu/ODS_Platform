package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.Ticket;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByAssigneeIgnoreCase(String assignee);
    List<Ticket> findByAssigneeIgnoreCaseAndSummaryContainingIgnoreCase(String assignee, String summary);
}
