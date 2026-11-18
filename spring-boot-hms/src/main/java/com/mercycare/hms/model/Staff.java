package com.mercycare.hms.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
@Table(name = "staff")
public class Staff extends Person {

    @Column(name = "staff_code", nullable = false, unique = true, length = 20)
    private String staffCode;

    @NotBlank
    @Column(nullable = false, length = 80)
    private String role;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String department;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String shift;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    @Column(name = "joined_at", nullable = false)
    private LocalDate joinedAt = LocalDate.now();

    public Staff() {}

    @Override
    public String getEntityIdentifier() {
        return staffCode;
    }

    public String getStaffCode() { return staffCode; }
    public void setStaffCode(String staffCode) { this.staffCode = staffCode; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDate joinedAt) { this.joinedAt = joinedAt; }
}
