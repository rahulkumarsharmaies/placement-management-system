package com.example.placement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProfileUpdateRequest(
        @Size(min = 1, max = 120) String fullName,
        @Size(max = 120) String degree,
        @Min(2000) @Max(2100) Integer graduationYear,
        @DecimalMin("0.00") @DecimalMax("10.00") BigDecimal cgpa,
        @Size(max = 30) String phone) {}
