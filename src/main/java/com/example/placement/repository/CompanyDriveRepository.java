package com.example.placement.repository;

import com.example.placement.domain.CompanyDrive;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyDriveRepository extends JpaRepository<CompanyDrive, Long> {
    List<CompanyDrive> findAllByActiveTrueOrderByApplicationDeadlineAsc();
    List<CompanyDrive> findAllByOrderByCreatedAtDesc();
}
