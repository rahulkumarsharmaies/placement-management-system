package com.example.placement.controller;

import com.example.placement.domain.InterviewSchedule;
import com.example.placement.domain.JobApplication;
import com.example.placement.dto.InterviewRequest;
import com.example.placement.dto.JobApplicationRequest;
import com.example.placement.service.PlacementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {
    private final PlacementService placementService;

    public JobApplicationController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping
    public List<JobApplication> list(Authentication auth) {
        return placementService.applicationsFor(auth.getName(), isOfficer(auth));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public JobApplication create(Authentication auth, @Valid @RequestBody JobApplicationRequest request) {
        return placementService.createApplication(auth.getName(), request);
    }

    @PutMapping("/{id}")
    public JobApplication update(Authentication auth, @PathVariable Long id,
                                 @Valid @RequestBody JobApplicationRequest request) {
        return placementService.updateApplication(auth.getName(), id, request, isOfficer(auth));
    }

    @DeleteMapping("/{id}")
    public void delete(Authentication auth, @PathVariable Long id) {
        placementService.deleteApplication(auth.getName(), id, isOfficer(auth));
    }

    @PostMapping("/{id}/interviews")
    public InterviewSchedule scheduleInterview(Authentication auth, @PathVariable Long id,
                                               @Valid @RequestBody InterviewRequest request) {
        return placementService.scheduleInterview(auth.getName(), id, request, isOfficer(auth));
    }

    private boolean isOfficer(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_PLACEMENT_OFFICER"));
    }
}
