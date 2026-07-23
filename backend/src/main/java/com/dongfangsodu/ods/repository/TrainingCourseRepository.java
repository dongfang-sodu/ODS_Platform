package com.dongfangsodu.ods.repository;

import com.dongfangsodu.ods.domain.TrainingCourse;
import com.dongfangsodu.ods.domain.TrainingStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, UUID> {
    List<TrainingCourse> findByStatusOrderByStartAtAsc(TrainingStatus status);
    List<TrainingCourse> findAllByOrderByStartAtAsc();
}
