package com.example.placement.controller;

import com.example.placement.dto.ProfileResponse;
import com.example.placement.dto.ProfileUpdateRequest;
import com.example.placement.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public ProfileResponse profile(Authentication auth) {
        return accountService.profile(auth.getName());
    }

    @PatchMapping("/me")
    public ProfileResponse updateProfile(Authentication auth, @Valid @RequestBody ProfileUpdateRequest request) {
        return accountService.updateProfile(auth.getName(), request);
    }
}
