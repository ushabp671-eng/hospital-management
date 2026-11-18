package com.mercycare.hms.service;

import com.mercycare.hms.model.Appointment;
import com.mercycare.hms.model.Doctor;
import com.mercycare.hms.model.Patient;
import com.mercycare.hms.repository.AppointmentRepository;
import com.mercycare.hms.repository.DoctorRepository;
import com.mercycare.hms.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<Appointment> findAll() {
        return appointmentRepository.findAll();
    }

    public Appointment book(String patientName, Long doctorId, LocalDate date, LocalTime time, String reason, String notes) {
        if (patientName == null || patientName.trim().length() < 2) {
            throw new IllegalArgumentException("Patient name is required.");
        }
        if (appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatus(
                doctorId, date, time, "Scheduled")) {
            throw new IllegalStateException("Selected doctor already has a scheduled appointment at this date and time.");
        }
        String trimmedName = patientName.trim();
        Patient matchedPatient = patientRepository.findAll().stream()
                .filter(p -> p.getFullName().equalsIgnoreCase(trimmedName))
                .findFirst()
                .orElse(null);
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        Appointment appt = new Appointment();
        appt.setAppointmentCode("APT-" + (appointmentRepository.count() + 401));
        appt.setPatient(matchedPatient);
        appt.setPatientName(matchedPatient != null ? matchedPatient.getFullName() : trimmedName);
        appt.setDoctor(doctor);
        appt.setAppointmentDate(date);
        appt.setAppointmentTime(time);
        appt.setReason(reason);
        appt.setNotes(notes);
        appt.setStatus("Scheduled");
        return appointmentRepository.save(appt);
    }

    public Appointment updateStatus(Long id, String status) {
        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        existing.setStatus(status);
        return appointmentRepository.save(existing);
    }
}
