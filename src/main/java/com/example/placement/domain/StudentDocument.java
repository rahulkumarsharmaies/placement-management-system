package com.example.placement.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class StudentDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private UserAccount student;

    @Column(nullable = false)
    private String originalName;
    @Column(nullable = false, unique = true)
    private String storageName;
    @Column(nullable = false)
    private String contentType;
    @Column(nullable = false)
    private long size;
    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    protected StudentDocument() {}

    public StudentDocument(UserAccount student, String originalName, String storageName, String contentType, long size) {
        this.student = student;
        this.originalName = originalName;
        this.storageName = storageName;
        this.contentType = contentType;
        this.size = size;
    }

    public Long getId() { return id; }
    public UserAccount getStudent() { return student; }
    public String getOriginalName() { return originalName; }
    public String getStorageName() { return storageName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public Instant getUploadedAt() { return uploadedAt; }
}
