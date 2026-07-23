package com.dongfangsodu.ods.api;

import java.util.List;

public final class MarketDtos {
    private MarketDtos() {
    }

    public record OemSales(String oem, int volume, double marketShare, Double shareChange) {
    }

    public record SalesDistribution(int year, int month, int totalVolume, List<OemSales> oems) {
    }

    public record AdasLevelSales(String adasLevel, int volume, double marketShare) {
    }

    public record AdasDistribution(boolean dataAvailable, String message, List<AdasLevelSales> items) {
    }
}
