package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.TrainingStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class TrainingDtos {
    private TrainingDtos() {
    }

    public record CreateCourseRequest(@NotBlank @Size(max = 250) String topic,
                                      @NotNull Instant startAt, @NotNull Instant endAt,
                                      @Size(max = 150) String trainer,
                                      @NotBlank @Size(max = 150) String coordinator, String trainee,
                                      @NotBlank @Size(max = 150) String trainingDept,
                                      @Size(max = 500) String materialLocation,
                                      String description) {
        @AssertTrue(message = "endAt must be after startAt")
        public boolean isDateRangeValid() {
            return startAt == null || endAt == null || endAt.isAfter(startAt);
        }
    }

    public record UpdateCourseRequest(@NotBlank @Size(max = 250) String topic,
                                      @NotNull Instant startAt, @NotNull Instant endAt,
                                      @Size(max = 150) String trainer, String trainee,
                                      @NotBlank @Size(max = 150) String trainingDept,
                                      @Size(max = 500) String materialLocation,
                                      String description, String advancedEmail) {
        @AssertTrue(message = "endAt must be after startAt")
        public boolean isDateRangeValid() {
            return startAt == null || endAt == null || endAt.isAfter(startAt);
        }
    }

    public record CompleteCourseRequest(
            boolean materialUploaded,
            @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2)
            BigDecimal participationRate) {
    }

    public record CourseResponse(UUID id, String topic, Instant startAt, Instant endAt, String trainer,
                                 String coordinator, String trainee, TrainingStatus status,
                                 BigDecimal participationRate, String trainingDept, String materialLocation,
                                 String description, String advancedEmail, boolean materialUploaded,
                                 String ownerUsername) {
    }
}
