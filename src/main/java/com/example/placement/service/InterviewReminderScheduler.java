package com.example.placement.service;

import com.example.placement.domain.InterviewSchedule;
import com.example.placement.repository.InterviewScheduleRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.reminders.enabled", havingValue = "true")
public class InterviewReminderScheduler {
    private static final Logger logger = LoggerFactory.getLogger(InterviewReminderScheduler.class);
    private final InterviewScheduleRepository interviews;
    private final JavaMailSender mailSender;

    public InterviewReminderScheduler(InterviewScheduleRepository interviews, JavaMailSender mailSender) {
        this.interviews = interviews;
        this.mailSender = mailSender;
    }

    @Scheduled(fixedDelayString = "${app.reminders.interval-ms:900000}")
    @Transactional
    public void sendUpcomingInterviewReminders() {
        Instant now = Instant.now();
        for (InterviewSchedule interview : interviews.findPendingReminders(now, now.plus(24, ChronoUnit.HOURS))) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(interview.getApplication().getStudent().getEmail());
                message.setSubject("Upcoming interview: " + interview.getApplication().getCompanyName());
                message.setText("Your interview for " + interview.getApplication().getJobTitle()
                        + " is scheduled at " + interview.getScheduledAt()
                        + (interview.getLocationOrLink() == null ? "." : ". Location or link: " + interview.getLocationOrLink()));
                mailSender.send(message);
                interview.markReminderSent();
            } catch (RuntimeException exception) {
                logger.error("Could not send reminder for interview {}", interview.getId(), exception);
            }
        }
    }
}
