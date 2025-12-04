import React, { useState, useEffect, useRef } from "react";
import "../../css/AdminStructure.css";

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

      console.log("🔍 Fetching admin structure data...");

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
          console.log("✅ Departments loaded:", departmentsData.length);
        } else {
          console.warn(
            "⚠️ Failed to fetch departments:",
            departmentsResponse.status
          );
        }
      } catch (deptErr) {
        console.warn("⚠️ Error fetching departments:", deptErr.message);
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
        console.log("✅ Doctors loaded:", doctorsData.length);
        if (doctorsData.length > 0) {
          console.log("📋 First doctor:", doctorsData[0]);
        }
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        console.error("Failed to fetch doctors:", doctorsResponse.status);
        setDoctors([]);
      }
    } catch (err) {
      console.error("💥 Fetch error:", err);
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

      console.log("📤 Sending doctor data:", doctorToSend);

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
        console.log("✅ Doctor created:", addedDoctor);
        setDoctors([...doctors, addedDoctor]);
        setShowDoctorForm(false);
        resetDoctorForm();
        setEditingDoctor(null);
        alert("✅ Thêm bác sĩ thành công!");
      } else {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error("Lỗi khi thêm bác sĩ");
      }
    } catch (err) {
      console.error("❌ Error adding doctor:", err);
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleEditDoctor = (doctor) => {
    console.log("✏️ Editing doctor:", doctor);
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

      console.log("📤 Updating doctor ID:", editingDoctor.id);
      console.log("📤 Update data:", doctorToSend);

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
        console.log("✅ Doctor updated:", updatedDoctor);
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
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error("Lỗi khi cập nhật bác sĩ");
      }
    } catch (err) {
      console.error("❌ Error updating doctor:", err);
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteDoctor = async (doctorId) => {
    console.log("🗑️ Deleting doctor ID:", doctorId);

    if (!doctorId) {
      alert("Không tìm thấy ID bác sĩ");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa bác sĩ này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      console.log("📤 Sending delete request...");
      const response = await fetch(
        `http://localhost:8080/api/doctors/${doctorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("🗑️ Delete response status:", response.status);

      if (response.ok) {
        setDoctors(doctors.filter((doctor) => doctor.id !== doctorId));
        alert("✅ Xóa bác sĩ thành công!");
      } else {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error("Lỗi khi xóa bác sĩ");
      }
    } catch (err) {
      console.error("❌ Error deleting doctor:", err);
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
          <div className="slot-management">
            <div className="section-header">
              <h2>Quản lý Slot khám bệnh ({slots.length})</h2>
              <div className="action-buttons">
                <button
                  className="warning-button"
                  onClick={() => {
                    setShowBulkForm(!showBulkForm);
                    if (showBulkForm && slotFormRef.current) {
                      setTimeout(() => {
                        slotFormRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 50);
                    }
                  }}
                >
                  📊 Cập nhật hàng loạt
                </button>
                <button className="primary-button" onClick={handleAddSlotClick}>
                  ➕ Thêm Slot mới
                </button>
              </div>
            </div>

            {/* Add Slot Form */}
            {showSlotForm && (
              <div className="add-slot-form" ref={slotFormRef}>
                <h3>Thêm Slot mới</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Bác sĩ *:</label>
                    <select
                      value={newSlot.doctorId}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, doctorId: e.target.value })
                      }
                      required
                    >
                      <option value="">Chọn bác sĩ</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.fullName} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Ngày khám *:</label>
                    <input
                      type="date"
                      value={newSlot.appointmentDate}
                      onChange={(e) =>
                        setNewSlot({
                          ...newSlot,
                          appointmentDate: e.target.value,
                        })
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Khung giờ *:</label>
                    <select
                      value={newSlot.timeSlot}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, timeSlot: e.target.value })
                      }
                    >
                      <option value="07:00-08:00">07:00 - 08:00</option>
                      <option value="08:00-09:00">08:00 - 09:00</option>
                      <option value="09:00-10:00">09:00 - 10:00</option>
                      <option value="10:00-11:00">10:00 - 11:00</option>
                      <option value="11:00-12:00">11:00 - 12:00</option>
                      <option value="13:00-14:00">13:00 - 14:00</option>
                      <option value="14:00-15:00">14:00 - 15:00</option>
                      <option value="15:00-16:00">15:00 - 16:00</option>
                      <option value="16:00-17:00">16:00 - 17:00</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Số bệnh nhân tối đa:</label>
                    <input
                      type="number"
                      min="1"
                      value={newSlot.maxPatients}
                      onChange={(e) =>
                        setNewSlot({
                          ...newSlot,
                          maxPatients: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="success-button" onClick={handleCreateSlot}>
                    💾 Lưu Slot
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => setShowSlotForm(false)}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Update Form */}
            {showBulkForm && (
              <div className="bulk-form" ref={slotFormRef}>
                <h3>Cập nhật số bệnh nhân tối đa hàng loạt</h3>
                <div className="form-group">
                  <label>Số bệnh nhân tối đa:</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkMaxPatients}
                    onChange={(e) =>
                      setBulkMaxPatients(parseInt(e.target.value) || 1)
                    }
                    className="number-input"
                  />
                  <span>người/slot</span>
                </div>
                <div className="note">
                  <p>
                    <strong>Phạm vi áp dụng:</strong> Tất cả các slot hiện có
                  </p>
                  <p>
                    <em>
                      Lưu ý: Số lượng tối đa không được nhỏ hơn số bệnh nhân
                      hiện tại
                    </em>
                  </p>
                </div>
                <div className="form-actions">
                  <button className="success-button" onClick={handleBulkUpdate}>
                    ✅ Áp dụng
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => setShowBulkForm(false)}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {slots.length === 0 ? (
              <div className="empty-state">
                <p>Không có slot nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bác sĩ</th>
                      <th>Ngày</th>
                      <th>Khung giờ</th>
                      <th>Số bệnh nhân hiện tại</th>
                      <th>Số bệnh nhân tối đa</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => (
                      <tr key={slot.id}>
                        <td>{getDoctorName(slot.doctorId)}</td>
                        <td>{slot.appointmentDate || "N/A"}</td>
                        <td>{slot.timeSlot || "N/A"}</td>
                        <td>
                          <span
                            className={`patient-count ${
                              slot.currentPatients >= slot.maxPatients
                                ? "full"
                                : "normal"
                            }`}
                          >
                            {slot.currentPatients || 0}
                          </span>
                        </td>
                        <td>
                          <div className="max-patients-input">
                            <input
                              type="number"
                              min={slot.currentPatients || 0}
                              value={slot.maxPatients || 5}
                              onBlur={(e) =>
                                updateSlotMaxPatients(
                                  slot.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                            <span>người</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              slot.isActive ? "active" : "inactive"
                            }`}
                            onClick={() =>
                              toggleSlotStatus(slot.id, slot.isActive)
                            }
                            title="Nhấn để thay đổi trạng thái"
                            style={{ cursor: "pointer" }}
                          >
                            {slot.isActive ? "Hoạt động" : "Vô hiệu"}
                          </span>
                        </td>
                        <td className="slot-actions">
                          <button
                            className="delete-button"
                            onClick={() => deleteSlot(slot.id)}
                            disabled={(slot.currentPatients || 0) > 0}
                            title={
                              (slot.currentPatients || 0) > 0
                                ? "Không thể xóa slot đã có bệnh nhân"
                                : "Xóa slot"
                            }
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Medicine Management Tab */}
        {activeTab === 1 && (
          <div className="medicine-management">
            <div className="section-header">
              <h2>Quản lý Thuốc ({medicines.length})</h2>
              <div className="action-buttons">
                <button className="warning-button" onClick={handleImportClick}>
                  📄 Import từ Excel
                </button>
                <button
                  className="primary-button"
                  onClick={handleAddMedicineClick}
                >
                  ➕ Thêm thuốc mới
                </button>
              </div>
            </div>

            {/* Import Form */}
            {showImportForm && (
              <div className="import-form" ref={medicineFormRef}>
                <h3>Import thuốc từ Excel</h3>
                <div className="form-content">
                  <p>Vui lòng chọn file Excel theo đúng định dạng mẫu</p>
                  <div className="file-input">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files[0])}
                    />
                    {importFile && (
                      <p className="file-name">Đã chọn: {importFile.name}</p>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="success-button"
                    onClick={handleImportExcel}
                    disabled={!importFile}
                  >
                    📤 Upload & Import
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      setShowImportForm(false);
                      setImportFile(null);
                    }}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Add Medicine Form */}
            {showMedicineForm && (
              <div className="add-medicine-form" ref={medicineFormRef}>
                <h3>Thêm thuốc mới</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Mã thuốc:</label>
                    <input
                      type="text"
                      value={newMedicine.medicineCode}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          medicineCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Tên thuốc *:</label>
                    <input
                      type="text"
                      value={newMedicine.medicineName}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          medicineName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Hoạt chất:</label>
                    <input
                      type="text"
                      value={newMedicine.activeIngredient}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          activeIngredient: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Đơn vị:</label>
                    <select
                      value={newMedicine.unit}
                      onChange={(e) =>
                        setNewMedicine({ ...newMedicine, unit: e.target.value })
                      }
                    >
                      <option value="viên">Viên</option>
                      <option value="chai">Chai</option>
                      <option value="tuýp">Tuýp</option>
                      <option value="hộp">Hộp</option>
                      <option value="vỉ">Vỉ</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Đơn giá (VNĐ) *:</label>
                    <input
                      type="number"
                      min="0"
                      value={newMedicine.unitPrice}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          unitPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Số lượng tồn:</label>
                    <input
                      type="number"
                      min="0"
                      value={newMedicine.stockQuantity}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          stockQuantity: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Danh mục:</label>
                    <input
                      type="text"
                      value={newMedicine.category}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Cần kê đơn:</label>
                    <select
                      value={newMedicine.prescriptionRequired}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          prescriptionRequired: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="success-button"
                    onClick={handleAddMedicine}
                  >
                    💾 Lưu thuốc
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => setShowMedicineForm(false)}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Tổng số thuốc</div>
                <div className="stat-value">{medicines.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Đang hoạt động</div>
                <div className="stat-value active">
                  {medicines.filter((m) => m.status === "ACTIVE").length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Sắp hết hàng</div>
                <div className="stat-value warning">
                  {
                    medicines.filter(
                      (m) => m.stockQuantity <= (m.minStockLevel || 10)
                    ).length
                  }
                </div>
              </div>
            </div>

            {medicines.length === 0 ? (
              <div className="empty-state">
                <p>Không có thuốc nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã thuốc</th>
                      <th>Tên thuốc</th>
                      <th>Hoạt chất</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((medicine) => (
                      <tr key={medicine.id}>
                        <td>{medicine.medicineCode || "N/A"}</td>
                        <td>{medicine.medicineName || "N/A"}</td>
                        <td>{medicine.activeIngredient || "N/A"}</td>
                        <td>
                          <div className="stock-info">
                            <span>
                              {medicine.stockQuantity || 0}{" "}
                              {medicine.unit || ""}
                            </span>
                            {medicine.stockQuantity <=
                              (medicine.minStockLevel || 10) && (
                              <span className="low-stock-badge">Sắp hết</span>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency(medicine.unitPrice)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              medicine.status === "ACTIVE"
                                ? "active"
                                : medicine.status === "INACTIVE"
                                ? "inactive"
                                : medicine.status === "OUT_OF_STOCK"
                                ? "out-of-stock"
                                : "low-stock"
                            }`}
                            onClick={() =>
                              toggleMedicineStatus(medicine.id, medicine.status)
                            }
                            title="Nhấn để thay đổi trạng thái"
                          >
                            {getStatusLabel(medicine.status)}
                          </span>
                        </td>
                        <td className="medicine-actions">
                          <button
                            className="delete-button"
                            onClick={() => deleteMedicine(medicine.id)}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Doctor Management Tab */}
        {activeTab === 2 && (
          <div className="doctor-management">
            <div className="section-header">
              <h2>Quản lý Bác sĩ</h2>
              <div className="action-buttons">
                <button
                  className="primary-button"
                  onClick={handleAddDoctorClick}
                >
                  👨‍⚕️ Thêm Bác sĩ mới
                </button>
              </div>
            </div>

            {/* Add/Edit Doctor Form */}
            {showDoctorForm && (
              <div className="add-doctor-form" ref={doctorFormRef}>
                <h3>
                  {editingDoctor ? "Chỉnh sửa Bác sĩ" : "Thêm Bác sĩ mới"}
                </h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Họ và tên *:</label>
                    <input
                      type="text"
                      value={newDoctor.fullName}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Ngày sinh:</label>
                    <input
                      type="date"
                      value={newDoctor.dateOfBirth}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Giới tính:</label>
                    <select
                      value={newDoctor.gender}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, gender: e.target.value })
                      }
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>CMND/CCCD:</label>
                    <input
                      type="text"
                      value={newDoctor.citizenId}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          citizenId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Địa chỉ:</label>
                    <input
                      type="text"
                      value={newDoctor.address}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, address: e.target.value })
                      }
                    />
                  </div>

                  {/* THÊM SELECT KHOA */}
                  <div className="form-field">
                    <label>Khoa:</label>
                    <select
                      value={newDoctor.departmentId}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          departmentId: e.target.value,
                        })
                      }
                    >
                      <option value="">Chọn khoa (tùy chọn)</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Chuyên khoa *:</label>
                    <select
                      value={newDoctor.specialty}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          specialty: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Chọn chuyên khoa</option>
                      {specialtyOptions.map((specialty, index) => (
                        <option key={index} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Số điện thoại *:</label>
                    <input
                      type="tel"
                      value={newDoctor.phone}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email *:</label>
                    <input
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Bằng cấp:</label>
                    <select
                      value={newDoctor.degree}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, degree: e.target.value })
                      }
                    >
                      <option value="">Chọn bằng cấp</option>
                      {degreeOptions.map((degree, index) => (
                        <option key={index} value={degree}>
                          {degree}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Vị trí:</label>
                    <select
                      value={newDoctor.position}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, position: e.target.value })
                      }
                    >
                      <option value="">Chọn vị trí</option>
                      {positionOptions.map((position, index) => (
                        <option key={index} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Username:</label>
                    <input
                      type="text"
                      value={newDoctor.username}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, username: e.target.value })
                      }
                      placeholder="Tự động tạo từ email nếu để trống"
                    />
                  </div>
                  {!editingDoctor && (
                    <div className="form-field">
                      <label>Mật khẩu:</label>
                      <input
                        type="password"
                        value={newDoctor.password}
                        onChange={(e) =>
                          setNewDoctor({
                            ...newDoctor,
                            password: e.target.value,
                          })
                        }
                        placeholder="Để trống sẽ tạo mật khẩu mặc định"
                      />
                    </div>
                  )}
                  <div className="form-field">
                    <label>Số phòng:</label>
                    <input
                      type="text"
                      value={newDoctor.roomNumber}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          roomNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Tầng:</label>
                    <input
                      type="text"
                      value={newDoctor.floor}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, floor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="success-button"
                    onClick={
                      editingDoctor ? handleUpdateDoctor : handleAddDoctor
                    }
                  >
                    💾 {editingDoctor ? "Cập nhật" : "Lưu"} Bác sĩ
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      setShowDoctorForm(false);
                      setEditingDoctor(null);
                      resetDoctorForm();
                    }}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Tổng số bác sĩ</div>
                <div className="stat-value">{doctors.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Đã phân khoa</div>
                <div className="stat-value">
                  {doctors.filter((d) => d.departmentId).length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Số khoa</div>
                <div className="stat-value">{departments.length}</div>
              </div>
            </div>

            {doctors.length === 0 ? (
              <div className="empty-state">
                <p>Không có bác sĩ nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Giới tính</th>
                      <th>Chuyên khoa</th>
                      <th>Khoa</th>
                      <th>SĐT</th>
                      <th>Email</th>
                      <th>Bằng cấp</th>
                      <th>Phòng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td>
                          <div className="doctor-info">
                            <strong>{doctor.fullName || "N/A"}</strong>
                            <small>{doctor.position || "Bác sĩ"}</small>
                            <small className="debug-id">
                              ID: {doctor.id || "N/A"}
                            </small>
                          </div>
                        </td>
                        <td>{getGenderLabel(doctor.gender)}</td>
                        <td>{doctor.specialty || "N/A"}</td>
                        <td>{getDepartmentName(doctor.departmentId)}</td>
                        <td>{doctor.phone || "N/A"}</td>
                        <td>{doctor.email || "N/A"}</td>
                        <td>{doctor.degree || "N/A"}</td>
                        <td>
                          {doctor.roomNumber
                            ? `P${doctor.roomNumber} - T${doctor.floor || "1"}`
                            : "N/A"}
                        </td>
                        <td className="doctor-actions">
                          <button
                            className="edit-button"
                            onClick={() => handleEditDoctor(doctor)}
                            title="Chỉnh sửa"
                            disabled={!doctor.id}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => deleteDoctor(doctor.id)}
                            title="Xóa"
                            disabled={!doctor.id}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStructure;
