package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.Project;
import com.dongfangsodu.ods.domain.ProjectStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByCode(String code);
    Optional<Project> findByDedupeKey(String dedupeKey);

    @Query("select p from Project p where (:q is null or lower(p.code) like lower(concat('%', :q, '%')) " +
           "or lower(p.name) like lower(concat('%', :q, '%')) or lower(p.product) like lower(concat('%', :q, '%'))) " +
           "and (:status is null or p.status = :status) and (:owner is null or lower(p.owner) like lower(concat('%', :owner, '%')))" )
    Page<Project> search(@Param("q") String q, @Param("status") ProjectStatus status,
                         @Param("owner") String owner, Pageable pageable);

    boolean existsByProductAndTeamAndMilestoneDate(String product, String team, LocalDate milestoneDate);

    List<Project> findTop10ByOrderByCreatedAtDesc();
}
