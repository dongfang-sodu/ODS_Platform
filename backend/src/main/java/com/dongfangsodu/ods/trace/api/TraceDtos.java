package com.dongfangsodu.ods.trace.api;

import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.trace.domain.ChangeType;
import com.dongfangsodu.ods.trace.domain.ImpactLevel;
import com.dongfangsodu.ods.trace.domain.ImpactReportStatus;
import com.dongfangsodu.ods.trace.domain.ReviewStatus;
import com.dongfangsodu.ods.trace.domain.TraceDirection;
import com.dongfangsodu.ods.trace.domain.TraversalDirection;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class TraceDtos {
    private TraceDtos() {
    }

    public record ArtifactTypeResponse(UUID id, String code, String name, boolean active) {
    }

    public record RelationTypeResponse(UUID id, String code, String name, String directionDescription,
                                       String propagationMode, BigDecimal baseWeight, boolean active) {
    }

    public record ArtifactVersionResponse(UUID id, String versionLabel, String displayName, String status,
                                          String owner, String contentSummary, String contentFingerprint,
                                          Instant sourceUpdatedAt, Instant createdAt) {
    }

    public record ArtifactResponse(UUID id, String sourceModule, String sourceObjectType, String sourceObjectId,
                                   String sourceStatus, ArtifactTypeResponse type, UUID currentVersionId,
                                   ArtifactVersionResponse currentVersion, List<ArtifactVersionResponse> versions,
                                   boolean restricted) {
    }

    public record CreateArtifactRequest(@NotBlank @Size(max = 60) String sourceModule,
                                        @NotBlank @Size(max = 80) String sourceObjectType,
                                        @NotBlank @Size(max = 160) String sourceObjectId,
                                        @NotBlank @Size(max = 60) String artifactTypeCode,
                                        @NotBlank @Size(max = 80) String versionLabel,
                                        @NotBlank @Size(max = 240) String displayName,
                                        @NotBlank @Size(max = 40) String status,
                                        @Size(max = 150) String owner,
                                        @Size(max = 4000) String contentSummary,
                                        @Size(max = 128) String contentFingerprint,
                                        Instant sourceUpdatedAt) {
    }

    public record CreateArtifactVersionRequest(@NotBlank @Size(max = 80) String versionLabel,
                                               @NotBlank @Size(max = 240) String displayName,
                                               @NotBlank @Size(max = 40) String status,
                                               @Size(max = 150) String owner,
                                               @Size(max = 4000) String contentSummary,
                                               @Size(max = 128) String contentFingerprint,
                                               Instant sourceUpdatedAt) {
    }

    public record RelationResponse(UUID id, UUID sourceVersionId, String sourceName, UUID targetVersionId,
                                   String targetName, RelationTypeResponse type, String rationale,
                                   String createdBy, boolean active, String deactivatedReason,
                                   Instant deactivatedAt, Instant createdAt) {
    }

    public record CreateRelationRequest(@NotNull UUID sourceVersionId, @NotNull UUID targetVersionId,
                                        @NotBlank @Size(max = 60) String relationTypeCode,
                                        @NotBlank @Size(max = 2000) String rationale) {
    }

    public record RelationStatusRequest(@NotNull Boolean active, @Size(max = 500) String reason) {
    }

    public record TraceQueryRequest(@NotNull UUID sourceVersionId, TraceDirection direction,
                                    @Min(1) @Max(5) Integer maxDepth,
                                    @Min(1) @Max(100) Integer maxNodes,
                                    Set<String> artifactTypeFilters,
                                    Set<String> relationTypeFilters) {
    }

    public record TraceNodeResponse(UUID versionId, UUID artifactId, String artifactTypeCode, String displayName,
                                    String versionLabel, String sourceModule, boolean restricted) {
    }

    public record TraceEdgeResponse(UUID relationId, String relationTypeCode, UUID sourceVersionId,
                                    UUID targetVersionId, TraversalDirection traversalDirection) {
    }

    public record TracePathResponse(UUID targetVersionId, int length, List<TraceEdgeResponse> steps) {
    }

    public record TraceQueryResponse(UUID sourceVersionId, TraceDirection direction, int maxDepth, int maxNodes,
                                     List<TraceNodeResponse> nodes, List<TraceEdgeResponse> relations,
                                     List<TracePathResponse> paths, boolean truncatedByDepth,
                                     boolean truncatedByNodeLimit, int restrictedCount, long durationMs) {
    }

    public record CreateChangeRequest(@NotNull UUID sourceVersionId, @NotNull ChangeType changeType,
                                      @Size(max = 4000) String beforeContent,
                                      @Size(max = 4000) String afterContent,
                                      @NotBlank @Size(max = 4000) String description) {
    }

    public record ChangeResponse(UUID id, UUID sourceVersionId, String sourceName, ChangeType changeType,
                                 String beforeContent, String afterContent, String description,
                                 String createdBy, Instant createdAt) {
    }

    public record AnalyzeChangeRequest(@Min(1) @Max(5) Integer maxDepth,
                                       @Min(1) @Max(100) Integer maxNodes) {
    }

    public record ImpactPathStepResponse(int sequenceNo, UUID relationId, String relationTypeCode,
                                         UUID sourceVersionId, UUID targetVersionId,
                                         TraversalDirection traversalDirection,
                                         BigDecimal relationWeight, BigDecimal stepScore) {
    }

    public record ImpactPathResponse(int pathRank, BigDecimal totalScore, int length, boolean primary,
                                     List<ImpactPathStepResponse> steps) {
    }

    public record ImpactCandidateResponse(UUID id, TraceNodeResponse target, BigDecimal initialScore,
                                          ImpactLevel initialLevel, ReviewStatus reviewStatus,
                                          String reviewComment, String reviewedBy, Instant reviewedAt,
                                          List<ImpactPathResponse> paths, List<CreatedTicketResponse> tickets) {
    }

    public record ImpactReportSummaryResponse(UUID id, UUID changeRecordId, String sourceName,
                                              ChangeType changeType, ImpactReportStatus status,
                                              int candidateCount, long version, Instant createdAt) {
    }

    public record ImpactReportResponse(UUID id, ChangeResponse change, ImpactReportStatus status,
                                       int maxDepth, int maxNodes, String scoringRuleVersion,
                                       int candidateCount, boolean truncatedByDepth,
                                       boolean truncatedByNodeLimit, String createdBy,
                                       long version, Instant createdAt,
                                       List<ImpactCandidateResponse> candidates) {
    }

    public record CandidateReviewItem(@NotNull UUID candidateId, @NotNull ReviewStatus status,
                                      @Size(max = 1000) String comment) {
    }

    public record ReviewCandidatesRequest(@NotNull Long reportVersion,
                                          @NotEmpty List<@Valid CandidateReviewItem> candidates) {
    }

    public record ConfirmTicketsRequest(@NotNull Long reportVersion,
                                        @NotEmpty List<UUID> candidateIds,
                                        @NotBlank @Size(max = 150) String assignee,
                                        @NotNull TicketPriority priority,
                                        LocalDate dueDate,
                                        boolean allowDuplicate,
                                        @NotNull Boolean confirmed) {
    }

    public record CreatedTicketResponse(UUID id, String externalKey, String summary, String assignee,
                                        TicketPriority priority, String status, LocalDate dueDate) {
    }

    public record OperationLogResponse(UUID id, String actor, String action, String objectType,
                                       String objectId, String resultCode, String summary, Instant createdAt) {
    }
}
