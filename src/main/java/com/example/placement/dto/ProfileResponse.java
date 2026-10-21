package com.example.placement.dto;

import com.example.placement.domain.Role;
import java.math.BigDecimal;

public record ProfileResponse(Long id, String fullName, String email, Role role,
                              String degree, Integer graduationYear, BigDecimal cgpa, String phone) {}
