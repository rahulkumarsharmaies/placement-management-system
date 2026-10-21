package com.example.placement.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
public class CompanyDrive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;
    @Column(nullable = false)
    private String jobTitle;
    private String description;
    private String location;
    private BigDecimal packageLpa;
    private BigDecimal minimumCgpa;
    private String requiredDegree;
    private Integer graduationYearFrom;
    private Integer graduationYearTo;
    private LocalDate applicationDeadline;

    @ManyToOne(optional = false)
    private UserAccount createdBy;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected CompanyDrive() {}

    public CompanyDrive(String companyName, String jobTitle, String description, String location,
                        BigDecimal packageLpa, BigDecimal minimumCgpa, String requiredDegree,
                        Integer graduationYearFrom, Integer graduationYearTo,
                        LocalDate applicationDeadline, UserAccount createdBy) {
        this.companyName = companyName;
        this.jobTitle = jobTitle;
        this.description = description;
        this.location = location;
        this.packageLpa = packageLpa;
        this.minimumCgpa = minimumCgpa;
        this.requiredDegree = requiredDegree;
        this.graduationYearFrom = graduationYearFrom;
        this.graduationYearTo = graduationYearTo;
        this.applicationDeadline = applicationDeadline;
        this.createdBy = createdBy;
    }

    public void update(String companyName, String jobTitle, String description, String location,
                       BigDecimal packageLpa, BigDecimal minimumCgpa, String requiredDegree,
                       Integer graduationYearFrom, Integer graduationYearTo, LocalDate applicationDeadline) {
        this.companyName = companyName;
        this.jobTitle = jobTitle;
        this.description = description;
        this.location = location;
        this.packageLpa = packageLpa;
        this.minimumCgpa = minimumCgpa;
        this.requiredDegree = requiredDegree;
        this.graduationYearFrom = graduationYearFrom;
        this.graduationYearTo = graduationYearTo;
        this.applicationDeadline = applicationDeadline;
    }

    public void setActive(boolean active) { this.active = active; }

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public String getJobTitle() { return jobTitle; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public BigDecimal getPackageLpa() { return packageLpa; }
    public BigDecimal getMinimumCgpa() { return minimumCgpa; }
    public String getRequiredDegree() { return requiredDegree; }
    public Integer getGraduationYearFrom() { return graduationYearFrom; }
    public Integer getGraduationYearTo() { return graduationYearTo; }
    public LocalDate getApplicationDeadline() { return applicationDeadline; }
    public UserAccount getCreatedBy() { return createdBy; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
