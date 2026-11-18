package com.mercycare.hms.service;

import com.mercycare.hms.model.Appointment;
import com.mercycare.hms.model.Bill;
import com.mercycare.hms.model.Patient;
import com.mercycare.hms.repository.AppointmentRepository;
import com.mercycare.hms.repository.BillRepository;
import com.mercycare.hms.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    public BillService(
            BillRepository billRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository) {
        this.billRepository = billRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public List<Bill> findAll() {
        return billRepository.findAll();
    }

    public Bill generateBill(Long patientId, Long appointmentId, Bill payload) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        payload.setPatient(patient);
        if (appointmentId != null) {
            Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
            payload.setAppointment(appt);
        }
        payload.setInvoiceNumber("INV-2026-" + (billRepository.count() + 501));
        payload.recalculateTotals();
        return billRepository.save(payload);
    }

    public Bill recordPayment(Long billId, BigDecimal amount, String method) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));
        BigDecimal balance = bill.getTotalAmount().subtract(bill.getPaidAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0 || amount.compareTo(balance) > 0) {
            throw new IllegalArgumentException("Payment must be positive and cannot exceed remaining balance.");
        }
        bill.setPaidAmount(bill.getPaidAmount().add(amount));
        bill.setPaymentMethod(method);
        bill.recalculateTotals();
        return billRepository.save(bill);
    }
}
