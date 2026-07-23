package com.dongfangsodu.ods.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.dongfangsodu.ods.domain.VehicleSalesRecord;
import com.dongfangsodu.ods.repository.VehicleSalesRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MarketServiceIntegrationTest {
    @Autowired
    private MarketService market;
    @Autowired
    private VehicleSalesRecordRepository records;

    @Test
    void aggregatesAvailableAdasDataByLevel() {
        records.save(new VehicleSalesRecord(2098, 1, "OEM A", "A1", 300, "L2", "TEST"));
        records.save(new VehicleSalesRecord(2098, 2, "OEM B", "B1", 200, "L2", "TEST"));
        records.save(new VehicleSalesRecord(2098, 2, "OEM C", "C1", 500, "L1", "TEST"));
        records.save(new VehicleSalesRecord(2098, 3, "OEM D", "D1", 900, null, "TEST"));

        var result = market.adasDistribution(2098);

        assertThat(result.dataAvailable()).isTrue();
        assertThat(result.items()).hasSize(2);
        assertThat(result.items()).allSatisfy(item -> {
            assertThat(item.volume()).isEqualTo(500);
            assertThat(item.marketShare()).isEqualTo(50.0);
        });
        assertThat(result.items()).extracting(item -> item.adasLevel())
                .containsExactlyInAnyOrder("L1", "L2");
    }

    @Test
    void reportsUnavailableWhenNoRecordHasAdasLevel() {
        records.save(new VehicleSalesRecord(2099, 1, "OEM A", "A1", 100, null, "TEST"));

        var result = market.adasDistribution(2099);

        assertThat(result.dataAvailable()).isFalse();
        assertThat(result.items()).isEmpty();
    }
}
