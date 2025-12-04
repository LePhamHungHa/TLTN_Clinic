import React, { useState, useEffect, useRef } from "react";
import "../../css/AdminStructure.css";
import SlotManagement from "./SlotManagement";
import MedicineManagement from "./MedicineManagement";
import DoctorManagement from "./DoctorManagement";

const AdminStructure = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [slots, setSlots] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States for slot management
  const [bulkMaxPatients, setBulkMaxPatients] = useState(10);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    doctorId: "",
    appointmentDate: "",
    timeSlot: "07:00-08:00",
    maxPatients: 10,
    isActive: true,
  });

  // States for medicine management
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    medicineCode: "",
    medicineName: "",
    activeIngredient: "",
    dosageForm: "",
    strength: "",
    unit: "viên",
    packageType: "",
    quantityPerPackage: 1,
    manufacturer: "",
    countryOrigin: "Việt Nam",
    unitPrice: "",
    stockQuantity: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    prescriptionRequired: true,
    category: "",
    status: "ACTIVE",
  });

  // States for doctor management
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    citizenId: "",
    address: "",
    specialty: "",
    phone: "",
    email: "",
    departmentId: "",
    degree: "",
    position: "",
    username: "",
    password: "",
    roomNumber: "",
    floor: "",
  });

  // Refs cho các form
  const doctorFormRef = useRef(null);
  const slotFormRef = useRef(null);
  const medicineFormRef = useRef(null);

  // Available options
  const genderOptions = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
  ];

  const specialtyOptions = [
    "Nội khoa",
    "Ngoại khoa",
    "Nhi khoa",
    "Sản phụ khoa",
    "Tai mũi họng",
    "Răng hàm mặt",
    "Da liễu",
    "Mắt",
    "Thần kinh",
    "Tim mạch",
    "Tiêu hóa",
    "Nội tiết",
    "Cơ xương khớp",
    "Ung bướu",
  ];

  const degreeOptions = [
    "Bác sĩ chuyên khoa I",
    "Bác sĩ chuyên khoa II",
    "Thạc sĩ",
    "Tiến sĩ",
    "Phó giáo sư",
    "Giáo sư",
  ];

  const positionOptions = [
    "Bác sĩ",
    "Trưởng khoa",
    "Phó khoa",
    "Bác sĩ trưởng",
    "Chuyên viên",
  ];

  // ========== SCROLL FUNCTIONS ==========
  const scrollToDoctorForm = () => {
    if (doctorFormRef.current) {
      if (activeTab !== 2) {
        setActiveTab(2);
        setTimeout(() => {
          doctorFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      } else {
        doctorFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const scrollToSlotForm = () => {
    if (slotFormRef.current) {
      if (activeTab !== 0) {
        setActiveTab(0);
        setTimeout(() => {
          slotFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      } else {
        slotFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const scrollToMedicineForm = () => {
    if (medicineFormRef.current) {
      if (activeTab !== 1) {
        setActiveTab(1);
        setTimeout(() => {
          medicineFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      } else {
        medicineFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      if (!token) {
        setError("Không tìm thấy token đăng nhập");
        return;
      }

      // Fetch departments
      try {
        const departmentsResponse = await fetch(
          "http://localhost:8080/api/departments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        }
      } catch {
        //e
      }

      // Fetch slots
      const slotsResponse = await fetch(
        "http://localhost:8080/api/admin/structure/slots",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!slotsResponse.ok) {
        throw new Error(`Slots API error: ${slotsResponse.status}`);
      }

      const slotsData = await slotsResponse.json();
      setSlots(Array.isArray(slotsData) ? slotsData : []);

      // Fetch medicines
      const medicinesResponse = await fetch(
        "http://localhost:8080/api/admin/structure/medicines",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const medicinesData = medicinesResponse.ok
        ? await medicinesResponse.json()
        : [];
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);

      // Fetch doctors
      const doctorsResponse = await fetch("http://localhost:8080/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
      setSlots([]);
      setMedicines([]);
      setDoctors([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Chưa phân khoa";
    const dept = departments.find(
      (d) => d.id === departmentId || d.id === parseInt(departmentId)
    );
    return dept ? dept.departmentName : `Khoa ID: ${departmentId}`;
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? doctor.fullName || "Không xác định" : "Không xác định";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      ACTIVE: "Hoạt động",
      INACTIVE: "Ngừng hoạt động",
      OUT_OF_STOCK: "Hết hàng",
      LOW_STOCK: "Sắp hết",
    };
    return statusMap[status] || status;
  };

  const getGenderLabel = (gender) => {
    const genderMap = {
      MALE: "Nam",
      FEMALE: "Nữ",
      OTHER: "Khác",
    };
    return genderMap[gender] || gender;
  };

  // ========== SLOT MANAGEMENT FUNCTIONS ==========
  const handleCreateSlot = async () => {
    if (!newSlot.doctorId || !newSlot.appointmentDate) {
      alert("Vui lòng chọn bác sĩ và ngày khám");
      return;
    }

    if (!newSlot.maxPatients || newSlot.maxPatients < 1) {
      alert("Số bệnh nhân tối đa phải lớn hơn 0");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/slots",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSlot),
        }
      );

      if (response.ok) {
        const addedSlot = await response.json();
        setSlots([...slots, addedSlot]);
        setShowSlotForm(false);
        setNewSlot({
          doctorId: "",
          appointmentDate: "",
          timeSlot: "07:00-08:00",
          maxPatients: 10,
          isActive: true,
        });
        alert("✅ Thêm slot thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi thêm slot");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const updateSlotMaxPatients = async (slotId, newMax) => {
    if (!newMax || newMax < 1) {
      alert("Số bệnh nhân tối đa phải lớn hơn 0");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/slots/${slotId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ maxPatients: newMax }),
        }
      );

      if (response.ok) {
        const updatedSlot = await response.json();
        setSlots(
          slots.map((slot) => (slot.id === slotId ? updatedSlot : slot))
        );
        alert("✅ Cập nhật thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkMaxPatients || bulkMaxPatients < 1) {
      alert("Vui lòng nhập số bệnh nhân tối đa hợp lệ");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/slots/bulk-max-patients",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ maxPatients: bulkMaxPatients }),
        }
      );

      if (response.ok) {
        setSlots(
          slots.map((slot) => ({
            ...slot,
            maxPatients: bulkMaxPatients,
          }))
        );
        setShowBulkForm(false);
        alert("✅ Cập nhật hàng loạt thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/slots/${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSlots(slots.filter((slot) => slot.id !== slotId));
        alert("✅ Xóa slot thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const toggleSlotStatus = async (slotId, currentStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/slots/${slotId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        }
      );

      if (response.ok) {
        setSlots(
          slots.map((slot) =>
            slot.id === slotId ? { ...slot, isActive: !currentStatus } : slot
          )
        );
        alert("✅ Cập nhật trạng thái slot thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  // ========== MEDICINE MANAGEMENT FUNCTIONS ==========
  const handleAddMedicine = async () => {
    if (!newMedicine.medicineName || !newMedicine.unitPrice) {
      alert("Vui lòng điền tên thuốc và đơn giá");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const medicineToSend = {
        ...newMedicine,
        medicineCode: newMedicine.medicineCode || `MED${Date.now()}`,
        unitPrice: parseFloat(newMedicine.unitPrice),
        stockQuantity: parseInt(newMedicine.stockQuantity),
        minStockLevel: parseInt(newMedicine.minStockLevel),
        maxStockLevel: parseInt(newMedicine.maxStockLevel),
        quantityPerPackage: parseInt(newMedicine.quantityPerPackage),
        prescriptionRequired:
          newMedicine.prescriptionRequired === true ||
          newMedicine.prescriptionRequired === "true",
      };

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(medicineToSend),
        }
      );

      if (response.ok) {
        const addedMedicine = await response.json();
        setMedicines([...medicines, addedMedicine]);
        setShowMedicineForm(false);
        setNewMedicine({
          medicineCode: "",
          medicineName: "",
          activeIngredient: "",
          dosageForm: "",
          strength: "",
          unit: "viên",
          packageType: "",
          quantityPerPackage: 1,
          manufacturer: "",
          countryOrigin: "Việt Nam",
          unitPrice: "",
          stockQuantity: 0,
          minStockLevel: 10,
          maxStockLevel: 100,
          prescriptionRequired: true,
          category: "",
          status: "ACTIVE",
        });
        alert("✅ Thêm thuốc thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi thêm thuốc");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert("Vui lòng chọn file Excel");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines/import",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchData();
          setShowImportForm(false);
          setImportFile(null);
          alert("✅ Import thành công!");
        } else {
          throw new Error(result.message || "Import thất bại");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi import");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const toggleMedicineStatus = async (medicineId, currentStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}/toggle-status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setMedicines(
          medicines.map((medicine) =>
            medicine.id === medicineId
              ? {
                  ...medicine,
                  status: currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                }
              : medicine
          )
        );
        alert("✅ Cập nhật trạng thái thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteMedicine = async (medicineId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setMedicines(
          medicines.filter((medicine) => medicine.id !== medicineId)
        );
        alert("✅ Xóa thuốc thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  // ========== DOCTOR MANAGEMENT FUNCTIONS ==========
  const handleAddDoctor = async () => {
    if (
      !newDoctor.fullName ||
      !newDoctor.email ||
      !newDoctor.phone ||
      !newDoctor.specialty
    ) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc: Họ tên, Email, SĐT, Chuyên khoa"
      );
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const doctorToSend = {
        ...newDoctor,
        departmentId: newDoctor.departmentId
          ? parseInt(newDoctor.departmentId)
          : null,
        username: newDoctor.username || newDoctor.email.split("@")[0],
      };

      const response = await fetch("http://localhost:8080/api/doctors/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doctorToSend),
      });

      if (response.ok) {
        const addedDoctor = await response.json();
        setDoctors([...doctors, addedDoctor]);
        setShowDoctorForm(false);
        resetDoctorForm();
        setEditingDoctor(null);
        alert("✅ Thêm bác sĩ thành công!");
      } else {
        await response.text(); // Đọc response để tránh memory leak
        throw new Error("Lỗi khi thêm bác sĩ");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor({
      fullName: doctor.fullName || "",
      dateOfBirth: doctor.dateOfBirth || "",
      gender: doctor.gender || "MALE",
      citizenId: doctor.citizenId || "",
      address: doctor.address || "",
      specialty: doctor.specialty || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      departmentId: doctor.departmentId ? doctor.departmentId.toString() : "",
      degree: doctor.degree || "",
      position: doctor.position || "",
      username: doctor.username || "",
      password: "",
      roomNumber: doctor.roomNumber || "",
      floor: doctor.floor || "",
    });

    // Hiển thị form và scroll đến nó
    setShowDoctorForm(true);
    setTimeout(() => {
      scrollToDoctorForm();
    }, 50);
  };

  const handleUpdateDoctor = async () => {
    if (
      !newDoctor.fullName ||
      !newDoctor.email ||
      !newDoctor.phone ||
      !newDoctor.specialty
    ) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc: Họ tên, Email, SĐT, Chuyên khoa"
      );
      return;
    }

    if (!editingDoctor || !editingDoctor.id) {
      alert("Không tìm thấy thông tin bác sĩ cần cập nhật");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const doctorToSend = {
        ...newDoctor,
        departmentId: newDoctor.departmentId
          ? parseInt(newDoctor.departmentId)
          : null,
      };

      const response = await fetch(
        `http://localhost:8080/api/doctors/${editingDoctor.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doctorToSend),
        }
      );

      if (response.ok) {
        const updatedDoctor = await response.json();
        setDoctors(
          doctors.map((doctor) =>
            doctor.id === editingDoctor.id ? updatedDoctor : doctor
          )
        );
        setShowDoctorForm(false);
        resetDoctorForm();
        setEditingDoctor(null);
        alert("✅ Cập nhật bác sĩ thành công!");
      } else {
        await response.text(); // Đọc response để tránh memory leak
        throw new Error("Lỗi khi cập nhật bác sĩ");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (!doctorId) {
      alert("Không tìm thấy ID bác sĩ");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa bác sĩ này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/doctors/${doctorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setDoctors(doctors.filter((doctor) => doctor.id !== doctorId));
        alert("✅ Xóa bác sĩ thành công!");
      } else {
        await response.text(); // Đọc response để tránh memory leak
        throw new Error("Lỗi khi xóa bác sĩ");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  // Reset form bác sĩ
  const resetDoctorForm = () => {
    setNewDoctor({
      fullName: "",
      dateOfBirth: "",
      gender: "MALE",
      citizenId: "",
      address: "",
      specialty: "",
      phone: "",
      email: "",
      departmentId: "",
      degree: "",
      position: "",
      username: "",
      password: "",
      roomNumber: "",
      floor: "",
    });
  };

  // ========== CLICK HANDLERS ==========
  const handleAddDoctorClick = () => {
    setEditingDoctor(null);
    resetDoctorForm();
    setShowDoctorForm(true);
    setTimeout(() => {
      scrollToDoctorForm();
    }, 50);
  };

  const handleAddSlotClick = () => {
    setShowSlotForm(true);
    setTimeout(() => {
      scrollToSlotForm();
    }, 50);
  };

  const handleAddMedicineClick = () => {
    setShowMedicineForm(true);
    setTimeout(() => {
      scrollToMedicineForm();
    }, 50);
  };

  const handleImportClick = () => {
    setShowImportForm(true);
    setTimeout(() => {
      if (medicineFormRef.current) {
        medicineFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="admin-structure">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-structure">
      <div className="admin-container">
        <h1 className="admin-header">📋 Quản lý cơ cấu hệ thống</h1>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button className="retry-button" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 0 ? "active" : ""}`}
            onClick={() => setActiveTab(0)}
          >
            📅 Quản lý Slot Bác sĩ
          </button>
          <button
            className={`tab-button ${activeTab === 1 ? "active" : ""}`}
            onClick={() => setActiveTab(1)}
          >
            💊 Quản lý Thuốc
          </button>
          <button
            className={`tab-button ${activeTab === 2 ? "active" : ""}`}
            onClick={() => setActiveTab(2)}
          >
            👨‍⚕️ Quản lý Bác sĩ ({doctors.length})
          </button>
        </div>

        {/* Slot Management Tab */}
        {activeTab === 0 && (
          <SlotManagement
            slots={slots}
            doctors={doctors}
            showSlotForm={showSlotForm}
            newSlot={newSlot}
            slotFormRef={slotFormRef}
            showBulkForm={showBulkForm}
            bulkMaxPatients={bulkMaxPatients}
            getDoctorName={getDoctorName}
            handleAddSlotClick={handleAddSlotClick}
            handleCreateSlot={handleCreateSlot}
            setNewSlot={setNewSlot}
            setShowSlotForm={setShowSlotForm}
            setShowBulkForm={setShowBulkForm}
            setBulkMaxPatients={setBulkMaxPatients}
            handleBulkUpdate={handleBulkUpdate}
            updateSlotMaxPatients={updateSlotMaxPatients}
            toggleSlotStatus={toggleSlotStatus}
            deleteSlot={deleteSlot}
          />
        )}

        {/* Medicine Management Tab */}
        {activeTab === 1 && (
          <MedicineManagement
            medicines={medicines}
            showMedicineForm={showMedicineForm}
            showImportForm={showImportForm}
            importFile={importFile}
            newMedicine={newMedicine}
            medicineFormRef={medicineFormRef}
            formatCurrency={formatCurrency}
            getStatusLabel={getStatusLabel}
            handleAddMedicineClick={handleAddMedicineClick}
            handleImportClick={handleImportClick}
            handleAddMedicine={handleAddMedicine}
            handleImportExcel={handleImportExcel}
            setNewMedicine={setNewMedicine}
            setShowMedicineForm={setShowMedicineForm}
            setShowImportForm={setShowImportForm}
            setImportFile={setImportFile}
            toggleMedicineStatus={toggleMedicineStatus}
            deleteMedicine={deleteMedicine}
          />
        )}

        {/* Doctor Management Tab */}
        {activeTab === 2 && (
          <DoctorManagement
            doctors={doctors}
            departments={departments}
            genderOptions={genderOptions}
            specialtyOptions={specialtyOptions}
            degreeOptions={degreeOptions}
            positionOptions={positionOptions}
            showDoctorForm={showDoctorForm}
            editingDoctor={editingDoctor}
            newDoctor={newDoctor}
            doctorFormRef={doctorFormRef}
            handleAddDoctorClick={handleAddDoctorClick}
            handleEditDoctor={handleEditDoctor}
            handleAddDoctor={handleAddDoctor}
            handleUpdateDoctor={handleUpdateDoctor}
            deleteDoctor={deleteDoctor}
            setNewDoctor={setNewDoctor}
            setShowDoctorForm={setShowDoctorForm}
            setEditingDoctor={setEditingDoctor}
            resetDoctorForm={resetDoctorForm}
            getDepartmentName={getDepartmentName}
            getGenderLabel={getGenderLabel}
          />
        )}
      </div>
    </div>
  );
};

export default AdminStructure;
