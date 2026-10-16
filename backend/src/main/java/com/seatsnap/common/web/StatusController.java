package com.seatsnap.common.web;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {
    public record StatusResponse(String name, String stage, String message) {}
    public record CsrfResponse(String headerName, String token) {}

    @Operation(summary = "Describe the current implementation stage (not infrastructure health)")
    @GetMapping("/api/status")
    public StatusResponse status() {
        return new StatusResponse("SeatSnap", "foundation", "Booking features are under construction.");
    }

    @Operation(summary = "Obtain a CSRF token for cookie-authenticated requests")
    @GetMapping("/api/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }
}
