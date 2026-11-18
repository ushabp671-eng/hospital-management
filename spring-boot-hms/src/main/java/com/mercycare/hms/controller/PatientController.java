package com.mercycare.hms.controller;

import com.mercycare.hms.model.Patient;
import com.mercycare.hms.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<Patient> listPatients() {
        return patientService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Patient registerPatient(@Valid @RequestBody Patient patient) {
        return patientService.register(patient);
    }

    @PutMapping("/{id}")
    public Patient updatePatient(@PathVariable Long id, @Valid @RequestBody Patient patient) {
        return patientService.update(id, patient);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePatient(@PathVariable Long id) {
        patientService.delete(id);
    }
}
