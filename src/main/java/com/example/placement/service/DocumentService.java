package com.example.placement.service;

import com.example.placement.domain.StudentDocument;
import com.example.placement.domain.UserAccount;
import com.example.placement.exception.NotFoundException;
import com.example.placement.repository.StudentDocumentRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {
    private static final List<String> ALLOWED_EXTENSIONS = List.of("pdf", "doc", "docx");
    private final AccountService accounts;
    private final StudentDocumentRepository documents;
    private final Path uploadDirectory;

    public DocumentService(AccountService accounts, StudentDocumentRepository documents,
                           @Value("${app.uploads.directory}") String uploadDirectory) {
        this.accounts = accounts;
        this.documents = documents;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Transactional
    public StudentDocument upload(String email, MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("The uploaded file is empty");
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("The uploaded file must have a name");
        }
        String safeName = Path.of(originalName).getFileName().toString();
        int extensionIndex = safeName.lastIndexOf('.');
        String extension = extensionIndex < 0 ? "" : safeName.substring(extensionIndex + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only PDF, DOC, and DOCX files are allowed");
        }

        Files.createDirectories(uploadDirectory);
        String storageName = UUID.randomUUID() + "." + extension;
        Path target = uploadDirectory.resolve(storageName).normalize();
        if (!target.getParent().equals(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid file name");
        }
        file.transferTo(target);
        try {
            UserAccount student = accounts.requireByEmail(email);
            return documents.save(new StudentDocument(student, safeName, storageName,
                    file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                    file.getSize()));
        } catch (RuntimeException exception) {
            Files.deleteIfExists(target);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> list(String email) {
        return documents.findAllByStudentEmailIgnoreCaseOrderByUploadedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public StudentDocument requireOwnedDocument(String email, Long id) {
        return documents.findByIdAndStudentEmailIgnoreCase(id, email)
                .orElseThrow(() -> new NotFoundException("Document not found"));
    }

    public Resource load(StudentDocument document) {
        Path file = uploadDirectory.resolve(document.getStorageName()).normalize();
        if (!file.getParent().equals(uploadDirectory) || !Files.isRegularFile(file)) {
            throw new NotFoundException("Document file not found");
        }
        return new FileSystemResource(file);
    }

    @Transactional
    public void delete(String email, Long id) throws IOException {
        StudentDocument document = requireOwnedDocument(email, id);
        Files.deleteIfExists(uploadDirectory.resolve(document.getStorageName()).normalize());
        documents.delete(document);
    }
}
