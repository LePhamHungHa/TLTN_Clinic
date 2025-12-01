package com.example.clinic_backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medicine_code", unique = true, nullable = false)
    private String medicineCode;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "active_ingredient", length = 500)
    private String activeIngredient;

    @Column(name = "dosage_form")
    private String dosageForm;

    @Column(name = "strength")
    private String strength;

    @Column(name = "unit")
    private String unit;

    @Column(name = "package_type")
    private String packageType;

    @Column(name = "quantity_per_package")
    private Integer quantityPerPackage;

    @Column(name = "manufacturer")
    private String manufacturer;

    @Column(name = "country_origin")
    private String countryOrigin;

    @Column(name = "lot_number")
    private String lotNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "min_stock_level")
    private Integer minStockLevel = 10;

    @Column(name = "max_stock_level")
    private Integer maxStockLevel = 100;

    @Column(name = "prescription_required")
    private Boolean prescriptionRequired = true;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(name = "contraindications", columnDefinition = "TEXT")
    private String contraindications;

    @Column(name = "usage_instructions", columnDefinition = "TEXT")
    private String usageInstructions;

    @Column(name = "storage_conditions", columnDefinition = "TEXT")
    private String storageConditions;

    @Column(name = "category")
    private String category;

    @Column(name = "status")
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Medicine() {}

    public Medicine(String medicineCode, String medicineName, BigDecimal unitPrice) {
        this.medicineCode = medicineCode;
        this.medicineName = medicineName;
        this.unitPrice = unitPrice;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMedicineCode() { return medicineCode; }
    public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getActiveIngredient() { return activeIngredient; }
    public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }

    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }

    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }

    public Integer getQuantityPerPackage() { return quantityPerPackage; }
    public void setQuantityPerPackage(Integer quantityPerPackage) { this.quantityPerPackage = quantityPerPackage; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public String getCountryOrigin() { return countryOrigin; }
    public void setCountryOrigin(String countryOrigin) { this.countryOrigin = countryOrigin; }

    public String getLotNumber() { return lotNumber; }
    public void setLotNumber(String lotNumber) { this.lotNumber = lotNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public Integer getMinStockLevel() { return minStockLevel; }
    public void setMinStockLevel(Integer minStockLevel) { this.minStockLevel = minStockLevel; }

    public Integer getMaxStockLevel() { return maxStockLevel; }
    public void setMaxStockLevel(Integer maxStockLevel) { this.maxStockLevel = maxStockLevel; }

    public Boolean getPrescriptionRequired() { return prescriptionRequired; }
    public void setPrescriptionRequired(Boolean prescriptionRequired) { this.prescriptionRequired = prescriptionRequired; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSideEffects() { return sideEffects; }
    public void setSideEffects(String sideEffects) { this.sideEffects = sideEffects; }

    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }

    public String getUsageInstructions() { return usageInstructions; }
    public void setUsageInstructions(String usageInstructions) { this.usageInstructions = usageInstructions; }

    public String getStorageConditions() { return storageConditions; }
    public void setStorageConditions(String storageConditions) { this.storageConditions = storageConditions; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}