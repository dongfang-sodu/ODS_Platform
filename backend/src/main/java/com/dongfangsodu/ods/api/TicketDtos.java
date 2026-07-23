package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.domain.TicketStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public final class TicketDtos {
    private TicketDtos() {
    }

    public record UpdateTicketRequest(@NotNull TicketPriority priority, TicketStatus status) {
    }

    public record TicketResponse(UUID id, String externalKey, String summary, String description,
                                 TicketStatus status, TicketPriority priority, String assignee,
                                 String projectKey, LocalDate dueDate, String externalUrl, String source) {
    }
}
