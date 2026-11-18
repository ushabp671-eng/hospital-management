package com.mercycare.hms.model;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Abstract base entity demonstrating Java OOP inheritance and encapsulation
 * across Doctors, Patients, and Hospital Staff.
 */
@MappedSuperclass
public abstract class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 120)
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone", nullable = false, length = 25)
    private String phone;

    @Column(name = "email", length = 120)
    private String email;

    protected Person() {}

    protected Person(String fullName, String phone, String email) {
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
    }

    public abstract String getEntityIdentifier();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
