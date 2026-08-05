package com.dongfangsodu.ods.trace.api;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.AnalyzeChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.ArtifactResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ArtifactTypeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ChangeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ConfirmTicketsRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateArtifactRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateArtifactVersionRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateChangeRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateRelationRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreatedTicketResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactReportResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ImpactReportSummaryResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.OperationLogResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationStatusRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationTypeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ReviewCandidatesRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceQueryRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceQueryResponse;
import com.dongfangsodu.ods.trace.service.ArtifactService;
import com.dongfangsodu.ods.trace.service.ImpactAnalysisService;
import com.dongfangsodu.ods.trace.service.OperationLogService;
import com.dongfangsodu.ods.trace.service.TraceQueryService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class TraceabilityController {
    private final ArtifactService artifacts;
    private final TraceQueryService queries;
    private final ImpactAnalysisService impacts;
    private final OperationLogService logs;

    public TraceabilityController(ArtifactService artifacts, TraceQueryService queries,
                                  ImpactAnalysisService impacts, OperationLogService logs) {
        this.artifacts = artifacts;
        this.queries = queries;
        this.impacts = impacts;
        this.logs = logs;
    }

    @GetMapping("/artifact-types")
    public ApiResponse<List<ArtifactTypeResponse>> artifactTypes() {
        return ApiResponse.of(artifacts.artifactTypes());
    }

    @GetMapping("/relation-types")
    public ApiResponse<List<RelationTypeResponse>> relationTypes() {
        return ApiResponse.of(artifacts.relationTypes());
    }

    @GetMapping("/artifacts")
    public ApiResponse<List<ArtifactResponse>> artifacts() {
        return ApiResponse.of(artifacts.list());
    }

    @GetMapping("/artifacts/{id}")
    public ApiResponse<ArtifactResponse> artifact(@PathVariable UUID id) {
        return ApiResponse.of(artifacts.find(id));
    }

    @PostMapping("/artifacts")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<ArtifactResponse> createArtifact(@Valid @RequestBody CreateArtifactRequest request,
                                                        Principal principal) {
        return ApiResponse.of(artifacts.create(request, principal.getName()));
    }

    @PostMapping("/artifacts/{id}/versions")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<ArtifactResponse> addVersion(@PathVariable UUID id,
                                                    @Valid @RequestBody CreateArtifactVersionRequest request,
                                                    Principal principal) {
        return ApiResponse.of(artifacts.addVersion(id, request, principal.getName()));
    }

    @GetMapping("/relations")
    public ApiResponse<List<RelationResponse>> relations() {
        return ApiResponse.of(artifacts.listRelations());
    }

    @PostMapping("/relations")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<RelationResponse> createRelation(@Valid @RequestBody CreateRelationRequest request,
                                                        Principal principal) {
        return ApiResponse.of(artifacts.createRelation(request, principal.getName()));
    }

    @PatchMapping("/relations/{id}/status")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<RelationResponse> changeRelationStatus(@PathVariable UUID id,
                                                              @Valid @RequestBody RelationStatusRequest request,
                                                              Principal principal) {
        return ApiResponse.of(artifacts.changeRelationStatus(id, request, principal.getName()));
    }

    @PostMapping("/trace-queries")
    public ApiResponse<TraceQueryResponse> traceQuery(@Valid @RequestBody TraceQueryRequest request) {
        return ApiResponse.of(queries.query(request));
    }

    @PostMapping("/changes")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','ADMIN')")
    public ApiResponse<ChangeResponse> createChange(@Valid @RequestBody CreateChangeRequest request,
                                                    Principal principal) {
        return ApiResponse.of(impacts.createChange(request, principal.getName()));
    }

    @PostMapping("/changes/{id}/analyze")
    @PreAuthorize("hasAnyRole('TPJM','PJM','EBE','EPO','LPM','ADMIN')")
    public ApiResponse<ImpactReportResponse> analyze(@PathVariable UUID id,
                                                     @Valid @RequestBody AnalyzeChangeRequest request,
                                                     Principal principal) {
        return ApiResponse.of(impacts.analyze(id, request, principal.getName()));
    }

    @GetMapping("/impact-reports")
    public ApiResponse<List<ImpactReportSummaryResponse>> reports() {
        return ApiResponse.of(impacts.listReports());
    }

    @GetMapping("/impact-reports/{id}")
    public ApiResponse<ImpactReportResponse> report(@PathVariable UUID id) {
        return ApiResponse.of(impacts.findReport(id));
    }

    @PatchMapping("/impact-reports/{id}/candidates")
    @PreAuthorize("hasAnyRole('PJM','EBE','EPO','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<ImpactReportResponse> review(@PathVariable UUID id,
                                                   @Valid @RequestBody ReviewCandidatesRequest request,
                                                   Principal principal) {
        return ApiResponse.of(impacts.review(id, request, principal.getName()));
    }

    @PostMapping("/impact-reports/{id}/confirm-tickets")
    @PreAuthorize("hasAnyRole('PJM','LPM','TRAINER','COORDINATOR','ADMIN')")
    public ApiResponse<List<CreatedTicketResponse>> confirmTickets(
            @PathVariable UUID id, @Valid @RequestBody ConfirmTicketsRequest request, Principal principal) {
        return ApiResponse.of(impacts.confirmTickets(id, request, principal.getName()));
    }

    @GetMapping("/operation-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<OperationLogResponse>> operationLogs() {
        return ApiResponse.of(logs.recent());
    }
}
