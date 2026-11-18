USE hospital_management_db;

INSERT IGNORE INTO doctors (doctor_code, full_name, specialization, department, email, phone, availability, schedule_hours, consultation_fee)
VALUES
('DOC-101', 'Dr. Vikramaditya Nair', 'Cardiology', 'Cardiology & Heart Care', 'v.nair@mercycare.org', '+1 (555) 210-4401', 'Available', 'Mon-Fri 08:30 - 16:30', 180.00),
('DOC-102', 'Dr. Hannah Lindqvist', 'Neurology', 'Neurosciences', 'h.lindqvist@mercycare.org', '+1 (555) 210-4402', 'In Consultation', 'Mon-Fri 09:00 - 17:00', 210.00),
('DOC-103', 'Dr. Marcus Thorne', 'Orthopedics', 'Orthopedic Surgery', 'm.thorne@mercycare.org', '+1 (555) 210-4403', 'Available', 'Tue-Sat 08:00 - 15:00', 165.00);

INSERT IGNORE INTO patients (patient_code, full_name, age, gender, blood_group, phone, email, address, emergency_contact, medical_notes)
VALUES
('PAT-201', 'Rohan Kulkarni', 46, 'Male', 'O+', '+1 (555) 890-1120', 'rohan.k@example.com', '742 Evergreen Terrace, Apt 3B', 'Meera Kulkarni - +1 (555) 890-1121', 'Mild hypertension; Lisinopril 10mg daily.'),
('PAT-202', 'Sophia Alvarez', 31, 'Female', 'A+', '+1 (555) 890-2240', 'sophia.alvarez@example.com', '118 Cedar Park Lane', 'Carlos Alvarez - +1 (555) 890-2241', 'Recurring migraines; monitoring triggers.');

INSERT IGNORE INTO staff (staff_code, full_name, role, department, shift, phone, email, status)
VALUES
('STF-301', 'Priya Menon', 'Charge Nurse', 'Cardiology & Heart Care', 'Morning (07:00 - 15:00)', '+1 (555) 310-7701', 'p.menon@mercycare.org', 'Active'),
('STF-302', 'Carlos Mendez', 'Senior Lab Technician', 'Diagnostics & Pathology', 'Morning (07:00 - 15:00)', '+1 (555) 310-7702', 'c.mendez@mercycare.org', 'Active');
