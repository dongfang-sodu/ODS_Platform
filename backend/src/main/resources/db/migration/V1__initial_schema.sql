CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    product VARCHAR(150) NOT NULL,
    owner VARCHAR(150) NOT NULL,
    team VARCHAR(200) NOT NULL,
    qg4_reference VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL,
    milestone_date DATE,
    source VARCHAR(30) NOT NULL,
    immutable BOOLEAN NOT NULL DEFAULT TRUE,
    dedupe_key VARCHAR(500) NOT NULL UNIQUE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pmo_projects (
    id UUID PRIMARY KEY,
    project_code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    level VARCHAR(10) NOT NULL,
    parent_id UUID REFERENCES pmo_projects(id),
    acquisition_id VARCHAR(80),
    capacity NUMERIC(12,2),
    risk_status VARCHAR(30) NOT NULL,
    mpr_escalation TEXT,
    key_project BOOLEAN NOT NULL DEFAULT FALSE,
    highlight_project BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(30) NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS acquisition_projects (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id),
    offline_status VARCHAR(80) NOT NULL,
    committee_status VARCHAR(80) NOT NULL,
    salesforce_status VARCHAR(80) NOT NULL,
    owner_department VARCHAR(120) NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS training_courses (
    id UUID PRIMARY KEY,
    topic VARCHAR(250) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    trainer VARCHAR(150),
    coordinator VARCHAR(150) NOT NULL,
    trainee TEXT,
    status VARCHAR(35) NOT NULL,
    participation_rate NUMERIC(5,2),
    training_dept VARCHAR(150) NOT NULL,
    material_location VARCHAR(500),
    description TEXT,
    advanced_email TEXT,
    material_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    external_key VARCHAR(120) NOT NULL UNIQUE,
    summary VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assignee VARCHAR(150) NOT NULL,
    project_key VARCHAR(80),
    due_date DATE,
    external_url VARCHAR(500),
    source VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS video_guidelines (
    id UUID PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    category VARCHAR(120) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_sales_records (
    id UUID PRIMARY KEY,
    report_year INTEGER NOT NULL,
    report_month INTEGER NOT NULL,
    oem VARCHAR(150) NOT NULL,
    model VARCHAR(150),
    sales_volume INTEGER NOT NULL,
    adas_level VARCHAR(50),
    source VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    node_type VARCHAR(30) NOT NULL,
    parent_id UUID REFERENCES knowledge_nodes(id),
    resource_url VARCHAR(500),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
