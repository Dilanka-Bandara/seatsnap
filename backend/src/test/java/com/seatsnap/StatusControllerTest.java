package com.seatsnap;

import com.seatsnap.common.config.ApplicationConfig;
import com.seatsnap.common.security.SecurityConfig;
import com.seatsnap.common.web.StatusController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StatusController.class)
@Import({SecurityConfig.class, ApplicationConfig.class})
@ActiveProfiles("dev")
class StatusControllerTest {
    @Autowired MockMvc mvc;

    @Test void status_anonymous_returnsFoundation() throws Exception {
        mvc.perform(get("/api/status")).andExpect(status().isOk())
            .andExpect(jsonPath("$.stage").value("foundation"))
            .andExpect(header().exists("X-Request-ID"));
    }
    @Test void protectedRoute_anonymous_returnsUnauthorized() throws Exception {
        mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());
    }
    @Test void post_withoutCsrf_returnsForbidden() throws Exception {
        mvc.perform(post("/api/bookings")).andExpect(status().isForbidden());
    }
    @Test void csrf_anonymous_returnsToken() throws Exception {
        mvc.perform(get("/api/csrf")).andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());
    }
    @Test void cors_unknownOrigin_returnsForbidden() throws Exception {
        mvc.perform(options("/api/status").header("Origin", "https://untrusted.example")
            .header("Access-Control-Request-Method", "GET")).andExpect(status().isForbidden());
    }
}
