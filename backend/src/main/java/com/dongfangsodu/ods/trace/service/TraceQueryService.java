package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.trace.api.TraceDtos.TraceEdgeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceNodeResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.TracePathResponse;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceQueryRequest;
import com.dongfangsodu.ods.trace.api.TraceDtos.TraceQueryResponse;
import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import com.dongfangsodu.ods.trace.domain.TraceDirection;
import com.dongfangsodu.ods.trace.domain.TraceRelation;
import com.dongfangsodu.ods.trace.domain.TraversalDirection;
import com.dongfangsodu.ods.trace.repository.TraceRelationRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TraceQueryService {
    private final TraceRelationRepository relations;
    private final ArtifactService artifacts;

    public TraceQueryService(TraceRelationRepository relations, ArtifactService artifacts) {
        this.relations = relations;
        this.artifacts = artifacts;
    }

    @Transactional(readOnly = true)
    public TraceQueryResponse query(TraceQueryRequest request) {
        Instant started = Instant.now();
        ArtifactVersion source = artifacts.requireVersion(request.sourceVersionId());
        TraceDirection direction = request.direction() == null ? TraceDirection.FORWARD : request.direction();
        int maxDepth = request.maxDepth() == null ? 3 : request.maxDepth();
        int maxNodes = request.maxNodes() == null ? 100 : request.maxNodes();
        Set<String> relationFilter = normalized(request.relationTypeFilters());
        Set<String> artifactFilter = normalized(request.artifactTypeFilters());

        Map<UUID, List<TraversalEdge>> adjacency = buildAdjacency(direction, relationFilter);
        ArrayDeque<PathState> queue = new ArrayDeque<>();
        Map<UUID, ArtifactVersion> visited = new LinkedHashMap<>();
        Map<UUID, List<TraceEdgeResponse>> paths = new LinkedHashMap<>();
        Set<EdgeKey> resultEdges = new LinkedHashSet<>();
        queue.add(new PathState(source, 0, List.of()));
        visited.put(source.getId(), source);
        boolean truncatedByDepth = false;
        boolean truncatedByNodeLimit = false;

        while (!queue.isEmpty() && !truncatedByNodeLimit) {
            PathState state = queue.removeFirst();
            List<TraversalEdge> outgoing = adjacency.getOrDefault(state.version().getId(), List.of());
            if (state.depth() >= maxDepth) {
                if (outgoing.stream().anyMatch(edge -> !visited.containsKey(edge.next().getId()))) {
                    truncatedByDepth = true;
                }
                continue;
            }
            for (TraversalEdge edge : outgoing) {
                if (visited.containsKey(edge.next().getId())) {
                    continue;
                }
                if (visited.size() >= maxNodes) {
                    truncatedByNodeLimit = true;
                    break;
                }
                TraceEdgeResponse step = toEdgeResponse(edge);
                List<TraceEdgeResponse> path = new ArrayList<>(state.path());
                path.add(step);
                visited.put(edge.next().getId(), edge.next());
                paths.put(edge.next().getId(), List.copyOf(path));
                resultEdges.add(new EdgeKey(step.relationId(), step.traversalDirection(), step));
                queue.addLast(new PathState(edge.next(), state.depth() + 1, List.copyOf(path)));
            }
        }

        List<TraceNodeResponse> nodes = visited.values().stream()
                .filter(version -> version.getId().equals(source.getId()) || artifactFilter.isEmpty()
                        || artifactFilter.contains(version.getArtifact().getType().getCode().toUpperCase(Locale.ROOT)))
                .map(this::toNodeResponse).toList();
        Set<UUID> includedNodeIds = nodes.stream().map(TraceNodeResponse::versionId).collect(java.util.stream.Collectors.toSet());
        List<TracePathResponse> resultPaths = paths.entrySet().stream()
                .filter(entry -> includedNodeIds.contains(entry.getKey()))
                .map(entry -> new TracePathResponse(entry.getKey(), entry.getValue().size(), entry.getValue()))
                .toList();
        long durationMs = Duration.between(started, Instant.now()).toMillis();
        return new TraceQueryResponse(source.getId(), direction, maxDepth, maxNodes, nodes,
                resultEdges.stream().map(EdgeKey::response).toList(), resultPaths,
                truncatedByDepth, truncatedByNodeLimit, 0, durationMs);
    }

    private Map<UUID, List<TraversalEdge>> buildAdjacency(TraceDirection direction, Set<String> relationFilter) {
        Map<UUID, List<TraversalEdge>> adjacency = new HashMap<>();
        for (TraceRelation relation : relations.findByActiveTrue()) {
            if (!relation.getRelationType().isActive()) {
                continue;
            }
            String code = relation.getRelationType().getCode().toUpperCase(Locale.ROOT);
            if (!relationFilter.isEmpty() && !relationFilter.contains(code)) {
                continue;
            }
            if (direction == TraceDirection.FORWARD) {
                adjacency.computeIfAbsent(relation.getSourceVersion().getId(), ignored -> new ArrayList<>())
                        .add(new TraversalEdge(relation, relation.getTargetVersion(), TraversalDirection.FORWARD));
            } else {
                adjacency.computeIfAbsent(relation.getTargetVersion().getId(), ignored -> new ArrayList<>())
                        .add(new TraversalEdge(relation, relation.getSourceVersion(), TraversalDirection.REVERSE));
            }
        }
        return adjacency;
    }

    TraceNodeResponse toNodeResponse(ArtifactVersion version) {
        return new TraceNodeResponse(version.getId(), version.getArtifact().getId(),
                version.getArtifact().getType().getCode(), version.getDisplayName(), version.getVersionLabel(),
                version.getArtifact().getSourceModule(), false);
    }

    private TraceEdgeResponse toEdgeResponse(TraversalEdge edge) {
        TraceRelation relation = edge.relation();
        return new TraceEdgeResponse(relation.getId(), relation.getRelationType().getCode(),
                relation.getSourceVersion().getId(), relation.getTargetVersion().getId(), edge.direction());
    }

    private Set<String> normalized(Set<String> values) {
        if (values == null || values.isEmpty()) {
            return Set.of();
        }
        Set<String> result = new HashSet<>();
        values.forEach(value -> result.add(value.toUpperCase(Locale.ROOT)));
        return result;
    }

    private record TraversalEdge(TraceRelation relation, ArtifactVersion next, TraversalDirection direction) {
    }

    private record PathState(ArtifactVersion version, int depth, List<TraceEdgeResponse> path) {
    }

    private record EdgeKey(UUID relationId, TraversalDirection direction, TraceEdgeResponse response) {
        @Override
        public boolean equals(Object object) {
            return object instanceof EdgeKey other && relationId.equals(other.relationId) && direction == other.direction;
        }

        @Override
        public int hashCode() {
            return 31 * relationId.hashCode() + direction.hashCode();
        }
    }
}
