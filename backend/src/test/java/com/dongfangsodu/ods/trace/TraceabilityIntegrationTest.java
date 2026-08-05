package com.dongfangsodu.ods.trace;

import static org.assertj.core.api.Assertions.assertThat;

import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.repository.TicketRepository;
import com.dongfangsodu.ods.trace.api.TraceDtos.AnalyzeChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CandidateReviewItem;
import com.dongfangsodu.ods.trace.api.TraceDtos.ConfirmTicketsRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactReportResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ReviewCandidatesRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceQueryRequest;
import com.dongfangsodu.ods.trace.domain.Artifact;
import com.dongfangsodu.ods.trace.domain.ArtifactType;
import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import com.dongfangsodu.ods.trace.domain.ChangeType;
import com.dongfangsodu.ods.trace.domain.PropagationMode;
import com.dongfangsodu.ods.trace.domain.RelationTypeDefinition;
import com.dongfangsodu.ods.trace.domain.ReviewStatus;
import com.dongfangsodu.ods.trace.domain.TraceDirection;
import com.dongfangsodu.ods.trace.domain.TraceRelation;
import com.dongfangsodu.ods.trace.repository.AnalysisTicketLinkRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactTypeRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactVersionRepository;
import com.dongfangsodu.ods.trace.repository.RelationTypeRepository;
import com.dongfangsodu.ods.trace.repository.TraceRelationRepository;
import com.dongfangsodu.ods.trace.service.ImpactAnalysisService;
import com.dongfangsodu.ods.trace.service.TraceQueryService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TraceabilityIntegrationTest {
    @Autowired
    private ArtifactTypeRepository artifactTypes;
    @Autowired
    private ArtifactRepository artifacts;
    @Autowired
    private ArtifactVersionRepository versions;
    @Autowired
    private RelationTypeRepository relationTypes;
    @Autowired
    private TraceRelationRepository relations;
    @Autowired
    private TraceQueryService traceQueries;
    @Autowired
    private ImpactAnalysisService impacts;
    @Autowired
    private AnalysisTicketLinkRepository ticketLinks;
    @Autowired
    private TicketRepository tickets;

    @Test
    void cycleTerminatesAndConfirmedCandidateCreatesLinkedTicket() {
        ArtifactType type = artifactTypes.save(new ArtifactType("TEST_NODE", "测试节点"));
        RelationTypeDefinition relationType = relationTypes.save(new RelationTypeDefinition(
                "CONFIGURES", "配置", "源配置目标", PropagationMode.FORWARD, new BigDecimal("0.95")));
        ArtifactVersion source = artifact(type, "NODE-A", "TTC参数");
        ArtifactVersion second = artifact(type, "NODE-B", "算法配置");
        ArtifactVersion third = artifact(type, "NODE-C", "测试用例");
        ArtifactVersion fourth = artifact(type, "NODE-D", "培训材料");
        relation(source, second, relationType);
        relation(second, third, relationType);
        relation(third, source, relationType);
        relation(third, fourth, relationType);

        var query = traceQueries.query(new TraceQueryRequest(
                source.getId(), TraceDirection.FORWARD, 5, 100, null, null));

        assertThat(query.nodes()).hasSize(4);
        assertThat(query.paths()).hasSize(3);
        assertThat(query.truncatedByNodeLimit()).isFalse();

        var change = impacts.createChange(new CreateChangeRequest(source.getId(), ChangeType.PARAMETER,
                "2.0 s", "2.5 s", "调整TTC阈值"), "admin");
        ImpactReportResponse report = impacts.analyze(change.id(), new AnalyzeChangeRequest(3, 100), "admin");

        assertThat(report.candidateCount()).isEqualTo(3);
        assertThat(report.candidates()).allSatisfy(candidate -> assertThat(candidate.paths()).isNotEmpty());
        var selected = report.candidates().getFirst();
        BigDecimal originalScore = selected.initialScore();
        ImpactReportResponse reviewed = impacts.review(report.id(), new ReviewCandidatesRequest(report.version(),
                List.of(new CandidateReviewItem(selected.id(), ReviewStatus.CONFIRMED, "确认复核"))), "admin");

        assertThat(reviewed.candidates().stream().filter(candidate -> candidate.id().equals(selected.id()))
                .findFirst().orElseThrow().initialScore()).isEqualByComparingTo(originalScore);

        var created = impacts.confirmTickets(report.id(), new ConfirmTicketsRequest(reviewed.version(),
                List.of(selected.id()), "trace-test-user", TicketPriority.HIGH, null, false, true), "admin");

        assertThat(created).hasSize(1);
        assertThat(tickets.findById(created.getFirst().id()).orElseThrow().getSource()).isEqualTo("TRACE_IMPACT");
        assertThat(ticketLinks.findByCandidateId(selected.id())).hasSize(1);
    }

    private ArtifactVersion artifact(ArtifactType type, String sourceId, String name) {
        Artifact artifact = artifacts.save(new Artifact("TRACE_LOCAL", "TEST_NODE", sourceId, type));
        ArtifactVersion version = versions.save(new ArtifactVersion(artifact, "V1", name, "CURRENT",
                "admin", name, null, null));
        artifact.useCurrentVersion(version.getId());
        return version;
    }

    private void relation(ArtifactVersion source, ArtifactVersion target, RelationTypeDefinition type) {
        relations.save(new TraceRelation(source, target, type, "测试关系", "admin"));
    }
}
