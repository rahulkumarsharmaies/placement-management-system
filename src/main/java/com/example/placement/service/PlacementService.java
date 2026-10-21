package com.example.placement.service;

import com.example.placement.domain.*;
import com.example.placement.dto.CompanyDriveRequest;
import com.example.placement.dto.DashboardStats;
import com.example.placement.dto.InterviewRequest;
import com.example.placement.dto.JobApplicationRequest;
import com.example.placement.exception.NotFoundException;
import com.example.placement.repository.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlacementService {
    private final AccountService accounts;
    private final JobApplicationRepository applications;
    private final CompanyDriveRepository drives;
    private final InterviewScheduleRepository interviews;

    public PlacementService(AccountService accounts, JobApplicationRepository applications,
                            CompanyDriveRepository drives, InterviewScheduleRepository interviews) {
        this.accounts = accounts;
        this.applications = applications;
        this.drives = drives;
        this.interviews = interviews;
    }

    @Transactional(readOnly = true)
    public List<JobApplication> applicationsFor(String email, boolean officer) {
        return officer ? applications.findAllByOrderByCreatedAtDesc()
                : applications.findAllByStudentEmailIgnoreCaseOrderByCreatedAtDesc(email);
    }

    @Transactional
    public JobApplication createApplication(String email, JobApplicationRequest request) {
        UserAccount student = accounts.requireByEmail(email);
        return applications.save(new JobApplication(student, request.companyName(), request.jobTitle(),
                request.portalUrl(), request.recruiterName(), request.recruiterEmail(),
                request.appliedDate() == null ? LocalDate.now() : request.appliedDate(),
                request.status() == null ? ApplicationStatus.APPLIED : request.status(), request.notes()));
    }

    @Transactional
    public JobApplication updateApplication(String email, Long id, JobApplicationRequest request, boolean officer) {
        JobApplication application = requireApplication(id, email, officer);
        application.update(request.companyName(), request.jobTitle(), request.portalUrl(),
                request.recruiterName(), request.recruiterEmail(),
                request.appliedDate() == null ? application.getAppliedDate() : request.appliedDate(),
                request.status() == null ? application.getStatus() : request.status(), request.notes());
        return application;
    }

    @Transactional
    public void deleteApplication(String email, Long id, boolean officer) {
        JobApplication application = requireApplication(id, email, officer);
        interviews.deleteAllByApplication_Id(application.getId());
        applications.delete(application);
    }

    @Transactional(readOnly = true)
    public JobApplication requireApplication(Long id, String email, boolean officer) {
        if (officer) {
            return applications.findById(id)
                    .orElseThrow(() -> new NotFoundException("Application not found"));
        }
        return applications.findByIdAndStudentEmailIgnoreCase(id, email)
                .orElseThrow(() -> new NotFoundException("Application not found"));
    }

    @Transactional
    public CompanyDrive createDrive(String email, CompanyDriveRequest request) {
        validateDriveRequest(request);
        UserAccount officer = accounts.requireByEmail(email);
        return drives.save(new CompanyDrive(request.companyName(), request.jobTitle(), request.description(),
                request.location(), request.packageLpa(), request.minimumCgpa(), request.requiredDegree(),
                request.graduationYearFrom(), request.graduationYearTo(), request.applicationDeadline(), officer));
    }

    @Transactional
    public CompanyDrive updateDrive(Long id, CompanyDriveRequest request) {
        validateDriveRequest(request);
        CompanyDrive drive = requireDrive(id);
        drive.update(request.companyName(), request.jobTitle(), request.description(), request.location(),
                request.packageLpa(), request.minimumCgpa(), request.requiredDegree(),
                request.graduationYearFrom(), request.graduationYearTo(), request.applicationDeadline());
        return drive;
    }

    @Transactional
    public CompanyDrive setDriveActive(Long id, boolean active) {
        CompanyDrive drive = requireDrive(id);
        drive.setActive(active);
        return drive;
    }

    @Transactional(readOnly = true)
    public List<CompanyDrive> drivesFor(String email, boolean officer, boolean eligibleOnly) {
        if (officer) return drives.findAllByOrderByCreatedAtDesc();
        UserAccount student = accounts.requireByEmail(email);
        return drives.findAllByActiveTrueOrderByApplicationDeadlineAsc().stream()
                .filter(drive -> drive.getApplicationDeadline() == null
                        || !drive.getApplicationDeadline().isBefore(LocalDate.now()))
                .filter(drive -> !eligibleOnly || isEligible(student, drive))
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyDrive requireDrive(Long id) {
        return drives.findById(id).orElseThrow(() -> new NotFoundException("Company drive not found"));
    }

    @Transactional(readOnly = true)
    public boolean isEligible(UserAccount student, CompanyDrive drive) {
        if (!drive.isActive() || (drive.getApplicationDeadline() != null
                && drive.getApplicationDeadline().isBefore(LocalDate.now()))) return false;
        if (drive.getMinimumCgpa() != null
                && (student.getCgpa() == null || student.getCgpa().compareTo(drive.getMinimumCgpa()) < 0)) return false;
        if ((drive.getGraduationYearFrom() != null || drive.getGraduationYearTo() != null)
                && student.getGraduationYear() == null) return false;
        if (drive.getGraduationYearFrom() != null && student.getGraduationYear() < drive.getGraduationYearFrom()) return false;
        if (drive.getGraduationYearTo() != null && student.getGraduationYear() > drive.getGraduationYearTo()) return false;
        return drive.getRequiredDegree() == null || drive.getRequiredDegree().isBlank()
                || (student.getDegree() != null && student.getDegree().equalsIgnoreCase(drive.getRequiredDegree()));
    }

    private void validateDriveRequest(CompanyDriveRequest request) {
        if (request.graduationYearFrom() != null && request.graduationYearTo() != null
                && request.graduationYearFrom() > request.graduationYearTo()) {
            throw new IllegalArgumentException("Graduation year range is invalid");
        }
    }

    @Transactional
    public InterviewSchedule scheduleInterview(String email, Long applicationId, InterviewRequest request, boolean officer) {
        JobApplication application = requireApplication(applicationId, email, officer);
        if (request.scheduledAt() == null || !request.scheduledAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("Interview time must be in the future");
        }
        return interviews.save(new InterviewSchedule(application, request.scheduledAt(),
                request.locationOrLink(), request.notes()));
    }

    @Transactional(readOnly = true)
    public List<InterviewSchedule> interviewsFor(String email, boolean officer) {
        return officer ? interviews.findAll().stream()
                .sorted((left, right) -> left.getScheduledAt().compareTo(right.getScheduledAt())).toList()
                : interviews.findAllForStudent(email);
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboard(String email, boolean officer) {
        List<JobApplication> rows = officer ? applications.findAll() : applications.findAllByStudentEmailIgnoreCaseOrderByCreatedAtDesc(email);
        Map<String, Long> byStatus = new LinkedHashMap<>();
        Arrays.stream(ApplicationStatus.values()).forEach(status ->
                byStatus.put(status.name(), rows.stream().filter(app -> app.getStatus() == status).count()));
        long offerCount = byStatus.get(ApplicationStatus.OFFER.name());
        long interviewCount = officer
                ? interviews.count()
                : interviews.findAllForStudent(email).size();
        long activeDriveCount = drives.findAllByActiveTrueOrderByApplicationDeadlineAsc().size();
        return new DashboardStats(rows.size(), offerCount, interviewCount, activeDriveCount, byStatus);
    }
}
