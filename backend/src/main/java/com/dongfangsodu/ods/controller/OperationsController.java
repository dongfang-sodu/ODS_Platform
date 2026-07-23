package com.dongfangsodu.ods.controller;

import com.dongfangsodu.ods.api.ApiResponse;
import com.dongfangsodu.ods.api.MarketDtos.AdasDistribution;
import com.dongfangsodu.ods.api.MarketDtos.SalesDistribution;
import com.dongfangsodu.ods.service.MarketService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vehicle-market")
@Validated
public class OperationsController {
    private final MarketService market;

    public OperationsController(MarketService market) {
        this.market = market;
    }

    @GetMapping("/sales-distribution")
    public ApiResponse<SalesDistribution> salesDistribution(@RequestParam @Min(2000) @Max(2100) int year,
                                                             @RequestParam @Min(1) @Max(12) int month) {
        return ApiResponse.of(market.salesDistribution(year, month));
    }

    @GetMapping("/adas-distribution")
    public ApiResponse<AdasDistribution> adasDistribution(@RequestParam @Min(2000) @Max(2100) int year) {
        return ApiResponse.of(market.adasDistribution(year));
    }
}
