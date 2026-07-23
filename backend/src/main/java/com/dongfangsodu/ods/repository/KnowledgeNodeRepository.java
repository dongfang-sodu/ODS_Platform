package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.KnowledgeNode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, UUID> {
    List<KnowledgeNode> findByParentIsNullOrderBySortOrderAsc();
    List<KnowledgeNode> findByParent_IdOrderBySortOrderAsc(UUID parentId);
}
