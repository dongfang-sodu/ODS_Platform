package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.exception.BusinessRuleException;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.trace.api.TraceDtos.ArtifactResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ArtifactTypeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.ArtifactVersionResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateArtifactRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateArtifactVersionRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.CreateRelationRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationStatusRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.RelationTypeResponse;
import com.dongfangsodu.ods.trace.domain.Artifact;
import com.dongfangsodu.ods.trace.domain.ArtifactType;
import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import com.dongfangsodu.ods.trace.domain.RelationTypeDefinition;
import com.dongfangsodu.ods.trace.domain.TraceRelation;
import com.dongfangsodu.ods.trace.repository.ArtifactRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactTypeRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactVersionRepository;
import com.dongfangsodu.ods.trace.repository.RelationTypeRepository;
import com.dongfangsodu.ods.trace.repository.RelationTypeRuleRepository;
import com.dongfangsodu.ods.trace.repository.TraceRelationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArtifactService {
    private final ArtifactRepository artifacts;
    private final ArtifactVersionRepository versions;
    private final ArtifactTypeRepository artifactTypes;
    private final RelationTypeRepository relationTypes;
    private final RelationTypeRuleRepository relationRules;
    private final TraceRelationRepository relations;
    private final ArtifactSourceRegistry sources;
    private final OperationLogService operationLogs;

    public ArtifactService(ArtifactRepository artifacts, ArtifactVersionRepository versions,
                           ArtifactTypeRepository artifactTypes, RelationTypeRepository relationTypes,
                           RelationTypeRuleRepository relationRules, TraceRelationRepository relations,
                           ArtifactSourceRegistry sources, OperationLogService operationLogs) {
        this.artifacts = artifacts;
        this.versions = versions;
        this.artifactTypes = artifactTypes;
        this.relationTypes = relationTypes;
        this.relationRules = relationRules;
        this.relations = relations;
        this.sources = sources;
        this.operationLogs = operationLogs;
    }

    @Transactional(readOnly = true)
    public List<ArtifactTypeResponse> artifactTypes() {
        return artifactTypes.findAll().stream().map(this::toTypeResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RelationTypeResponse> relationTypes() {
        return relationTypes.findAll().stream().map(this::toRelationTypeResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ArtifactResponse> list() {
        return artifacts.findAll().stream().map(this::toArtifactResponse).toList();
    }

    @Transactional(readOnly = true)
    public ArtifactResponse find(UUID id) {
        return toArtifactResponse(requireArtifact(id));
    }

    @Transactional
    public ArtifactResponse create(CreateArtifactRequest request, String username) {
        if (!sources.exists(request.sourceModule(), request.sourceObjectId())) {
            throw new BusinessRuleException("来源对象不存在或来源模块不受支持");
        }
        artifacts.findBySourceModuleIgnoreCaseAndSourceObjectTypeIgnoreCaseAndSourceObjectId(
                request.sourceModule(), request.sourceObjectType(), request.sourceObjectId())
                .ifPresent(existing -> { throw new ConflictException("同一来源对象已经登记为工件"); });
        ArtifactType type = artifactTypes.findByCodeIgnoreCase(request.artifactTypeCode())
                .filter(ArtifactType::isActive)
                .orElseThrow(() -> new BusinessRuleException("工件类型不存在或已停用"));
        Artifact artifact = artifacts.save(new Artifact(request.sourceModule().toUpperCase(),
                request.sourceObjectType().toUpperCase(), request.sourceObjectId(), type));
        ArtifactVersion version = versions.save(new ArtifactVersion(artifact, request.versionLabel(),
                request.displayName(), request.status(), request.owner(), request.contentSummary(),
                request.contentFingerprint(), request.sourceUpdatedAt()));
        artifact.useCurrentVersion(version.getId());
        operationLogs.success(username, "ARTIFACT_REGISTER", "ARTIFACT", artifact.getId(),
                "登记工件及首个版本");
        return toArtifactResponse(artifact);
    }

    @Transactional
    public ArtifactResponse addVersion(UUID artifactId, CreateArtifactVersionRequest request, String username) {
        Artifact artifact = requireArtifact(artifactId);
        versions.findByArtifactIdAndVersionLabelIgnoreCase(artifactId, request.versionLabel())
                .ifPresent(existing -> { throw new ConflictException("该版本标识已经存在"); });
        ArtifactVersion version = versions.save(new ArtifactVersion(artifact, request.versionLabel(),
                request.displayName(), request.status(), request.owner(), request.contentSummary(),
                request.contentFingerprint(), request.sourceUpdatedAt()));
        artifact.useCurrentVersion(version.getId());
        operationLogs.success(username, "VERSION_CREATE", "ARTIFACT", artifactId, "追加不可变版本");
        return toArtifactResponse(artifact);
    }

    @Transactional(readOnly = true)
    public List<RelationResponse> listRelations() {
        return relations.findAllByOrderByCreatedAtDesc().stream().map(this::toRelationResponse).toList();
    }

    @Transactional
    public RelationResponse createRelation(CreateRelationRequest request, String username) {
        if (request.sourceVersionId().equals(request.targetVersionId())) {
            throw new BusinessRuleException("追溯关系不允许自连接");
        }
        ArtifactVersion source = requireVersion(request.sourceVersionId());
        ArtifactVersion target = requireVersion(request.targetVersionId());
        RelationTypeDefinition type = relationTypes.findByCodeIgnoreCase(request.relationTypeCode())
                .filter(RelationTypeDefinition::isActive)
                .orElseThrow(() -> new BusinessRuleException("关系类型不存在或已停用"));
        long configuredRules = relationRules.countByRelationTypeId(type.getId());
        if (configuredRules > 0 && !relationRules.existsByRelationTypeIdAndSourceTypeIdAndTargetTypeId(
                type.getId(), source.getArtifact().getType().getId(), target.getArtifact().getType().getId())) {
            throw new BusinessRuleException("该关系类型不允许连接当前两类工件");
        }
        TraceRelation relation = relations.findBySourceVersionIdAndTargetVersionIdAndRelationTypeId(
                source.getId(), target.getId(), type.getId()).orElse(null);
        if (relation != null) {
            if (relation.isActive()) {
                throw new ConflictException("完全相同的有效关系已经存在");
            }
            relation.changeActive(true, null);
        } else {
            relation = relations.save(new TraceRelation(source, target, type, request.rationale(), username));
        }
        operationLogs.success(username, "RELATION_CHANGE", "TRACE_RELATION", relation.getId(), "创建或恢复关系");
        return toRelationResponse(relation);
    }

    @Transactional
    public RelationResponse changeRelationStatus(UUID relationId, RelationStatusRequest request, String username) {
        TraceRelation relation = relations.findById(relationId)
                .orElseThrow(() -> new ResourceNotFoundException("追溯关系不存在"));
        if (!request.active() && (request.reason() == null || request.reason().isBlank())) {
            throw new BusinessRuleException("停用关系时必须填写原因");
        }
        relation.changeActive(request.active(), request.reason());
        operationLogs.success(username, "RELATION_CHANGE", "TRACE_RELATION", relationId,
                request.active() ? "恢复关系" : "停用关系");
        return toRelationResponse(relation);
    }

    ArtifactVersion requireVersion(UUID id) {
        return versions.findById(id).orElseThrow(() -> new ResourceNotFoundException("工件版本不存在"));
    }

    ArtifactResponse toArtifactResponse(Artifact artifact) {
        List<ArtifactVersion> artifactVersions = versions.findByArtifactIdOrderByCreatedAtDesc(artifact.getId());
        ArtifactVersion current = artifact.getCurrentVersionId() == null ? null : versions.findById(
                artifact.getCurrentVersionId()).orElse(null);
        return new ArtifactResponse(artifact.getId(), artifact.getSourceModule(), artifact.getSourceObjectType(),
                artifact.getSourceObjectId(), artifact.getSourceStatus(), toTypeResponse(artifact.getType()),
                artifact.getCurrentVersionId(), current == null ? null : toVersionResponse(current),
                artifactVersions.stream().map(this::toVersionResponse).toList(), false);
    }

    private Artifact requireArtifact(UUID id) {
        return artifacts.findById(id).orElseThrow(() -> new ResourceNotFoundException("工件不存在"));
    }

    private ArtifactTypeResponse toTypeResponse(ArtifactType type) {
        return new ArtifactTypeResponse(type.getId(), type.getCode(), type.getName(), type.isActive());
    }

    private ArtifactVersionResponse toVersionResponse(ArtifactVersion version) {
        return new ArtifactVersionResponse(version.getId(), version.getVersionLabel(), version.getDisplayName(),
                version.getStatus(), version.getOwner(), version.getContentSummary(), version.getContentFingerprint(),
                version.getSourceUpdatedAt(), version.getCreatedAt());
    }

    private RelationTypeResponse toRelationTypeResponse(RelationTypeDefinition type) {
        return new RelationTypeResponse(type.getId(), type.getCode(), type.getName(), type.getDirectionDescription(),
                type.getPropagationMode().name(), type.getBaseWeight(), type.isActive());
    }

    private RelationResponse toRelationResponse(TraceRelation relation) {
        return new RelationResponse(relation.getId(), relation.getSourceVersion().getId(),
                relation.getSourceVersion().getDisplayName(), relation.getTargetVersion().getId(),
                relation.getTargetVersion().getDisplayName(), toRelationTypeResponse(relation.getRelationType()),
                relation.getRationale(), relation.getCreatedBy(), relation.isActive(),
                relation.getDeactivatedReason(), relation.getDeactivatedAt(), relation.getCreatedAt());
    }
}
