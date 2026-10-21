package com.example.placement.repository;

import com.example.placement.domain.InterviewSchedule;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, Long> {
    void deleteAllByApplication_Id(Long applicationId);

    @Query("""
            select i from InterviewSchedule i
            where lower(i.application.student.email) = lower(:email)
            order by i.scheduledAt
            """)
    List<InterviewSchedule> findAllForStudent(@Param("email") String email);

    @Query("""
            select i from InterviewSchedule i
            where i.reminderSent = false and i.scheduledAt between :start and :end
            """)
    List<InterviewSchedule> findPendingReminders(@Param("start") Instant start, @Param("end") Instant end);
}
