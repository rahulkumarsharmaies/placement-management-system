package com.example.placement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record InterviewRequest(
        @Future Instant scheduledAt,
        @Size(max = 2048) String locationOrLink,
        @Size(max = 2000) String notes) {}
