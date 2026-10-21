package com.example.placement.dto;

import java.util.Map;

public record DashboardStats(long totalApplications, long offers, long interviews, long activeDrives,
                             Map<String, Long> applicationsByStatus) {}
