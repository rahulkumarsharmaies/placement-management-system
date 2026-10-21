package com.example.placement.config;

import com.example.placement.domain.Role;
import com.example.placement.domain.UserAccount;
import com.example.placement.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PlacementOfficerBootstrap implements CommandLineRunner {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;

    public PlacementOfficerBootstrap(UserAccountRepository users, PasswordEncoder passwordEncoder,
                                     @Value("${app.officer.email:}") String email,
                                     @Value("${app.officer.password:}") String password,
                                     @Value("${app.officer.name:Placement Officer}") String name) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.name = name;
    }

    @Override
    public void run(String... args) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Configure both app.officer.email and app.officer.password");
        }
        if (!users.existsByEmailIgnoreCase(email)) {
            users.save(new UserAccount(name, email.trim().toLowerCase(),
                    passwordEncoder.encode(password), Role.PLACEMENT_OFFICER, null, null, null, null));
        }
    }
}
