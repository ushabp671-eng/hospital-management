package com.mercycare.hms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient extends Person {

    @Column(name = "patient_code", nullable = false, unique = true, length = 20)
    private String patientCode;

    @Min(0) @Max(120)
    @Column(nullable = false)
    private Integer age;

    @NotBlank
    @Column(nullable = false, length = 16)
    private String gender;

    @NotBlank
    @Column(name = "blood_group", nullable = false, length = 8)
    private String bloodGroup;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String address;

    @NotBlank
    @Column(name = "emergency_contact", nullable = false, length = 150)
    private String emergencyContact;

    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;

    @Column(name = "registered_at", nullable = false)
    private LocalDate registeredAt = LocalDate.now();

    public Patient() {}

    @Override
    public String getEntityIdentifier() {
        return patientCode;
    }

    public String getPatientCode() { return patientCode; }
    public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getMedicalNotes() { return medicalNotes; }
    public void setMedicalNotes(String medicalNotes) { this.medicalNotes = medicalNotes; }
    public LocalDate getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDate registeredAt) { this.registeredAt = registeredAt; }
}
