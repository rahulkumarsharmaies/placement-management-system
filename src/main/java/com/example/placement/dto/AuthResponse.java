package com.example.placement.dto;

import com.example.placement.domain.Role;

public record AuthResponse(String token, String tokenType, Long userId, String fullName, String email, Role role) {}
