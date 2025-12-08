package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    
    Optional<Invoice> findByTransactionNo(String transactionNo);
    
    List<Invoice> findByPatientRegistrationId(Long patientRegistrationId);
    
    List<Invoice> findByPatientEmail(String patientEmail);
    
    List<Invoice> findByPatientPhone(String patientPhone);
    
    @Query("SELECT i FROM Invoice i WHERE i.patientEmail = :email OR i.patientPhone = :phone ORDER BY i.invoiceDate DESC")
    List<Invoice> findByPatientEmailOrPhone(@Param("email") String email, @Param("phone") String phone);
    
    List<Invoice> findByStatus(String status);

// Và method này (có thể đã có nhưng cần xác nhận)
    @Query("SELECT i FROM Invoice i ORDER BY i.invoiceDate DESC")
    List<Invoice> findAllOrderByInvoiceDateDesc();
}