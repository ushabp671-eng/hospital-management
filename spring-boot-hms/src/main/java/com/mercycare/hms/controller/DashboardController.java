package com.mercycare.hms.controller;

import com.mercycare.hms.repository.AppointmentRepository;
import com.mercycare.hms.repository.BillRepository;
import com.mercycare.hms.repository.DoctorRepository;
import com.mercycare.hms.repository.PatientRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;

    public DashboardController(
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            BillRepository billRepository) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public Map<String, Object> summary() {
        BigDecimal totalBilled = billRepository.sumTotalBilled();
        BigDecimal collected = billRepository.sumCollectedRevenue();
        return Map.of(
                "totalDoctors", doctorRepository.count(),
                "availableDoctors", doctorRepository.countByAvailability("Available"),
                "totalPatients", patientRepository.count(),
                "totalAppointments", appointmentRepository.count(),
                "scheduledAppointments", appointmentRepository.countByStatus("Scheduled"),
                "totalBilled", totalBilled,
                "collectedRevenue", collected,
                "pendingBalance", totalBilled.subtract(collected)
        );
    }
}
