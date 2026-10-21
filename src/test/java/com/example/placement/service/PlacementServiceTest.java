package com.example.placement.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.placement.domain.CompanyDrive;
import com.example.placement.domain.Role;
import com.example.placement.domain.UserAccount;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class PlacementServiceTest {
    private final PlacementService service = new PlacementService(null, null, null, null);
    private final UserAccount officer = new UserAccount(
            "Officer", "officer@example.edu", "hash", Role.PLACEMENT_OFFICER,
            null, null, null, null);

    @Test
    void allowsStudentWhoMatchesAllEligibilityCriteria() {
        UserAccount student = student("Computer Science", 2027, "8.2");
        CompanyDrive drive = drive("Computer Science", 2026, 2028, "7.0", LocalDate.now().plusDays(5));

        assertTrue(service.isEligible(student, drive));
    }

    @Test
    void rejectsStudentBelowMinimumCgpa() {
        UserAccount student = student("Computer Science", 2027, "6.9");
        CompanyDrive drive = drive("Computer Science", 2026, 2028, "7.0", LocalDate.now().plusDays(5));

        assertFalse(service.isEligible(student, drive));
    }

    @Test
    void requiresProfileFieldsOnlyWhenDriveUsesThoseCriteria() {
        UserAccount student = student(null, null, null);
        CompanyDrive drive = drive(null, null, null, null, LocalDate.now().plusDays(5));

        assertTrue(service.isEligible(student, drive));
    }

    @Test
    void rejectsDrivePastItsApplicationDeadline() {
        UserAccount student = student("Computer Science", 2027, "8.2");
        CompanyDrive drive = drive("Computer Science", 2026, 2028, "7.0", LocalDate.now().minusDays(1));

        assertFalse(service.isEligible(student, drive));
    }

    private UserAccount student(String degree, Integer graduationYear, String cgpa) {
        return new UserAccount("Student", "student@example.edu", "hash", Role.STUDENT,
                degree, graduationYear, cgpa == null ? null : new BigDecimal(cgpa), null);
    }

    private CompanyDrive drive(String degree, Integer yearFrom, Integer yearTo,
                               String minimumCgpa, LocalDate deadline) {
        return new CompanyDrive("Example Co", "Engineer", null, null, null,
                minimumCgpa == null ? null : new BigDecimal(minimumCgpa), degree,
                yearFrom, yearTo, deadline, officer);
    }
}
