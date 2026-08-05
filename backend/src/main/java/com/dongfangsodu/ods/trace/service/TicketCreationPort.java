package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TicketPriority;
import java.time.LocalDate;

public interface TicketCreationPort {
    Ticket createImpactTicket(String summary, String description, String assignee,
                              TicketPriority priority, LocalDate dueDate);
}
