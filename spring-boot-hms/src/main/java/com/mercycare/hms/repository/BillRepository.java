package com.mercycare.hms.repository;

import com.mercycare.hms.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;

public interface BillRepository extends JpaRepository<Bill, Long> {
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b")
    BigDecimal sumTotalBilled();

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Bill b")
    BigDecimal sumCollectedRevenue();
}
