import React, { useState, useRef, useEffect } from "react";
import "../../css/MedicineManagement.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const MedicineManagement = ({
  medicines,
  formatCurrency,
  getStatusLabel,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [categories, setCategories] = useState([]);

  const formRef = useRef(null);
  const importFormRef = useRef(null);

  const [formData, setFormData] = useState({
    medicineCode: "",
    medicineName: "",
    activeIngredient: "",
    dosageForm: "",
    strength: "",
    unit: "viên",
    packageType: "Vỉ",
    quantityPerPackage: 10,
    manufacturer: "",
    countryOrigin: "Việt Nam",
    lotNumber: "",
    expiryDate: "",
    unitPrice: "",
    stockQuantity: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    prescriptionRequired: true,
    description: "",
    sideEffects: "",
    contraindications: "",
    usageInstructions: "",
    storageConditions: "",
    category: "",
    status: "ACTIVE",
  });

  const dosageFormOptions = [
    "Viên nang",
    "Viên nén",
    "Viên nén bao phim",
    "Bình xịt",
    "Bình xịt định liều",
    "Kem bôi",
    "Dung dịch",
    "Gói bột",
    "Lọ tiêm",
    "Viên sủi",
    "Viên nang mềm",
  ];

  const unitOptions = ["Viên", "Gói", "Lọ", "Bình", "Tuýp", "Hộp", "Ống"];
  const packageTypeOptions = ["Vỉ", "Hộp", "Lọ", "Bình", "Tuýp", "Ống"];
  const statusOptions = [
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "INACTIVE", label: "Ngừng hoạt động" },
    { value: "OUT_OF_STOCK", label: "Hết hàng" },
    { value: "LOW_STOCK", label: "Sắp hết hàng" },
  ];

  // Lay danh sach danh muc
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines/categories",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
    }
  };

  // Ham chuan hoa van ban de tim kiem
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Loc du lieu khi co tim kiem
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMedicines(medicines);
      return;
    }

    let searchTermNormalized = normalizeText(searchTerm);

    let filtered = medicines.filter((medicine) => {
      let nameMatch = normalizeText(medicine.medicineName || "").includes(
        searchTermNormalized,
      );
      let codeMatch = medicine.medicineCode
        ? normalizeText(medicine.medicineCode).includes(searchTermNormalized)
        : false;
      let ingredientMatch = medicine.activeIngredient
        ? normalizeText(medicine.activeIngredient).includes(
            searchTermNormalized,
          )
        : false;
      let categoryMatch = medicine.category
        ? normalizeText(medicine.category).includes(searchTermNormalized)
        : false;
      let manufacturerMatch = medicine.manufacturer
        ? normalizeText(medicine.manufacturer).includes(searchTermNormalized)
        : false;

      return (
        nameMatch ||
        codeMatch ||
        ingredientMatch ||
        categoryMatch ||
        manufacturerMatch
      );
    });

    setFilteredMedicines(filtered);
  }, [searchTerm, medicines]);

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);

    let expiryDateValue = "";
    if (medicine.expiryDate) {
      expiryDateValue = medicine.expiryDate.split("T")[0];
    }

    setFormData({
      medicineCode: medicine.medicineCode || "",
      medicineName: medicine.medicineName || "",
      activeIngredient: medicine.activeIngredient || "",
      dosageForm: medicine.dosageForm || "",
      strength: medicine.strength || "",
      unit: medicine.unit || "viên",
      packageType: medicine.packageType || "Vỉ",
      quantityPerPackage: medicine.quantityPerPackage || 10,
      manufacturer: medicine.manufacturer || "",
      countryOrigin: medicine.countryOrigin || "Việt Nam",
      lotNumber: medicine.lotNumber || "",
      expiryDate: expiryDateValue,
      unitPrice: medicine.unitPrice || "",
      stockQuantity: medicine.stockQuantity || 0,
      minStockLevel: medicine.minStockLevel || 10,
      maxStockLevel: medicine.maxStockLevel || 100,
      prescriptionRequired: medicine.prescriptionRequired !== false,
      description: medicine.description || "",
      sideEffects: medicine.sideEffects || "",
      contraindications: medicine.contraindications || "",
      usageInstructions: medicine.usageInstructions || "",
      storageConditions: medicine.storageConditions || "",
      category: medicine.category || "",
      status: medicine.status || "ACTIVE",
    });

    setShowForm(true);

    if (formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleAddMedicine = async () => {
    if (
      !formData.medicineName ||
      !formData.medicineCode ||
      !formData.unitPrice
    ) {
      alert("Vui lòng điền mã thuốc, tên thuốc và đơn giá");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      let url = "";
      let method = "";

      if (editingMedicine) {
        url = `http://localhost:8080/api/admin/structure/medicines/${editingMedicine.id}`;
        method = "PUT";
      } else {
        url = "http://localhost:8080/api/admin/structure/medicines";
        method = "POST";
      }

      let medicineData = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 10,
        maxStockLevel: parseInt(formData.maxStockLevel) || 100,
        quantityPerPackage: parseInt(formData.quantityPerPackage) || 10,
        prescriptionRequired: formData.prescriptionRequired,
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicineData),
      });

      if (response.ok) {
        onRefresh();
        fetchCategories();
        setShowForm(false);
        resetForm();
        alert((editingMedicine ? "Cập nhật" : "Thêm") + " thuốc thành công!");
      } else {
        const errorData = await response.json();
        alert(
          "Lỗi: " +
            (errorData.message ||
              (editingMedicine
                ? "Lỗi khi cập nhật thuốc"
                : "Lỗi khi thêm thuốc")),
        );
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert("Vui lòng chọn file Excel");
      return;
    }

    setLoading(true);
    let formData = new FormData();
    formData.append("file", importFile);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines/import",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        onRefresh();
        fetchCategories();
        setShowImportForm(false);
        setImportFile(null);
        alert(result.message || "Import thuốc thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi import"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMedicineStatus = async (medicineId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái thuốc này?"))
      return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        onRefresh();
        alert("Cập nhật trạng thái thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi cập nhật"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async (medicineId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        onRefresh();
        alert("Xóa thuốc thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi xóa"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      medicineCode: "",
      medicineName: "",
      activeIngredient: "",
      dosageForm: "",
      strength: "",
      unit: "viên",
      packageType: "Vỉ",
      quantityPerPackage: 10,
      manufacturer: "",
      countryOrigin: "Việt Nam",
      lotNumber: "",
      expiryDate: "",
      unitPrice: "",
      stockQuantity: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      prescriptionRequired: true,
      description: "",
      sideEffects: "",
      contraindications: "",
      usageInstructions: "",
      storageConditions: "",
      category: "",
      status: "ACTIVE",
    });
    setEditingMedicine(null);
  };

  const handleShowImportForm = () => {
    setShowImportForm(true);

    if (importFormRef.current) {
      setTimeout(() => {
        importFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleShowAddForm = () => {
    setEditingMedicine(null);
    resetForm();
    setShowForm(true);

    if (formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCloseImportForm = () => {
    setShowImportForm(false);
    setImportFile(null);
  };

  const getStockStatus = (stockQuantity, minStockLevel) => {
    if (stockQuantity === 0)
      return { label: "Hết hàng", class: "out_of_stock" };
    if (stockQuantity <= minStockLevel)
      return { label: "Sắp hết", class: "low_stock" };
    return { label: "Còn hàng", class: "in_stock" };
  };

  return (
    <div className="medicine-management">
      {/* Tim kiem va nut thao tac */}
      <div className="modern-search-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-lg-6">
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y text-primary ms-3">
                    <i className="bi bi-search fs-5"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5"
                    placeholder="Tìm kiếm theo tên thuốc, mã thuốc, hoạt chất..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 text-muted p-0"
                      onClick={() => setSearchTerm("")}
                      style={{ zIndex: 10 }}
                    >
                      <i className="bi bi-x-circle fs-5"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 small text-muted">
                    Tìm thấy <strong>{filteredMedicines.length}</strong> thuốc
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-6 text-lg-end">
                <div className="d-flex gap-3 justify-content-lg-end">
                  <button
                    className="btn btn-success btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowImportForm}
                    disabled={loading}
                  >
                    <i className="bi bi-file-earmark-arrow-up"></i>
                    Import Excel
                  </button>

                  <button
                    className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowAddForm}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Thêm Thuốc
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form import */}
      {showImportForm && (
        <div className="import-form card mb-4" ref={importFormRef}>
          <div className="card-header bg-success text-white d-flex align-items-center">
            <i className="bi bi-file-earmark-arrow-up me-2 fs-4"></i>
            <h5 className="mb-0">Import Thuốc từ Excel</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-3">
              <strong>Lưu ý:</strong> File Excel cần có đúng định dạng 31 cột
              như dữ liệu mẫu
              <br />
              <small className="text-muted">
                Định dạng file hỗ trợ: .xlsx, .xls
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Chọn file Excel</label>
              <input
                type="file"
                className="form-control form-control-lg"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              {importFile && (
                <div className="mt-2 text-success d-flex align-items-center">
                  <i className="bi bi-file-earmark-check me-2 fs-5"></i>
                  <span>Đã chọn: {importFile.name}</span>
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-lg d-flex align-items-center px-4"
                onClick={handleImportExcel}
                disabled={!importFile || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Import Thuốc
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseImportForm}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form them/sua */}
      {showForm && (
        <div className="add-form card mb-4" ref={formRef}>
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <i
              className={`bi ${
                editingMedicine ? "bi-pencil-square" : "bi-plus-circle"
              } me-2 fs-4`}
            ></i>
            <h5 className="mb-0">
              {editingMedicine ? "Sửa thông tin Thuốc" : "Thêm Thuốc mới"}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Mã thuốc <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.medicineCode}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineCode: e.target.value })
                  }
                  placeholder="AMOX250"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Tên thuốc <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.medicineName}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineName: e.target.value })
                  }
                  placeholder="Amoxicillin 250mg"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Hoạt chất</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.activeIngredient}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activeIngredient: e.target.value,
                    })
                  }
                  placeholder="Amoxicillin"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Danh mục</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Dạng bào chế</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.dosageForm}
                  onChange={(e) =>
                    setFormData({ ...formData, dosageForm: e.target.value })
                  }
                >
                  <option value="">-- Chọn dạng bào chế --</option>
                  {dosageFormOptions.map((form, idx) => (
                    <option key={idx} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Hàm lượng</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.strength}
                  onChange={(e) =>
                    setFormData({ ...formData, strength: e.target.value })
                  }
                  placeholder="250mg"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Đơn vị</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                >
                  {unitOptions.map((unit, idx) => (
                    <option key={idx} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Loại bao bì</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.packageType}
                  onChange={(e) =>
                    setFormData({ ...formData, packageType: e.target.value })
                  }
                >
                  {packageTypeOptions.map((type, idx) => (
                    <option key={idx} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Số lượng/bao bì</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  min="1"
                  value={formData.quantityPerPackage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantityPerPackage: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Nhà sản xuất</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="Công ty CP Dược Hậu Giang"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Quốc gia</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.countryOrigin}
                  onChange={(e) =>
                    setFormData({ ...formData, countryOrigin: e.target.value })
                  }
                  placeholder="Việt Nam"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  Đơn giá (VNĐ) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  min="0"
                  step="100"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Tồn kho hiện tại</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Tồn tối thiểu</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  min="1"
                  value={formData.minStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockLevel: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Cần kê đơn</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.prescriptionRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prescriptionRequired: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Trạng thái</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  {statusOptions.map((status, idx) => (
                    <option key={idx} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Số lô</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.lotNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, lotNumber: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Hạn sử dụng</label>
                <input
                  type="date"
                  className="form-control form-control-lg"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-medium">Mô tả</label>
                <textarea
                  className="form-control form-control-lg"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kháng sinh nhóm Beta-lactam, điều trị nhiễm khuẩn..."
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-medium">Tác dụng phụ</label>
                <textarea
                  className="form-control form-control-lg"
                  rows="2"
                  value={formData.sideEffects}
                  onChange={(e) =>
                    setFormData({ ...formData, sideEffects: e.target.value })
                  }
                  placeholder="Tiêu chảy, buồn nôn, phát ban, dị ứng..."
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-medium">Chống chỉ định</label>
                <textarea
                  className="form-control form-control-lg"
                  rows="2"
                  value={formData.contraindications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contraindications: e.target.value,
                    })
                  }
                  placeholder="Quá mẫn với Penicillin, suy gan nặng..."
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-medium">
                  Hướng dẫn sử dụng
                </label>
                <textarea
                  className="form-control form-control-lg"
                  rows="2"
                  value={formData.usageInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageInstructions: e.target.value,
                    })
                  }
                  placeholder="Uống cách xa bữa ăn 2 giờ, tuân thủ đủ liệu trình..."
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-medium">
                  Điều kiện bảo quản
                </label>
                <textarea
                  className="form-control form-control-lg"
                  rows="2"
                  value={formData.storageConditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storageConditions: e.target.value,
                    })
                  }
                  placeholder="Nơi khô ráo, tránh ánh sáng, dưới 30°C..."
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-lg d-flex align-items-center px-4"
                onClick={handleAddMedicine}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingMedicine ? "Cập nhật" : "Lưu"} Thuốc
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseForm}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bang du lieu */}
      <div className="table-responsive medicine-table">
        <table className="table table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th width="60" className="text-center">
                STT
              </th>
              <th>Mã thuốc</th>
              <th>Tên thuốc</th>
              <th>Hoạt chất</th>
              <th className="text-center">Tồn kho</th>
              <th>Đơn giá</th>
              <th>Danh mục</th>
              <th className="text-center">Trạng thái</th>
              <th width="150" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <div className="empty-state">
                    <i className="bi bi-capsule display-4 text-muted mb-3"></i>
                    <p className="text-muted mb-0 fs-5">
                      {searchTerm
                        ? `Không tìm thấy thuốc nào với từ khóa: "${searchTerm}"`
                        : "Không có thuốc nào"}
                    </p>
                    {searchTerm && (
                      <button
                        className="btn btn-link mt-2"
                        onClick={() => setSearchTerm("")}
                      >
                        Xóa tìm kiếm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMedicines.map((medicine, index) => {
                const stockStatus = getStockStatus(
                  medicine.stockQuantity,
                  medicine.minStockLevel,
                );

                return (
                  <tr key={medicine.id}>
                    <td className="text-center fw-bold text-primary">
                      {index + 1}
                    </td>
                    <td>
                      <strong className="fs-6 text-dark">
                        {medicine.medicineCode || "N/A"}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong className="text-dark">
                          {medicine.medicineName}
                        </strong>
                        <div className="text-muted small">
                          {medicine.dosageForm || "N/A"} -{" "}
                          {medicine.strength || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-dark">
                        {medicine.activeIngredient || "N/A"}
                      </span>
                    </td>
                    <td className="text-center">
                      <div>
                        <span className="fw-bold text-dark">
                          {medicine.stockQuantity} {medicine.unit}
                        </span>
                        <div>
                          <span className={`badge stock-${stockStatus.class}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-primary">
                        {formatCurrency(medicine.unitPrice)}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {medicine.category || "N/A"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`status-badge ${medicine.status.toLowerCase()}`}
                        onClick={() => toggleMedicineStatus(medicine.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {getStatusLabel(medicine.status)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-primary d-flex align-items-center px-3"
                          onClick={() => handleEditMedicine(medicine)}
                          disabled={loading}
                        >
                          <i className="bi bi-pencil me-1"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger d-flex align-items-center px-3"
                          onClick={() => deleteMedicine(medicine.id)}
                          disabled={loading}
                        >
                          <i className="bi bi-trash me-1"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineManagement;
