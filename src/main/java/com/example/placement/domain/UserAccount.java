package com.example.placement.domain;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String degree;
    private Integer graduationYear;
    private BigDecimal cgpa;
    private String phone;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected UserAccount() {}

    public UserAccount(String fullName, String email, String passwordHash, Role role,
                       String degree, Integer graduationYear, BigDecimal cgpa, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.degree = degree;
        this.graduationYear = graduationYear;
        this.cgpa = cgpa;
        this.phone = phone;
    }

    public void updateProfile(String fullName, String degree, Integer graduationYear,
                              BigDecimal cgpa, String phone) {
        if (fullName != null) this.fullName = fullName;
        if (degree != null) this.degree = degree;
        if (graduationYear != null) this.graduationYear = graduationYear;
        if (cgpa != null) this.cgpa = cgpa;
        if (phone != null) this.phone = phone;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public String getDegree() { return degree; }
    public Integer getGraduationYear() { return graduationYear; }
    public BigDecimal getCgpa() { return cgpa; }
    public String getPhone() { return phone; }
    public Instant getCreatedAt() { return createdAt; }
}
