CREATE DATABASE IF NOT EXISTS hospital_management_db;
USE hospital_management_db;

CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(60) NOT NULL DEFAULT 'Hospital Administrator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    availability ENUM('Available', 'In Consultation', 'On Leave', 'Off Duty') NOT NULL DEFAULT 'Available',
    schedule_hours VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL CHECK (consultation_fee > 0),
    created_at DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 120),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(120),
    address VARCHAR(255) NOT NULL,
    emergency_contact VARCHAR(150) NOT NULL,
    medical_notes TEXT,
    registered_at DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(80) NOT NULL,
    department VARCHAR(100) NOT NULL,
    shift VARCHAR(60) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    status ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
    joined_at DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code VARCHAR(20) NOT NULL UNIQUE,
    patient_id BIGINT NULL,
    patient_name VARCHAR(120) NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    notes TEXT,
    created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lab_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    medication_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    room_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Paid', 'Pending', 'Partial') NOT NULL DEFAULT 'Pending',
    payment_method VARCHAR(40) NOT NULL DEFAULT 'Card',
    billing_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    notes TEXT,
    CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bill_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);
