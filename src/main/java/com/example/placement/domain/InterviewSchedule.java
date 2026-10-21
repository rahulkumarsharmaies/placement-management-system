package com.example.placement.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class InterviewSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private JobApplication application;

    @Column(nullable = false)
    private Instant scheduledAt;
    private String locationOrLink;
    private String notes;
    @Column(nullable = false)
    private boolean reminderSent;

    protected InterviewSchedule() {}

    public InterviewSchedule(JobApplication application, Instant scheduledAt, String locationOrLink, String notes) {
        this.application = application;
        this.scheduledAt = scheduledAt;
        this.locationOrLink = locationOrLink;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public JobApplication getApplication() { return application; }
    public Instant getScheduledAt() { return scheduledAt; }
    public String getLocationOrLink() { return locationOrLink; }
    public String getNotes() { return notes; }
    public boolean isReminderSent() { return reminderSent; }
    public void markReminderSent() { this.reminderSent = true; }
}
