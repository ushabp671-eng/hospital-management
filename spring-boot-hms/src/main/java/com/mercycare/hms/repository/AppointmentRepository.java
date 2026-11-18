package com.mercycare.hms.repository;

import com.mercycare.hms.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.time.LocalTime;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatus(
            Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime, String status
    );
    long countByStatus(String status);
}
