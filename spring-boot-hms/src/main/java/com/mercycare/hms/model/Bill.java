package com.mercycare.hms.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Column(name = "lab_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal labCharges = BigDecimal.ZERO;

    @Column(name = "medication_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal medicationCharges = BigDecimal.ZERO;

    @Column(name = "room_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal roomCharges = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "Pending";

    @Column(name = "payment_method", nullable = false, length = 40)
    private String paymentMethod = "Card";

    @Column(name = "billing_date", nullable = false)
    private LocalDate billingDate = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    public Bill() {}

    public void recalculateTotals() {
        BigDecimal subtotal = consultationFee.add(labCharges).add(medicationCharges).add(roomCharges);
        this.totalAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        if (paidAmount.compareTo(totalAmount) >= 0) {
            this.paymentStatus = "Paid";
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.paymentStatus = "Partial";
        } else {
            this.paymentStatus = "Pending";
        }
    }

    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }
    public BigDecimal getLabCharges() { return labCharges; }
    public void setLabCharges(BigDecimal labCharges) { this.labCharges = labCharges; }
    public BigDecimal getMedicationCharges() { return medicationCharges; }
    public void setMedicationCharges(BigDecimal medicationCharges) { this.medicationCharges = medicationCharges; }
    public BigDecimal getRoomCharges() { return roomCharges; }
    public void setRoomCharges(BigDecimal roomCharges) { this.roomCharges = roomCharges; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public LocalDate getBillingDate() { return billingDate; }
    public void setBillingDate(LocalDate billingDate) { this.billingDate = billingDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
