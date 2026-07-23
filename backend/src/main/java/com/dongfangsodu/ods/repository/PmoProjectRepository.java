package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.PmoProject;
import com.dongfangsodu.ods.domain.ProjectLevel;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PmoProjectRepository extends JpaRepository<PmoProject, UUID> {
    Optional<PmoProject> findByProjectCode(String projectCode);
    boolean existsByProjectCode(String projectCode);
    Optional<PmoProject> findByProjectCodeAndAcquisitionIdAndSource(String projectCode, String acquisitionId,
                                                                    String source);
    List<PmoProject> findByParent_IdAndDeletedAtIsNull(UUID parentId);
    List<PmoProject> findByDeletedAtIsNullOrderByCreatedAtDesc();
    @Query("select p from PmoProject p where p.deletedAt is null and (:q is null or lower(p.projectCode) like lower(concat('%', :q, '%')) or lower(p.name) like lower(concat('%', :q, '%'))) and (:level is null or p.level = :level)")
    Page<PmoProject> search(@Param("q") String q, @Param("level") ProjectLevel level, Pageable pageable);
}
