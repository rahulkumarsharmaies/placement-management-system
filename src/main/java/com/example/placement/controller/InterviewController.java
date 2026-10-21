package com.example.placement.controller;

import com.example.placement.domain.InterviewSchedule;
import com.example.placement.service.PlacementService;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {
    private final PlacementService placementService;

    public InterviewController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping
    public List<InterviewSchedule> list(Authentication auth) {
        boolean officer = auth.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_PLACEMENT_OFFICER"));
        return placementService.interviewsFor(auth.getName(), officer);
    }
}
