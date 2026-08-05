CREATE TABLE trace_artifact_types (
    id UUID PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE trace_artifacts (
    id UUID PRIMARY KEY,
    source_module VARCHAR(60) NOT NULL,
    source_object_type VARCHAR(80) NOT NULL,
    source_object_id VARCHAR(160) NOT NULL,
    artifact_type_id UUID NOT NULL REFERENCES trace_artifact_types(id),
    current_version_id UUID,
    source_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_artifact_source UNIQUE (source_module, source_object_type, source_object_id)
);

CREATE TABLE trace_artifact_versions (
    id UUID PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES trace_artifacts(id),
    version_label VARCHAR(80) NOT NULL,
    display_name VARCHAR(240) NOT NULL,
    status VARCHAR(40) NOT NULL,
    owner VARCHAR(150),
    content_summary TEXT,
    content_fingerprint VARCHAR(128),
    source_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_artifact_version UNIQUE (artifact_id, version_label)
);

ALTER TABLE trace_artifacts ADD CONSTRAINT fk_trace_current_version
    FOREIGN KEY (current_version_id) REFERENCES trace_artifact_versions(id);

CREATE TABLE trace_relation_types (
    id UUID PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    direction_description VARCHAR(300) NOT NULL,
    propagation_mode VARCHAR(20) NOT NULL,
    base_weight NUMERIC(5,4) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE trace_relation_type_rules (
    id UUID PRIMARY KEY,
    relation_type_id UUID NOT NULL REFERENCES trace_relation_types(id),
    source_type_id UUID NOT NULL REFERENCES trace_artifact_types(id),
    target_type_id UUID NOT NULL REFERENCES trace_artifact_types(id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_relation_rule UNIQUE (relation_type_id, source_type_id, target_type_id)
);

CREATE TABLE trace_relations (
    id UUID PRIMARY KEY,
    source_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    target_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    relation_type_id UUID NOT NULL REFERENCES trace_relation_types(id),
    rationale TEXT,
    created_by VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deactivated_reason VARCHAR(500),
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_relation UNIQUE (source_version_id, target_version_id, relation_type_id)
);

CREATE TABLE trace_change_records (
    id UUID PRIMARY KEY,
    source_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    change_type VARCHAR(30) NOT NULL,
    before_content TEXT,
    after_content TEXT,
    description TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE trace_impact_reports (
    id UUID PRIMARY KEY,
    change_record_id UUID NOT NULL REFERENCES trace_change_records(id),
    status VARCHAR(30) NOT NULL,
    max_depth INTEGER NOT NULL,
    max_nodes INTEGER NOT NULL,
    scoring_rule_version VARCHAR(30) NOT NULL,
    candidate_count INTEGER NOT NULL,
    truncated_by_depth BOOLEAN NOT NULL,
    truncated_by_node_limit BOOLEAN NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE trace_impact_candidates (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES trace_impact_reports(id),
    target_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    initial_score NUMERIC(7,3) NOT NULL,
    initial_level VARCHAR(20) NOT NULL,
    review_status VARCHAR(20) NOT NULL,
    review_comment VARCHAR(1000),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_candidate_target UNIQUE (report_id, target_version_id)
);

CREATE TABLE trace_impact_paths (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES trace_impact_candidates(id),
    path_rank INTEGER NOT NULL,
    total_score NUMERIC(7,3) NOT NULL,
    length INTEGER NOT NULL,
    primary_path BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_candidate_path_rank UNIQUE (candidate_id, path_rank)
);

CREATE TABLE trace_impact_path_steps (
    id UUID PRIMARY KEY,
    path_id UUID NOT NULL REFERENCES trace_impact_paths(id),
    sequence_no INTEGER NOT NULL,
    relation_id UUID NOT NULL REFERENCES trace_relations(id),
    source_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    target_version_id UUID NOT NULL REFERENCES trace_artifact_versions(id),
    traversal_direction VARCHAR(20) NOT NULL,
    relation_weight NUMERIC(5,4) NOT NULL,
    step_score NUMERIC(7,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_path_step_sequence UNIQUE (path_id, sequence_no)
);

CREATE TABLE trace_analysis_ticket_links (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES trace_impact_candidates(id),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_trace_candidate_ticket UNIQUE (candidate_id, ticket_id)
);

CREATE TABLE trace_operation_logs (
    id UUID PRIMARY KEY,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(60) NOT NULL,
    object_type VARCHAR(60) NOT NULL,
    object_id VARCHAR(80) NOT NULL,
    result_code VARCHAR(40) NOT NULL,
    summary VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_trace_relation_source ON trace_relations(source_version_id, active);
CREATE INDEX idx_trace_relation_target ON trace_relations(target_version_id, active);
CREATE INDEX idx_trace_candidate_report ON trace_impact_candidates(report_id);
CREATE INDEX idx_trace_log_created_at ON trace_operation_logs(created_at DESC);
