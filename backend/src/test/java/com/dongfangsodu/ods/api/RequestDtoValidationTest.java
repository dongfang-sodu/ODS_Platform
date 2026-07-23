package com.dongfangsodu.ods.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.dongfangsodu.ods.api.AuthDtos.LoginRequest;
import com.dongfangsodu.ods.api.ContentDtos.VideoRequest;
import com.dongfangsodu.ods.api.PmoDtos.CreateChildRequest;
import com.dongfangsodu.ods.api.PmoDtos.CreatePmoRequest;
import com.dongfangsodu.ods.api.PmoDtos.UpdatePmoRequest;
import com.dongfangsodu.ods.api.ProjectDtos.CreateProjectRequest;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateAcquisitionStatusRequest;
import com.dongfangsodu.ods.api.ProjectDtos.UpdateProjectRequest;
import com.dongfangsodu.ods.api.TrainingDtos.CompleteCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.CreateCourseRequest;
import com.dongfangsodu.ods.api.TrainingDtos.UpdateCourseRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class RequestDtoValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void varcharBackedFieldsRejectValuesBeyondSchemaLimits() {
        Instant start = Instant.parse("2026-08-01T08:00:00Z");
        Instant end = start.plusSeconds(3600);

        assertInvalidProperties(new LoginRequest(text(101), text(256)), "username", "password");
        assertInvalidProperties(new VideoRequest(text(251), text(121), null, text(501), text(501), 0, true),
                "title", "category", "videoUrl", "thumbnailUrl");
        assertInvalidProperties(new CreatePmoRequest(text(81), text(201), BigDecimal.ONE, text(81)),
                "projectCode", "name", "acquisitionId");
        assertInvalidProperties(new CreateChildRequest(text(81), text(201), BigDecimal.ONE),
                "projectCode", "name");
        assertInvalidProperties(new UpdatePmoRequest(text(201), BigDecimal.ONE, null, null, false, false),
                "name");
        assertInvalidProperties(new CreateProjectRequest(text(81), text(201), null, text(151), text(151),
                        text(201), text(121), LocalDate.of(2026, 12, 31), text(121)),
                "code", "name", "product", "owner", "team", "qg4Reference", "acquisitionDepartment");
        assertInvalidProperties(new UpdateProjectRequest(text(201), null, text(151), text(151), text(201),
                        LocalDate.of(2026, 12, 31), null),
                "name", "product", "owner", "team");
        assertInvalidProperties(new UpdateAcquisitionStatusRequest(text(81), text(81), text(81)),
                "offlineStatus", "committeeStatus", "salesforceStatus");
        assertInvalidProperties(new CreateCourseRequest(text(251), start, end, text(151), text(151), null,
                        text(151), text(501), null),
                "topic", "trainer", "coordinator", "trainingDept", "materialLocation");
        assertInvalidProperties(new UpdateCourseRequest(text(251), start, end, text(151), null, text(151),
                        text(501), null, null),
                "topic", "trainer", "trainingDept", "materialLocation");
    }

    @Test
    void pmoCapacityMustBeNonNegativeAndFitNumericTwelveTwo() {
        assertInvalidProperties(new CreatePmoRequest("PMO-1", "Project", new BigDecimal("-0.01"), null),
                "capacity");
        assertInvalidProperties(new CreateChildRequest("PMO-2", "Project", new BigDecimal("10000000000.00")),
                "capacity");
        assertInvalidProperties(new UpdatePmoRequest("Project", new BigDecimal("1.001"), null, null, false, false),
                "capacity");
    }

    @Test
    void participationRateMustBeBetweenZeroAndOneHundredWithTwoDecimals() {
        assertInvalidProperties(new CompleteCourseRequest(true, new BigDecimal("-0.01")), "participationRate");
        assertInvalidProperties(new CompleteCourseRequest(true, new BigDecimal("100.01")), "participationRate");
        assertInvalidProperties(new CompleteCourseRequest(true, new BigDecimal("50.001")), "participationRate");

        assertThat(validator.validate(new CompleteCourseRequest(true, new BigDecimal("0.00")))).isEmpty();
        assertThat(validator.validate(new CompleteCourseRequest(true, new BigDecimal("100.00")))).isEmpty();
        assertThat(validator.validate(new CompleteCourseRequest(true, null))).isEmpty();
    }

    @Test
    void courseEndMustBeAfterStartForCreateAndUpdate() {
        Instant start = Instant.parse("2026-08-01T08:00:00Z");

        assertInvalidProperties(new CreateCourseRequest("Course", start, start, null, "Coordinator", null,
                "EDS", null, null), "dateRangeValid");
        assertInvalidProperties(new UpdateCourseRequest("Course", start, start.minusSeconds(1), null, null,
                "EDS", null, null, null), "dateRangeValid");
    }

    private void assertInvalidProperties(Object request, String... propertyNames) {
        Set<String> invalidProperties = validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
        assertThat(invalidProperties).contains(propertyNames);
    }

    private String text(int length) {
        return "x".repeat(length);
    }
}
