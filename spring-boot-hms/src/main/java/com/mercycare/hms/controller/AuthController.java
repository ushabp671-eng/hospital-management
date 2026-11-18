package com.mercycare.hms.controller;

import com.mercycare.hms.model.Admin;
import com.mercycare.hms.repository.AdminRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpSession session) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");

        Admin admin = adminRepository.findByUsername(username)
                .or(() -> adminRepository.findByEmail(username))
                .orElse(null);

        if (admin == null || !encoder.matches(password, admin.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid administrator credentials"));
        }

        session.setAttribute("ADMIN_USER", admin.getUsername());
        return ResponseEntity.ok(Map.of(
                "username", admin.getUsername(),
                "displayName", admin.getDisplayName(),
                "role", admin.getRole()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
