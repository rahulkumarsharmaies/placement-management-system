package com.example.placement.service;

import com.example.placement.config.JwtService;
import com.example.placement.domain.Role;
import com.example.placement.domain.UserAccount;
import com.example.placement.dto.AuthResponse;
import com.example.placement.dto.LoginRequest;
import com.example.placement.dto.RegisterRequest;
import com.example.placement.exception.ConflictException;
import com.example.placement.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }
        UserAccount user = users.save(new UserAccount(
                request.fullName().trim(), request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()), Role.STUDENT, request.degree(),
                request.graduationYear(), request.cgpa(), request.phone()));
        return response(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return response(user);
    }

    private AuthResponse response(UserAccount user) {
        return new AuthResponse(jwtService.issue(user), "Bearer", user.getId(),
                user.getFullName(), user.getEmail(), user.getRole());
    }
}
