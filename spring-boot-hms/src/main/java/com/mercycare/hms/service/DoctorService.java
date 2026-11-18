package com.mercycare.hms.service;

import com.mercycare.hms.model.Doctor;
import com.mercycare.hms.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public List<Doctor> findAll() {
        return doctorRepository.findAll();
    }

    public Doctor create(Doctor doctor) {
        long nextNum = doctorRepository.count() + 101;
        doctor.setDoctorCode("DOC-" + nextNum);
        return doctorRepository.save(doctor);
    }

    public Doctor update(Long id, Doctor updated) {
        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + id));
        existing.setFullName(updated.getFullName());
        existing.setSpecialization(updated.getSpecialization());
        existing.setDepartment(updated.getDepartment());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAvailability(updated.getAvailability());
        existing.setScheduleHours(updated.getScheduleHours());
        existing.setConsultationFee(updated.getConsultationFee());
        return doctorRepository.save(existing);
    }

    public void delete(Long id) {
        doctorRepository.deleteById(id);
    }
}
