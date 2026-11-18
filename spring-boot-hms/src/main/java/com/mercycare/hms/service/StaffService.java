package com.mercycare.hms.service;

import com.mercycare.hms.model.Staff;
import com.mercycare.hms.repository.StaffRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StaffService {

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public List<Staff> findAll() {
        return staffRepository.findAll();
    }

    public Staff create(Staff staff) {
        long nextNum = staffRepository.count() + 301;
        staff.setStaffCode("STF-" + nextNum);
        return staffRepository.save(staff);
    }

    public Staff update(Long id, Staff updated) {
        Staff existing = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found: " + id));
        existing.setFullName(updated.getFullName());
        existing.setRole(updated.getRole());
        existing.setDepartment(updated.getDepartment());
        existing.setShift(updated.getShift());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setStatus(updated.getStatus());
        return staffRepository.save(existing);
    }

    public void delete(Long id) {
        staffRepository.deleteById(id);
    }
}
