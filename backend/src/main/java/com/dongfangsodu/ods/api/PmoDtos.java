package com.dongfangsodu.ods.api;

import com.dongfangsodu.ods.domain.ProjectLevel;
import com.dongfangsodu.ods.domain.RiskStatus;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class PmoDtos {
    private PmoDtos() {
    }

    public record CreatePmoRequest(@NotBlank @Size(max = 80) String projectCode,
                                   @NotBlank @Size(max = 200) String name,
                                   @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal capacity,
                                   @Size(max = 80) String acquisitionId) {
    }

    public record CreateChildRequest(@NotBlank @Size(max = 80) String projectCode,
                                     @NotBlank @Size(max = 200) String name,
                                     @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal capacity) {
    }

    public record UpdatePmoRequest(@NotBlank @Size(max = 200) String name,
                                   @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal capacity,
                                   RiskStatus riskStatus,
                                   String mprEscalation, boolean keyProject, boolean highlightProject) {
    }

    public record PmoResponse(UUID id, String projectCode, String name, ProjectLevel level, UUID parentId,
                              String acquisitionId, BigDecimal capacity, RiskStatus riskStatus,
                              String mprEscalation, boolean keyProject, boolean highlightProject,
                              String source, Instant deletedAt, String deletedBy) {
    }
}
