package com.example.placement.repository;

import com.example.placement.domain.JobApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findAllByStudentEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<JobApplication> findByIdAndStudentEmailIgnoreCase(Long id, String email);
    List<JobApplication> findAllByOrderByCreatedAtDesc();
    long countByStatus(com.example.placement.domain.ApplicationStatus status);
    long countByStudentEmailIgnoreCase(String email);
}
