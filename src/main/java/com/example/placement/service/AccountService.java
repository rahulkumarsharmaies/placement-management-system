package com.example.placement.service;

import com.example.placement.domain.Role;
import com.example.placement.domain.UserAccount;
import com.example.placement.dto.ProfileResponse;
import com.example.placement.dto.ProfileUpdateRequest;
import com.example.placement.exception.NotFoundException;
import com.example.placement.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final UserAccountRepository users;

    public AccountService(UserAccountRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public UserAccount requireByEmail(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    @Transactional(readOnly = true)
    public UserAccount requireStudent(Long id) {
        UserAccount student = users.findById(id).orElseThrow(() -> new NotFoundException("Student not found"));
        if (student.getRole() != Role.STUDENT) {
            throw new NotFoundException("Student not found");
        }
        return student;
    }

    @Transactional(readOnly = true)
    public ProfileResponse profile(String email) {
        return profileOf(requireByEmail(email));
    }

    @Transactional
    public ProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        UserAccount user = requireByEmail(email);
        user.updateProfile(request.fullName() == null ? null : request.fullName().trim(),
                request.degree(), request.graduationYear(), request.cgpa(), request.phone());
        return profileOf(user);
    }

    private ProfileResponse profileOf(UserAccount user) {
        return new ProfileResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
                user.getDegree(), user.getGraduationYear(), user.getCgpa(), user.getPhone());
    }
}
