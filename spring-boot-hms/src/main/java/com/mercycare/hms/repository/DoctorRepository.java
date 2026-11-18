package com.mercycare.hms.repository;

import com.mercycare.hms.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByAvailability(String availability);
    long countByAvailability(String availability);
}
