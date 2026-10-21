package com.example.placement.repository;

import com.example.placement.domain.StudentDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentDocumentRepository extends JpaRepository<StudentDocument, Long> {
    List<StudentDocument> findAllByStudentEmailIgnoreCaseOrderByUploadedAtDesc(String email);
    Optional<StudentDocument> findByIdAndStudentEmailIgnoreCase(Long id, String email);
}
