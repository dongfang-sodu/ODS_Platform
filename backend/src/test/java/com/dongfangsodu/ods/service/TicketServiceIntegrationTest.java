package com.dongfangsodu.ods.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.repository.TicketRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TicketServiceIntegrationTest {
    @Autowired
    private TicketService service;
    @Autowired
    private TicketRepository tickets;

    @Test
    void ticketsUseBusinessPriorityThenDueDateOrder() {
        String assignee = "ticket-order-user";
        tickets.save(new Ticket("ORDER-LOW", "Low", assignee, "ODS", TicketPriority.LOW,
                LocalDate.of(2026, 7, 20)));
        tickets.save(new Ticket("ORDER-HIGH-LATE", "High late", assignee, "ODS", TicketPriority.HIGH,
                LocalDate.of(2026, 7, 28)));
        tickets.save(new Ticket("ORDER-CRITICAL", "Critical", assignee, "ODS", TicketPriority.CRITICAL,
                null));
        tickets.save(new Ticket("ORDER-HIGH-EARLY", "High early", assignee, "ODS", TicketPriority.HIGH,
                LocalDate.of(2026, 7, 24)));

        assertThat(service.myTickets(assignee, null))
                .extracting(response -> response.externalKey())
                .containsExactly("ORDER-CRITICAL", "ORDER-HIGH-EARLY", "ORDER-HIGH-LATE", "ORDER-LOW");
    }
}
