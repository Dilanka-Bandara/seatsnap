package com.seatsnap.common.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(@NotBlank String frontendOrigin, @NotNull Duration holdDuration) {}
