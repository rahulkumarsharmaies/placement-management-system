package com.example.placement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Size(max = 120) String degree,
        @Min(2000) @Max(2100) Integer graduationYear,
        @DecimalMin("0.00") @DecimalMax("10.00") BigDecimal cgpa,
        @Size(max = 30) String phone) {}
