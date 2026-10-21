package com.example.placement.dto;

import com.example.placement.domain.ApplicationStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record JobApplicationRequest(
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 150) String jobTitle,
        @Size(max = 2048) String portalUrl,
        @Size(max = 120) String recruiterName,
        @Email @Size(max = 255) String recruiterEmail,
        LocalDate appliedDate,
        ApplicationStatus status,
        @Size(max = 2000) String notes) {}
