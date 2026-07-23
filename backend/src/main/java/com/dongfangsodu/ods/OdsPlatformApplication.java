package com.dongfangsodu.ods;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OdsPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(OdsPlatformApplication.class, args);
    }
}
