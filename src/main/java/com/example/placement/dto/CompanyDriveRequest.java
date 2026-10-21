package com.example.placement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CompanyDriveRequest(
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 150) String jobTitle,
        @Size(max = 4000) String description,
        @Size(max = 200) String location,
        @DecimalMin("0.00") BigDecimal packageLpa,
        @DecimalMin("0.00") @DecimalMax("10.00") BigDecimal minimumCgpa,
        @Size(max = 120) String requiredDegree,
        @Min(2000) @Max(2100) Integer graduationYearFrom,
        @Min(2000) @Max(2100) Integer graduationYearTo,
        LocalDate applicationDeadline) {}
