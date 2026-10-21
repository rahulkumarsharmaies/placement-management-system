package com.example.placement.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private UserAccount student;

    private String companyName;
    private String jobTitle;
    private String portalUrl;
    private String recruiterName;
    private String recruiterEmail;
    private LocalDate appliedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected JobApplication() {}

    public JobApplication(UserAccount student, String companyName, String jobTitle, String portalUrl,
                          String recruiterName, String recruiterEmail, LocalDate appliedDate,
                          ApplicationStatus status, String notes) {
        this.student = student;
        this.companyName = companyName;
        this.jobTitle = jobTitle;
        this.portalUrl = portalUrl;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
        this.appliedDate = appliedDate;
        this.status = status;
        this.notes = notes;
    }

    public void update(String companyName, String jobTitle, String portalUrl, String recruiterName,
                       String recruiterEmail, LocalDate appliedDate, ApplicationStatus status, String notes) {
        this.companyName = companyName;
        this.jobTitle = jobTitle;
        this.portalUrl = portalUrl;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
        this.appliedDate = appliedDate;
        this.status = status;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public UserAccount getStudent() { return student; }
    public String getCompanyName() { return companyName; }
    public String getJobTitle() { return jobTitle; }
    public String getPortalUrl() { return portalUrl; }
    public String getRecruiterName() { return recruiterName; }
    public String getRecruiterEmail() { return recruiterEmail; }
    public LocalDate getAppliedDate() { return appliedDate; }
    public ApplicationStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
}
