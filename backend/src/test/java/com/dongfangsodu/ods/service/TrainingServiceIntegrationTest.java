package com.dongfangsodu.ods.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dongfangsodu.ods.api.TrainingDtos.CompleteCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.CreateCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.UpdateCourseRequest;
import com.dongfangsodu.ods.domain.TrainingStatus;
import com.dongfangsodu.ods.exception.BusinessRuleException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TrainingServiceIntegrationTest {
    private static final String OWNER = "course-owner";

    @Autowired
    private TrainingService service;

    @Test
    void publishRequiresTrainerAndTrainees() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        var created = service.create(new CreateCourseRequest("ODS training", start,
                start.plus(1, ChronoUnit.HOURS), null, "EDS Academy", null, "EDS", null, null), OWNER);

        assertThatThrownBy(() -> service.publish(created.id(), OWNER, false))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void completeDraftCourseIsRejectedByStateMachine() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        var created = service.create(new CreateCourseRequest("ODS training", start,
                start.plus(1, ChronoUnit.HOURS), "Trainer", "EDS Academy", "Team", "EDS", null, null), OWNER);

        assertThat(created.status()).isEqualTo(TrainingStatus.DRAFT);
        assertThatThrownBy(() -> service.complete(created.id(), new CompleteCourseRequest(false, null),
                OWNER, false))
                .isInstanceOf(com.dongfangsodu.ods.exception.ConflictException.class);
    }

    @Test
    void createPersistsAuthenticatedUsernameAsOwner() {
        var created = service.create(publishableRequest("Owned course"), OWNER);

        assertThat(created.ownerUsername()).isEqualTo(OWNER);
        assertThat(service.list(null)).extracting(response -> response.ownerUsername()).contains(OWNER);
    }

    @Test
    void trainerCannotMaintainAnotherOwnersCourse() {
        var created = service.create(publishableRequest("Restricted course"), OWNER);
        UpdateCourseRequest update = updateRequest("Unauthorized update");

        assertThatThrownBy(() -> service.update(created.id(), update, "other-trainer", false))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.publish(created.id(), "other-trainer", false))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.unpublish(created.id(), "other-trainer", false))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.cancel(created.id(), "other-trainer", false))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.complete(created.id(), new CompleteCourseRequest(true,
                new BigDecimal("90.00")), "other-trainer", false))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void coordinatorAndAdminCanMaintainAnyCourse() {
        var created = service.create(publishableRequest("Shared course"), OWNER);

        var updated = service.update(created.id(), updateRequest("Coordinator update"), "coordinator", true);
        assertThat(updated.topic()).isEqualTo("Coordinator update");
        assertThat(service.publish(created.id(), "admin", true).status()).isEqualTo(TrainingStatus.PUBLISHED);
        assertThat(service.unpublish(created.id(), "coordinator", true).status()).isEqualTo(TrainingStatus.DRAFT);
        service.publish(created.id(), "admin", true);
        assertThat(service.complete(created.id(), new CompleteCourseRequest(true, new BigDecimal("95.00")),
                "coordinator", true).status()).isEqualTo(TrainingStatus.COMPLETED);

        var cancellable = service.create(publishableRequest("Cancellable course"), OWNER);
        assertThat(service.cancel(cancellable.id(), "admin", true).status()).isEqualTo(TrainingStatus.CANCELLED);
    }

    private CreateCourseRequest publishableRequest(String topic) {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return new CreateCourseRequest(topic, start, start.plus(1, ChronoUnit.HOURS), "Trainer",
                "EDS Academy", "Team", "EDS", null, "Course description");
    }

    private UpdateCourseRequest updateRequest(String topic) {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        return new UpdateCourseRequest(topic, start, start.plus(1, ChronoUnit.HOURS), "Trainer", "Team",
                "EDS", null, "Updated description", null);
    }
}
