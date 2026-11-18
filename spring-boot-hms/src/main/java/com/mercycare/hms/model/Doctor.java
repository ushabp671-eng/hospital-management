package com.mercycare.hms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "doctors")
public class Doctor extends Person {

    @Column(name = "doctor_code", nullable = false, unique = true, length = 20)
    private String doctorCode;

    @NotBlank(message = "Specialization is required")
    @Column(nullable = false, length = 100)
    private String specialization;

    @NotBlank(message = "Department is required")
    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false, length = 30)
    private String availability = "Available";

    @NotBlank(message = "Schedule hours are required")
    @Column(name = "schedule_hours", nullable = false, length = 100)
    private String scheduleHours;

    @DecimalMin(value = "1.00", message = "Consultation fee must be positive")
    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt = LocalDate.now();

    public Doctor() {}

    @Override
    public String getEntityIdentifier() {
        return doctorCode;
    }

    public String getDoctorCode() { return doctorCode; }
    public void setDoctorCode(String doctorCode) { this.doctorCode = doctorCode; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public String getScheduleHours() { return scheduleHours; }
    public void setScheduleHours(String scheduleHours) { this.scheduleHours = scheduleHours; }
    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
