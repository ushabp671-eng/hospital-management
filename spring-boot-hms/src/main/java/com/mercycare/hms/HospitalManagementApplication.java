package com.mercycare.hms;

import com.mercycare.hms.model.Admin;
import com.mercycare.hms.repository.AdminRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class HospitalManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalManagementApplication.class, args);
    }

    @Bean
    CommandLineRunner seedDefaultAdmin(AdminRepository adminRepository) {
        return args -> {
            if (adminRepository.findByUsername("admin").isEmpty()) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                Admin admin = new Admin(
                        "admin",
                        "admin@mercycare.org",
                        encoder.encode("Admin@123"),
                        "Dr. Eleanor Vance",
                        "Hospital Administrator"
                );
                adminRepository.save(admin);
            }
        };
    }
}
