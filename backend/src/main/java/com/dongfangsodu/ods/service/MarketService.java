package com.dongfangsodu.ods.service;

import com.dongfangsodu.ods.api.MarketDtos.AdasDistribution;
import com.dongfangsodu.ods.api.MarketDtos.AdasLevelSales;
import com.dongfangsodu.ods.api.MarketDtos.OemSales;
import com.dongfangsodu.ods.api.MarketDtos.SalesDistribution;
import com.dongfangsodu.ods.domain.VehicleSalesRecord;
import com.dongfangsodu.ods.repository.VehicleSalesRecordRepository;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketService {
    private final VehicleSalesRecordRepository records;

    public MarketService(VehicleSalesRecordRepository records) {
        this.records = records;
    }

    @Transactional(readOnly = true)
    public SalesDistribution salesDistribution(int year, int month) {
        YearMonth period = YearMonth.of(year, month);
        Map<String, Integer> current = aggregate(records.findByReportYearAndReportMonth(year, month));
        YearMonth previousPeriod = period.minusMonths(1);
        Map<String, Integer> previous = aggregate(records.findByReportYearAndReportMonth(
                previousPeriod.getYear(), previousPeriod.getMonthValue()));
        int currentTotal = current.values().stream().mapToInt(Integer::intValue).sum();
        int previousTotal = previous.values().stream().mapToInt(Integer::intValue).sum();
        List<OemSales> oems = new ArrayList<>();
        current.forEach((oem, volume) -> {
            double share = percentage(volume, currentTotal);
            Double change = previousTotal == 0 ? null : round(share - percentage(previous.getOrDefault(oem, 0), previousTotal));
            oems.add(new OemSales(oem, volume, share, change));
        });
        oems.sort(Comparator.comparingInt(OemSales::volume).reversed());
        return new SalesDistribution(year, month, currentTotal, oems);
    }

    @Transactional(readOnly = true)
    public AdasDistribution adasDistribution(int year) {
        Map<String, Integer> byLevel = new HashMap<>();
        records.findByReportYear(year).stream()
                .filter(record -> record.getAdasLevel() != null && !record.getAdasLevel().isBlank())
                .forEach(record -> byLevel.merge(record.getAdasLevel().trim(), record.getSalesVolume(), Integer::sum));
        if (byLevel.isEmpty()) {
            return new AdasDistribution(false, "当前数据源尚未提供 ADAS 等级，已按需求保留接口", List.of());
        }
        int classifiedVolume = byLevel.values().stream().mapToInt(Integer::intValue).sum();
        List<AdasLevelSales> items = byLevel.entrySet().stream()
                .map(entry -> new AdasLevelSales(entry.getKey(), entry.getValue(),
                        percentage(entry.getValue(), classifiedVolume)))
                .sorted(Comparator.comparingInt(AdasLevelSales::volume).reversed())
                .toList();
        return new AdasDistribution(true, "ADAS 等级分布按已标注销量统计", items);
    }

    private Map<String, Integer> aggregate(List<VehicleSalesRecord> values) {
        Map<String, Integer> result = new HashMap<>();
        values.forEach(record -> result.merge(record.getOem(), record.getSalesVolume(), Integer::sum));
        return result;
    }

    private double percentage(int value, int total) {
        return total == 0 ? 0 : round(value * 100.0 / total);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
