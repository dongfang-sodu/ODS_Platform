package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TicketStatus;
import com.dongfangsodu.ods.exception.BusinessRuleException;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.trace.api.TraceDtos.AnalyzeChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CandidateReviewItem;
import com.dongfangsodu.ods.trace.api.TraceDtos.ChangeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ConfirmTicketsRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreatedTicketResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactCandidateResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactPathResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactPathStepResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactReportResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactReportSummaryResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ReviewCandidatesRequest;
import com.dongfangsodu.ods.trace.domain.AnalysisTicketLink;
import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import com.dongfangsodu.ods.trace.domain.ChangeRecord;
import com.dongfangsodu.ods.trace.domain.ChangeType;
import com.dongfangsodu.ods.trace.domain.ImpactCandidate;
import com.dongfangsodu.ods.trace.domain.ImpactLevel;
import com.dongfangsodu.ods.trace.domain.ImpactPath;
import com.dongfangsodu.ods.trace.domain.ImpactPathStep;
import com.dongfangsodu.ods.trace.domain.ImpactReport;
import com.dongfangsodu.ods.trace.domain.PropagationMode;
import com.dongfangsodu.ods.trace.domain.ReviewStatus;
import com.dongfangsodu.ods.trace.domain.TraceRelation;
import com.dongfangsodu.ods.trace.domain.TraversalDirection;
import com.dongfangsodu.ods.trace.repository.AnalysisTicketLinkRepository;
import com.dongfangsodu.ods.trace.repository.ChangeRecordRepository;
import com.dongfangsodu.ods.trace.repository.ImpactCandidateRepository;
import com.dongfangsodu.ods.trace.repository.ImpactReportRepository;
import com.dongfangsodu.ods.trace.repository.TraceRelationRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImpactAnalysisService {
    private static final double PATH_DECAY = 0.85;
    private static final double UNMATCHED_FACTOR = 0.85;

    private final ArtifactService artifacts;
    private final TraceQueryService traceQueries;
    private final TraceRelationRepository relations;
    private final ChangeRecordRepository changes;
    private final ImpactReportRepository reports;
    private final ImpactCandidateRepository candidates;
    private final AnalysisTicketLinkRepository ticketLinks;
    private final TicketCreationPort ticketCreation;
    private final OperationLogService operationLogs;

    public ImpactAnalysisService(ArtifactService artifacts, TraceQueryService traceQueries,
                                 TraceRelationRepository relations, ChangeRecordRepository changes,
                                 ImpactReportRepository reports, ImpactCandidateRepository candidates,
                                 AnalysisTicketLinkRepository ticketLinks, TicketCreationPort ticketCreation,
                                 OperationLogService operationLogs) {
        this.artifacts = artifacts;
        this.traceQueries = traceQueries;
        this.relations = relations;
        this.changes = changes;
        this.reports = reports;
        this.candidates = candidates;
        this.ticketLinks = ticketLinks;
        this.ticketCreation = ticketCreation;
        this.operationLogs = operationLogs;
    }

    @Transactional
    public ChangeResponse createChange(CreateChangeRequest request, String username) {
        ArtifactVersion source = artifacts.requireVersion(request.sourceVersionId());
        ChangeRecord change = changes.save(new ChangeRecord(source, request.changeType(), request.beforeContent(),
                request.afterContent(), request.description(), username));
        operationLogs.success(username, "CHANGE_CREATE", "CHANGE_RECORD", change.getId(), "创建变更记录");
        return toChangeResponse(change);
    }

    @Transactional
    public ImpactReportResponse analyze(UUID changeId, AnalyzeChangeRequest request, String username) {
        ChangeRecord change = requireChange(changeId);
        int maxDepth = request.maxDepth() == null ? 3 : request.maxDepth();
        int maxNodes = request.maxNodes() == null ? 100 : request.maxNodes();
        ImpactReport report = reports.save(new ImpactReport(change, maxDepth, maxNodes, username));
        AnalysisResult analysis = calculate(change, maxDepth, maxNodes);
        analysis.candidates().values().stream()
                .sorted(Comparator.comparingDouble(CandidateSeed::score).reversed())
                .forEach(seed -> addCandidate(report, seed));
        report.markTruncated(analysis.truncatedByDepth(), analysis.truncatedByNodeLimit());
        if (report.getCandidateCount() == 0) {
            report.markReviewed();
        }
        reports.save(report);
        operationLogs.success(username, "IMPACT_ANALYZE", "IMPACT_REPORT", report.getId(),
                "生成候选" + report.getCandidateCount() + "项");
        reports.flush();
        return toReportResponse(report);
    }

    @Transactional(readOnly = true)
    public List<ImpactReportSummaryResponse> listReports() {
        return reports.findAllByOrderByCreatedAtDesc().stream().map(report -> new ImpactReportSummaryResponse(
                report.getId(), report.getChangeRecord().getId(),
                report.getChangeRecord().getSourceVersion().getDisplayName(),
                report.getChangeRecord().getChangeType(), report.getStatus(), report.getCandidateCount(),
                report.getVersion(), report.getCreatedAt())).toList();
    }

    @Transactional(readOnly = true)
    public ImpactReportResponse findReport(UUID reportId) {
        return toReportResponse(requireReport(reportId));
    }

    @Transactional
    public ImpactReportResponse review(UUID reportId, ReviewCandidatesRequest request, String username) {
        ImpactReport report = requireReport(reportId);
        checkVersion(report, request.reportVersion());
        Map<UUID, ImpactCandidate> reportCandidates = report.getCandidates().stream()
                .collect(java.util.stream.Collectors.toMap(ImpactCandidate::getId, candidate -> candidate));
        for (CandidateReviewItem item : request.candidates()) {
            if (item.status() == ReviewStatus.PENDING) {
                throw new BusinessRuleException("复核结论必须为确认或排除");
            }
            ImpactCandidate candidate = reportCandidates.get(item.candidateId());
            if (candidate == null) {
                throw new BusinessRuleException("复核项不属于当前影响报告");
            }
            candidate.review(item.status(), item.comment(), username);
        }
        if (report.getCandidates().stream().allMatch(candidate -> candidate.getReviewStatus() != ReviewStatus.PENDING)) {
            report.markReviewed();
        } else {
            report.beginReview();
        }
        operationLogs.success(username, "CANDIDATE_REVIEW", "IMPACT_REPORT", reportId,
                "保存候选复核结论");
        reports.flush();
        return toReportResponse(report);
    }

    @Transactional
    public List<CreatedTicketResponse> confirmTickets(UUID reportId, ConfirmTicketsRequest request, String username) {
        if (!Boolean.TRUE.equals(request.confirmed())) {
            throw new BusinessRuleException("必须完成二次确认后才能创建工单");
        }
        ImpactReport report = requireReport(reportId);
        checkVersion(report, request.reportVersion());
        Map<UUID, ImpactCandidate> reportCandidates = report.getCandidates().stream()
                .collect(java.util.stream.Collectors.toMap(ImpactCandidate::getId, candidate -> candidate));
        List<ImpactCandidate> selected = request.candidateIds().stream().distinct().map(candidateId -> {
            ImpactCandidate candidate = reportCandidates.get(candidateId);
            if (candidate == null) {
                throw new BusinessRuleException("工单候选不属于当前影响报告");
            }
            if (candidate.getReviewStatus() != ReviewStatus.CONFIRMED) {
                throw new BusinessRuleException("只有已确认影响的候选可以创建工单");
            }
            return candidate;
        }).toList();
        if (!request.allowDuplicate()) {
            for (ImpactCandidate candidate : selected) {
                boolean openTicketExists = ticketLinks.findByCandidateId(candidate.getId()).stream()
                        .map(AnalysisTicketLink::getTicket)
                        .anyMatch(ticket -> ticket.getStatus() != TicketStatus.DONE);
                if (openTicketExists) {
                    throw new ConflictException("选中的影响对象已经存在未关闭工单");
                }
            }
        }
        List<CreatedTicketResponse> created = new ArrayList<>();
        for (ImpactCandidate candidate : selected) {
            String targetName = candidate.getTargetVersion().getDisplayName();
            String sourceName = report.getChangeRecord().getSourceVersion().getDisplayName();
            Ticket ticket = ticketCreation.createImpactTicket("复核受影响工件：" + targetName,
                    "来源变更：" + sourceName + "\n影响报告：" + report.getId()
                            + "\n候选分值：" + candidate.getInitialScore(),
                    request.assignee(), request.priority(), request.dueDate());
            ticketLinks.save(new AnalysisTicketLink(candidate, ticket));
            created.add(toTicketResponse(ticket));
        }
        report.markTicketsCreated();
        operationLogs.success(username, "TICKET_CONFIRM", "IMPACT_REPORT", reportId,
                "创建关联工单" + created.size() + "张");
        return created;
    }

    private AnalysisResult calculate(ChangeRecord change, int maxDepth, int maxNodes) {
        Map<UUID, List<PropagationEdge>> adjacency = buildPropagationAdjacency();
        ArtifactVersion source = change.getSourceVersion();
        ArrayDeque<ImpactState> queue = new ArrayDeque<>();
        Set<UUID> sourcePath = new HashSet<>();
        sourcePath.add(source.getId());
        queue.add(new ImpactState(source, 0, 1.0, false, List.of(), sourcePath));
        Set<UUID> uniqueNodes = new HashSet<>();
        uniqueNodes.add(source.getId());
        Map<UUID, Double> bestExpandedScore = new HashMap<>();
        Map<UUID, CandidateSeed> bestCandidates = new LinkedHashMap<>();
        boolean truncatedByDepth = false;
        boolean truncatedByNodeLimit = false;

        while (!queue.isEmpty() && !truncatedByNodeLimit) {
            ImpactState state = queue.removeFirst();
            List<PropagationEdge> outgoing = adjacency.getOrDefault(state.version().getId(), List.of());
            if (state.depth() >= maxDepth) {
                if (!outgoing.isEmpty()) {
                    truncatedByDepth = true;
                }
                continue;
            }
            for (PropagationEdge edge : outgoing) {
                if (state.pathNodes().contains(edge.next().getId())) {
                    continue;
                }
                boolean newNode = uniqueNodes.add(edge.next().getId());
                if (newNode && uniqueNodes.size() > maxNodes) {
                    uniqueNodes.remove(edge.next().getId());
                    truncatedByNodeLimit = true;
                    break;
                }
                int newDepth = state.depth() + 1;
                double relationWeight = edge.relation().getRelationType().getBaseWeight().doubleValue();
                double product = state.product() * relationWeight * (newDepth > 1 ? PATH_DECAY : 1.0);
                boolean matched = state.matched() || isPreferred(change.getChangeType(),
                        edge.relation().getRelationType().getCode());
                double score = Math.min(100.0, 100.0 * product * (matched ? 1.0 : UNMATCHED_FACTOR));
                List<PathSeed> path = new ArrayList<>(state.path());
                path.add(new PathSeed(edge.relation(), edge.direction(), score));
                CandidateSeed current = bestCandidates.get(edge.next().getId());
                if (current == null || score > current.score()) {
                    bestCandidates.put(edge.next().getId(), new CandidateSeed(edge.next(), score, List.copyOf(path)));
                }
                double previousExpanded = bestExpandedScore.getOrDefault(edge.next().getId(), -1.0);
                if (score > previousExpanded) {
                    bestExpandedScore.put(edge.next().getId(), score);
                    Set<UUID> pathNodes = new HashSet<>(state.pathNodes());
                    pathNodes.add(edge.next().getId());
                    queue.addLast(new ImpactState(edge.next(), newDepth, product, matched,
                            List.copyOf(path), pathNodes));
                }
            }
        }
        return new AnalysisResult(bestCandidates, truncatedByDepth, truncatedByNodeLimit);
    }

    private Map<UUID, List<PropagationEdge>> buildPropagationAdjacency() {
        Map<UUID, List<PropagationEdge>> adjacency = new HashMap<>();
        for (TraceRelation relation : relations.findByActiveTrue()) {
            if (!relation.getRelationType().isActive()) {
                continue;
            }
            PropagationMode mode = relation.getRelationType().getPropagationMode();
            if (mode == PropagationMode.FORWARD || mode == PropagationMode.BOTH) {
                adjacency.computeIfAbsent(relation.getSourceVersion().getId(), ignored -> new ArrayList<>())
                        .add(new PropagationEdge(relation, relation.getTargetVersion(), TraversalDirection.FORWARD));
            }
            if (mode == PropagationMode.REVERSE || mode == PropagationMode.BOTH) {
                adjacency.computeIfAbsent(relation.getTargetVersion().getId(), ignored -> new ArrayList<>())
                        .add(new PropagationEdge(relation, relation.getSourceVersion(), TraversalDirection.REVERSE));
            }
        }
        return adjacency;
    }

    private void addCandidate(ImpactReport report, CandidateSeed seed) {
        BigDecimal score = BigDecimal.valueOf(seed.score()).setScale(3, RoundingMode.HALF_UP);
        ImpactCandidate candidate = new ImpactCandidate(report, seed.target(), score, level(seed.score()));
        ImpactPath path = new ImpactPath(candidate, 1, score, seed.path().size(), true);
        int sequence = 1;
        for (PathSeed step : seed.path()) {
            TraceRelation relation = step.relation();
            path.addStep(new ImpactPathStep(path, sequence++, relation, relation.getSourceVersion(),
                    relation.getTargetVersion(), step.direction(), relation.getRelationType().getBaseWeight(),
                    BigDecimal.valueOf(step.cumulativeScore()).setScale(4, RoundingMode.HALF_UP)));
        }
        candidate.addPath(path);
        report.addCandidate(candidate);
    }

    private boolean isPreferred(ChangeType changeType, String relationCode) {
        String code = relationCode.toUpperCase(Locale.ROOT);
        return switch (changeType) {
            case PARAMETER -> Set.of("CONSTRAINS", "CONFIGURES", "VERIFIED_BY", "DESCRIBED_BY").contains(code);
            case HARDWARE -> Set.of("CONFIGURES", "DEPENDS_ON", "IMPLEMENTED_BY", "VERIFIED_BY").contains(code);
            case GOAL -> Set.of("DECOMPOSES", "CONSTRAINS", "IMPLEMENTED_BY", "VERIFIED_BY").contains(code);
            case OTHER -> false;
        };
    }

    private ImpactLevel level(double score) {
        if (score >= 70.0) return ImpactLevel.HIGH;
        if (score >= 40.0) return ImpactLevel.MEDIUM;
        return ImpactLevel.LOW;
    }

    private void checkVersion(ImpactReport report, long expectedVersion) {
        if (report.getVersion() != expectedVersion) {
            throw new ConflictException("影响报告已被其他操作更新，请刷新后重试");
        }
    }

    private ChangeRecord requireChange(UUID id) {
        return changes.findById(id).orElseThrow(() -> new ResourceNotFoundException("变更记录不存在"));
    }

    private ImpactReport requireReport(UUID id) {
        return reports.findById(id).orElseThrow(() -> new ResourceNotFoundException("影响报告不存在"));
    }

    private ChangeResponse toChangeResponse(ChangeRecord change) {
        return new ChangeResponse(change.getId(), change.getSourceVersion().getId(),
                change.getSourceVersion().getDisplayName(), change.getChangeType(), change.getBeforeContent(),
                change.getAfterContent(), change.getDescription(), change.getCreatedBy(), change.getCreatedAt());
    }

    private ImpactReportResponse toReportResponse(ImpactReport report) {
        return new ImpactReportResponse(report.getId(), toChangeResponse(report.getChangeRecord()), report.getStatus(),
                report.getMaxDepth(), report.getMaxNodes(), report.getScoringRuleVersion(),
                report.getCandidateCount(), report.isTruncatedByDepth(), report.isTruncatedByNodeLimit(),
                report.getCreatedBy(), report.getVersion(), report.getCreatedAt(),
                report.getCandidates().stream().map(this::toCandidateResponse).toList());
    }

    private ImpactCandidateResponse toCandidateResponse(ImpactCandidate candidate) {
        List<CreatedTicketResponse> linkedTickets = ticketLinks.findByCandidateId(candidate.getId()).stream()
                .map(AnalysisTicketLink::getTicket).map(this::toTicketResponse).toList();
        return new ImpactCandidateResponse(candidate.getId(), traceQueries.toNodeResponse(candidate.getTargetVersion()),
                candidate.getInitialScore(), candidate.getInitialLevel(), candidate.getReviewStatus(),
                candidate.getReviewComment(), candidate.getReviewedBy(), candidate.getReviewedAt(),
                candidate.getPaths().stream().map(this::toPathResponse).toList(), linkedTickets);
    }

    private ImpactPathResponse toPathResponse(ImpactPath path) {
        return new ImpactPathResponse(path.getPathRank(), path.getTotalScore(), path.getLength(),
                path.isPrimaryPath(), path.getSteps().stream().map(step -> new ImpactPathStepResponse(
                        step.getSequenceNo(), step.getRelation().getId(),
                        step.getRelation().getRelationType().getCode(), step.getSourceVersion().getId(),
                        step.getTargetVersion().getId(), step.getTraversalDirection(), step.getRelationWeight(),
                        step.getStepScore())).toList());
    }

    private CreatedTicketResponse toTicketResponse(Ticket ticket) {
        return new CreatedTicketResponse(ticket.getId(), ticket.getExternalKey(), ticket.getSummary(),
                ticket.getAssignee(), ticket.getPriority(), ticket.getStatus().name(), ticket.getDueDate());
    }

    private record PropagationEdge(TraceRelation relation, ArtifactVersion next, TraversalDirection direction) {
    }

    private record PathSeed(TraceRelation relation, TraversalDirection direction, double cumulativeScore) {
    }

    private record ImpactState(ArtifactVersion version, int depth, double product, boolean matched,
                               List<PathSeed> path, Set<UUID> pathNodes) {
    }

    private record CandidateSeed(ArtifactVersion target, double score, List<PathSeed> path) {
    }

    private record AnalysisResult(Map<UUID, CandidateSeed> candidates, boolean truncatedByDepth,
                                  boolean truncatedByNodeLimit) {
    }
}
