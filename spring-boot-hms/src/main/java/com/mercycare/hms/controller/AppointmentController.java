package com.mercycare.hms.controller;

import com.mercycare.hms.model.Appointment;
import com.mercycare.hms.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<Appointment> listAppointments() {
        return appointmentService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment bookAppointment(@RequestBody Map<String, String> payload) {
        return appointmentService.book(
                payload.get("patientName"),
                Long.parseLong(payload.get("doctorId")),
                LocalDate.parse(payload.get("appointmentDate")),
                LocalTime.parse(payload.get("appointmentTime")),
                payload.get("reason"),
                payload.getOrDefault("notes", "")
        );
    }

    @PutMapping("/{id}/status")
    public Appointment updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return appointmentService.updateStatus(id, payload.get("status"));
    }
}
