package com.mercycare.hms.repository;

import com.mercycare.hms.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {}
