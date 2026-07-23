package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.TrainingDtos.CompleteCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.CourseResponse;
import com.dongfangsodu.ods.api.TrainingDtos.CreateCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.UpdateCourseRequest;
import com.dongfangsodu.ods.domain.TrainingCourse;
import com.dongfangsodu.ods.domain.TrainingStatus;
import com.dongfangsodu.ods.exception.BusinessRuleException;
import com.dongfangsodu.ods.exception.ConflictException;
import com.dongfangsodu.ods.exception.ResourceNotFoundException;
import com.dongfangsodu.ods.repository.TrainingCourseRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TrainingService {
    private final TrainingCourseRepository courses;

    public TrainingService(TrainingCourseRepository courses) {
        this.courses = courses;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> list(TrainingStatus status) {
        List<TrainingCourse> result = status == null
                ? courses.findAllByOrderByStartAtAsc()
                : courses.findByStatusOrderByStartAtAsc(status);
        return result.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CourseResponse create(CreateCourseRequest request, String ownerUsername) {
        validateDates(request.startAt(), request.endAt());
        TrainingCourse course = new TrainingCourse(request.topic(), request.startAt(), request.endAt(),
                request.trainer(), request.coordinator(), request.trainee(), request.trainingDept(),
                request.materialLocation(), request.description(), ownerUsername);
        return toResponse(courses.save(course));
    }

    @Transactional
    public CourseResponse update(UUID id, UpdateCourseRequest request, String username, boolean canMaintainAll) {
        TrainingCourse course = course(id);
        ensureCanMaintain(course, username, canMaintainAll);
        if (course.getStatus() == TrainingStatus.COMPLETED || course.getStatus() == TrainingStatus.CANCELLED) {
            throw new ConflictException("已完成或已取消的课程不能编辑");
        }
        validateDates(request.startAt(), request.endAt());
        course.update(request.topic(), request.startAt(), request.endAt(), request.trainer(), request.trainee(),
                request.trainingDept(), request.materialLocation(), request.description(), request.advancedEmail());
        return toResponse(course);
    }

    @Transactional
    public CourseResponse publish(UUID id, String username, boolean canMaintainAll) {
        TrainingCourse course = course(id);
        ensureCanMaintain(course, username, canMaintainAll);
        if (course.getStatus() != TrainingStatus.DRAFT) {
            throw new ConflictException("只有草稿课程可以发布");
        }
        if (!StringUtils.hasText(course.getTrainer()) || !StringUtils.hasText(course.getTrainee())) {
            throw new BusinessRuleException("发布课程前必须填写培训师和学员");
        }
        course.publish();
        return toResponse(course);
    }

    @Transactional
    public CourseResponse unpublish(UUID id, String username, boolean canMaintainAll) {
        TrainingCourse course = course(id);
        ensureCanMaintain(course, username, canMaintainAll);
        if (course.getStatus() != TrainingStatus.PUBLISHED) {
            throw new ConflictException("只有已发布课程可以取消发布");
        }
        course.unpublish();
        return toResponse(course);
    }

    @Transactional
    public CourseResponse cancel(UUID id, String username, boolean canMaintainAll) {
        TrainingCourse course = course(id);
        ensureCanMaintain(course, username, canMaintainAll);
        if (course.getStatus() == TrainingStatus.COMPLETED) {
            throw new ConflictException("已完成课程不能取消");
        }
        course.cancel();
        return toResponse(course);
    }

    @Transactional
    public CourseResponse complete(UUID id, CompleteCourseRequest request, String username, boolean canMaintainAll) {
        TrainingCourse course = course(id);
        ensureCanMaintain(course, username, canMaintainAll);
        if (course.getStatus() != TrainingStatus.PUBLISHED && course.getStatus() != TrainingStatus.INVITATION_SENT) {
            throw new ConflictException("只有已发布或已发送邀请的课程可以完成");
        }
        course.complete(request.materialUploaded(), request.participationRate());
        return toResponse(course);
    }

    private TrainingCourse course(UUID id) {
        return courses.findById(id).orElseThrow(() -> new ResourceNotFoundException("培训课程不存在"));
    }

    private void validateDates(java.time.Instant startAt, java.time.Instant endAt) {
        if (!endAt.isAfter(startAt)) {
            throw new BusinessRuleException("课程结束时间必须晚于开始时间");
        }
    }

    private void ensureCanMaintain(TrainingCourse course, String username, boolean canMaintainAll) {
        if (!canMaintainAll && !course.getOwnerUsername().equals(username)) {
            throw new AccessDeniedException("TRAINER 只能维护自己创建的课程");
        }
    }

    private CourseResponse toResponse(TrainingCourse course) {
        return new CourseResponse(course.getId(), course.getTopic(), course.getStartAt(), course.getEndAt(),
                course.getTrainer(), course.getCoordinator(), course.getTrainee(), course.getStatus(),
                course.getParticipationRate(), course.getTrainingDept(), course.getMaterialLocation(),
                course.getDescription(), course.getAdvancedEmail(), course.isMaterialUploaded(),
                course.getOwnerUsername());
    }
}
