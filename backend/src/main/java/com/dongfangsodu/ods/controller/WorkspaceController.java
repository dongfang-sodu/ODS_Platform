package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.TicketDtos.TicketResponse;
import com.dongfangsodu.ods.api.TicketDtos.UpdateTicketRequest;
import com.dongfangsodu.ods.service.TicketService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/my-tickets")
public class WorkspaceController {
    private final TicketService tickets;

    public WorkspaceController(TicketService tickets) {
        this.tickets = tickets;
    }

    @GetMapping
    public ApiResponse<List<TicketResponse>> list(Principal principal,
                                                   @RequestParam(required = false) String q) {
        return ApiResponse.of(tickets.myTickets(principal.getName(), q));
    }

    @PatchMapping("/{id}")
    public ApiResponse<TicketResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody UpdateTicketRequest request,
                                               Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        return ApiResponse.of(tickets.update(id, request, authentication.getName(), admin));
    }
}
