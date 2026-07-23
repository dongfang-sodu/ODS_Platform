package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "knowledge_nodes")
public class KnowledgeNode extends BaseEntity {
    @Column(nullable = false, length = 250)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NodeType nodeType;
    @ManyToOne(fetch = FetchType.LAZY)
    private KnowledgeNode parent;
    @Column(length = 500)
    private String resourceUrl;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false)
    private int sortOrder;

    protected KnowledgeNode() {
    }

    public KnowledgeNode(String name, NodeType nodeType, KnowledgeNode parent, String resourceUrl,
                         String description, int sortOrder) {
        this.name = name;
        this.nodeType = nodeType;
        this.parent = parent;
        this.resourceUrl = resourceUrl;
        this.description = description;
        this.sortOrder = sortOrder;
    }

    public String getName() { return name; }
    public NodeType getNodeType() { return nodeType; }
    public KnowledgeNode getParent() { return parent; }
    public String getResourceUrl() { return resourceUrl; }
    public String getDescription() { return description; }
    public int getSortOrder() { return sortOrder; }
}
