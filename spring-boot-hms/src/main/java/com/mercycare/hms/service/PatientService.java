package com.mercycare.hms.service;

import com.mercycare.hms.model.Patient;
import com.mercycare.hms.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public List<Patient> findAll() {
        return patientRepository.findAll();
    }

    public Patient register(Patient patient) {
        long nextNum = patientRepository.count() + 201;
        patient.setPatientCode("PAT-" + nextNum);
        return patientRepository.save(patient);
    }

    public Patient update(Long id, Patient updated) {
        Patient existing = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + id));
        existing.setFullName(updated.getFullName());
        existing.setAge(updated.getAge());
        existing.setGender(updated.getGender());
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setAddress(updated.getAddress());
        existing.setEmergencyContact(updated.getEmergencyContact());
        existing.setMedicalNotes(updated.getMedicalNotes());
        return patientRepository.save(existing);
    }

    public void delete(Long id) {
        patientRepository.deleteById(id);
    }
}
