package com.mercycare.hms.controller;

import com.mercycare.hms.model.Staff;
import com.mercycare.hms.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<Staff> listStaff() {
        return staffService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Staff createStaff(@Valid @RequestBody Staff staff) {
        return staffService.create(staff);
    }

    @PutMapping("/{id}")
    public Staff updateStaff(@PathVariable Long id, @Valid @RequestBody Staff staff) {
        return staffService.update(id, staff);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaff(@PathVariable Long id) {
        staffService.delete(id);
    }
}
