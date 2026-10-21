package com.example.placement.controller;

import com.example.placement.domain.StudentDocument;
import com.example.placement.service.DocumentService;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@PreAuthorize("hasRole('STUDENT')")
public class DocumentController {
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentDocument upload(Authentication auth, @RequestParam("file") MultipartFile file) throws IOException {
        return documentService.upload(auth.getName(), file);
    }

    @GetMapping
    public List<StudentDocument> list(Authentication auth) {
        return documentService.list(auth.getName());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(Authentication auth, @PathVariable Long id) {
        StudentDocument document = documentService.requireOwnedDocument(auth.getName(), id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(document.getOriginalName(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(documentService.load(document));
    }

    @DeleteMapping("/{id}")
    public void delete(Authentication auth, @PathVariable Long id) throws IOException {
        documentService.delete(auth.getName(), id);
    }
}
