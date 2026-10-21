package com.example.placement.controller;

import com.example.placement.dto.DashboardStats;
import com.example.placement.service.PlacementService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final PlacementService placementService;

    public DashboardController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping("/stats")
    public DashboardStats stats(Authentication auth) {
        boolean officer = auth.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_PLACEMENT_OFFICER"));
        return placementService.dashboard(auth.getName(), officer);
    }
}
