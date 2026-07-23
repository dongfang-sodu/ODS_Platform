package com.dongfangsodu.ods.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicle_sales_records")
public class VehicleSalesRecord extends BaseEntity {
    @Column(nullable = false)
    private int reportYear;
    @Column(nullable = false)
    private int reportMonth;
    @Column(nullable = false, length = 150)
    private String oem;
    @Column(length = 150)
    private String model;
    @Column(nullable = false)
    private int salesVolume;
    @Column(length = 50)
    private String adasLevel;
    @Column(nullable = false, length = 40)
    private String source;

    protected VehicleSalesRecord() {
    }

    public VehicleSalesRecord(int reportYear, int reportMonth, String oem, String model, int salesVolume,
                              String adasLevel, String source) {
        this.reportYear = reportYear;
        this.reportMonth = reportMonth;
        this.oem = oem;
        this.model = model;
        this.salesVolume = salesVolume;
        this.adasLevel = adasLevel;
        this.source = source;
    }

    public int getReportYear() { return reportYear; }
    public int getReportMonth() { return reportMonth; }
    public String getOem() { return oem; }
    public String getModel() { return model; }
    public int getSalesVolume() { return salesVolume; }
    public String getAdasLevel() { return adasLevel; }
    public String getSource() { return source; }
}
