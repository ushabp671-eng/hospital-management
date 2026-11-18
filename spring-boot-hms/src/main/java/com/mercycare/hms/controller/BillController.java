package com.mercycare.hms.controller;

import com.mercycare.hms.model.Bill;
import com.mercycare.hms.service.BillService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    public List<Bill> listBills() {
        return billService.findAll();
    }

    @PostMapping("/patient/{patientId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Bill generateBill(
            @PathVariable Long patientId,
            @RequestParam(required = false) Long appointmentId,
            @RequestBody Bill bill) {
        return billService.generateBill(patientId, appointmentId, bill);
    }

    @PostMapping("/{id}/pay")
    public Bill recordPayment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        BigDecimal amount = new BigDecimal(payload.get("amount"));
        String method = payload.getOrDefault("paymentMethod", "Card");
        return billService.recordPayment(id, amount, method);
    }
}
