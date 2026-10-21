package com.example.placement.controller;

import com.example.placement.domain.CompanyDrive;
import com.example.placement.dto.CompanyDriveRequest;
import com.example.placement.service.AccountService;
import com.example.placement.service.PlacementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drives")
public class CompanyDriveController {
    private final PlacementService placementService;
    private final AccountService accountService;

    public CompanyDriveController(PlacementService placementService, AccountService accountService) {
        this.placementService = placementService;
        this.accountService = accountService;
    }

    @GetMapping
    public List<CompanyDrive> list(Authentication auth) {
        boolean officer = isOfficer(auth);
        return placementService.drivesFor(auth.getName(), officer, false);
    }

    @GetMapping("/eligible")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CompanyDrive> eligible(Authentication auth) {
        return placementService.drivesFor(auth.getName(), false, true);
    }

    @GetMapping("/{id}")
    public CompanyDrive get(@PathVariable Long id) {
        return placementService.requireDrive(id);
    }

    @GetMapping("/{id}/eligibility")
    @PreAuthorize("hasRole('STUDENT')")
    public EligibilityResponse checkEligibility(Authentication auth, @PathVariable Long id) {
        var student = accountService.requireByEmail(auth.getName());
        var drive = placementService.requireDrive(id);
        return new EligibilityResponse(drive.getId(), placementService.isEligible(student, drive));
    }

    @PostMapping
    @PreAuthorize("hasRole('PLACEMENT_OFFICER')")
    public CompanyDrive create(Authentication auth, @Valid @RequestBody CompanyDriveRequest request) {
        return placementService.createDrive(auth.getName(), request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLACEMENT_OFFICER')")
    public CompanyDrive update(@PathVariable Long id, @Valid @RequestBody CompanyDriveRequest request) {
        return placementService.updateDrive(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('PLACEMENT_OFFICER')")
    public CompanyDrive setActive(@PathVariable Long id, @RequestParam("active") boolean active) {
        return placementService.setDriveActive(id, active);
    }

    private boolean isOfficer(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_PLACEMENT_OFFICER"));
    }

    public record EligibilityResponse(Long driveId, boolean eligible) {}
}
