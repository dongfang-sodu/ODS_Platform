package com.dongfangsodu.ods.trace.repository;

import com.dongfangsodu.ods.trace.domain.AnalysisTicketLink;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisTicketLinkRepository extends JpaRepository<AnalysisTicketLink, UUID> {
    List<AnalysisTicketLink> findByCandidateId(UUID candidateId);
}
