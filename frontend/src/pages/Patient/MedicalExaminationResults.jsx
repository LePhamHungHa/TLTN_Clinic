import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import {
  FaFileMedical,
  FaSearch,
  FaTimes,
  FaEye,
  FaPrint,
  FaDownload,
  FaShareAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaCalendar,
  FaUserMd,
  FaPills,
  FaNotesMedical,
  FaStethoscope,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaHome,
  FaPhoneAlt,
  FaQuestionCircle,
  FaRedo,
  FaClock,
} from "react-icons/fa";
import "../../css/MedicalExaminationResults.css";

const MedicalExaminationResults = () => {
  const [user, setUser] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // States for search
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");

  // States for detail view
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const getToken = useCallback(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      return JSON.parse(userData)?.token || null;
    } catch {
      return null;
    }
  }, []);

  const fetchMedicalRecords = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const token = getToken();
      if (!token) {
        setErrorMessage("Vui lòng đăng nhập để xem kết quả khám bệnh");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/patient/medical-records?patientId=${user.id}&page=${page}&size=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMedicalRecords(data.medicalRecords || []);
        setTotalRecords(data.totalItems || 0);
      } else {
        setErrorMessage(data.message || "Không thể tải dữ liệu");
      }
    } catch (err) {
      console.error("Error fetching medical records:", err);
      setErrorMessage("Lỗi khi kết nối đến server");
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, getToken]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMedicalRecords();
    }
  }, [user, fetchMedicalRecords]);

  const handleSearch = async () => {
    if (!user?.id) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const token = getToken();
      let url = `http://localhost:8080/api/patient/medical-records/search?patientId=${user.id}&page=0&size=${rowsPerPage}`;

      if (searchKeyword) {
        url += `&keyword=${encodeURIComponent(searchKeyword)}`;
      }
      if (searchFromDate) {
        url += `&fromDate=${searchFromDate}`;
      }
      if (searchToDate) {
        url += `&toDate=${searchToDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMedicalRecords(data.medicalRecords || []);
        setTotalRecords(data.totalItems || 0);
        setPage(0);
      } else {
        setErrorMessage(data.message || "Không thể tìm kiếm dữ liệu");
      }
    } catch (err) {
      console.error("Error searching medical records:", err);
      setErrorMessage("Lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setSearchFromDate("");
    setSearchToDate("");
    if (user?.id) {
      fetchMedicalRecords();
    }
  };

  const handleViewDetail = async (recordId) => {
    setDetailLoading(true);

    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:8080/api/patient/medical-records/${recordId}?patientId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSelectedRecord(data.medicalRecord);
        setDetailDialogOpen(true);
      } else {
        setErrorMessage(data.message || "Không thể xem chi tiết");
      }
    } catch (err) {
      console.error("Error fetching record detail:", err);
      setErrorMessage("Lỗi khi lấy chi tiết");
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = (record) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Kết quả khám bệnh</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; color: #1976d2; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #666; }
            .medication-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .medication-table th { background-color: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; }
            .medication-table td { padding: 8px; border: 1px solid #ddd; }
            .signature { margin-top: 50px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KẾT QUẢ KHÁM BỆNH</h1>
            <p>Bệnh viện Đa khoa Quốc tế</p>
          </div>
          
          <div class="section">
            <div class="section-title">THÔNG TIN CHUNG</div>
            <div class="info-grid">
              <div class="info-label">Ngày khám:</div>
              <div>${format(new Date(record.examinationDate), "dd/MM/yyyy", {
                locale: vi,
              })}</div>
              
              <div class="info-label">Bác sĩ khám:</div>
              <div>${record.doctorName || "Không xác định"}</div>
              
              <div class="info-label">Chuyên khoa:</div>
              <div>${record.doctorSpecialty || "Không xác định"}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">THÔNG TIN KHÁM</div>
            <div class="info-grid">
              <div class="info-label">Triệu chứng chính:</div>
              <div>${record.chiefComplaint || "Không có"}</div>
              
              <div class="info-label">Tiền sử bệnh:</div>
              <div>${record.historyOfIllness || "Không có"}</div>
              
              <div class="info-label">Khám thực thể:</div>
              <div>${record.physicalExamination || "Không có"}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">CHẨN ĐOÁN</div>
            <div class="info-grid">
              <div class="info-label">Chẩn đoán sơ bộ:</div>
              <div>${record.preliminaryDiagnosis || "Không có"}</div>
              
              <div class="info-label">Chẩn đoán chính thức:</div>
              <div>${record.finalDiagnosis || "Không có"}</div>
            </div>
          </div>
          
          ${
            record.medications && record.medications.length > 0
              ? `
          <div class="section">
            <div class="section-title">THUỐC ĐƯỢC KÊ</div>
            <table class="medication-table">
              <thead>
                <tr>
                  <th>Tên thuốc</th>
                  <th>Liều lượng</th>
                  <th>Tần suất</th>
                  <th>Thời gian</th>
                  <th>Hướng dẫn</th>
                </tr>
              </thead>
              <tbody>
                ${record.medications
                  .map(
                    (med) => `
                  <tr>
                    <td>${med.name || ""}</td>
                    <td>${med.dosage || ""}</td>
                    <td>${med.frequency || ""}</td>
                    <td>${med.duration || ""}</td>
                    <td>${med.instructions || ""}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <div class="section-title">HƯỚNG DẪN & LỜI KHUYÊN</div>
            <div>${record.advice || "Không có lời khuyên cụ thể"}</div>
          </div>
          
          <div class="signature">
            <p>Ngày ${format(new Date(), "dd/MM/yyyy", { locale: vi })}</p>
            <p><strong>Bác sĩ điều trị</strong></p>
            <p>${record.doctorName || ""}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: {
        label: "ĐÃ HOÀN THÀNH",
        class: "status-completed",
        icon: <FaClipboardCheck size={14} />,
      },
      IN_PROGRESS: {
        label: "ĐANG KHÁM",
        class: "status-in-progress",
        icon: <FaStethoscope size={14} />,
      },
      PENDING: {
        label: "CHỜ KHÁM",
        class: "status-pending",
        icon: <FaClock size={14} />,
      },
      CANCELLED: {
        label: "ĐÃ HỦY",
        class: "status-cancelled",
        icon: <FaTimes size={14} />,
      },
    };

    const config = statusConfig[status] || {
      label: "KHÔNG XÁC ĐỊNH",
      class: "status-default",
      icon: <FaInfoCircle size={14} />,
    };

    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const startIndex = page * rowsPerPage;
  const currentRecords = medicalRecords;
  const endIndex = startIndex + (medicalRecords ? medicalRecords.length : 0);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  };

  // const formatDateTime = (dateString) => {
  //   if (!dateString) return "Chưa có";
  //   return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  // };

  if (loading && medicalRecords.length === 0) {
    return (
      <div className="medical-results-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large">
              <FaSpinner className="animate-spin" size={48} />
            </div>
            <p className="loading-text">Đang tải kết quả khám bệnh...</p>
            <p className="loading-subtext">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-results-container">
      {/* Header */}
      <div className="patient-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <FaFileMedical size={40} />
          </div>
          <h1 className="header-title">KẾT QUẢ KHÁM BỆNH</h1>
          <p className="header-subtitle">
            Toàn bộ kết quả khám bệnh của bạn được lưu ở trang này
          </p>
        </div>
      </div>

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="error-message-card">
          <div className="error-icon">
            <FaExclamationTriangle size={40} />
          </div>
          <div className="error-content">
            <h4>CÓ LỖI XẢY RA</h4>
            <p>{errorMessage}</p>
          </div>
          <button className="retry-button-large" onClick={fetchMedicalRecords}>
            <FaRedo size={18} />
            THỬ LẠI
          </button>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaFileMedical size={32} />
          </div>
          <div className="stat-content">
            <h3>Tổng số kết quả</h3>
            <p className="stat-number">{totalRecords}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaClipboardCheck size={32} />
          </div>
          <div className="stat-content">
            <h3>Đã hoàn thành</h3>
            <p className="stat-number">
              {
                medicalRecords.filter(
                  (r) => r.examinationStatus === "COMPLETED",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaStethoscope size={32} />
          </div>
          <div className="stat-content">
            <h3>Đang khám</h3>
            <p className="stat-number">
              {
                medicalRecords.filter(
                  (r) => r.examinationStatus === "IN_PROGRESS",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaPills size={32} />
          </div>
          <div className="stat-content">
            <h3>Có thuốc kê</h3>
            <p className="stat-number">
              {
                medicalRecords.filter(
                  (r) => r.medications && r.medications.length > 0,
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Bộ lọc đơn giản */}
      <div className="simple-filters">
        <div className="filters-title">
          <FaSearch size={24} />
          <h2>TÌM KẾT QUẢ KHÁM</h2>
        </div>

        <div className="filter-row single">
          <div className="filter-group">
            <label htmlFor="keyword-search">
              <FaSearch size={18} />
              <span>Từ khóa</span>
            </label>
            <input
              id="keyword-search"
              type="text"
              placeholder="Triệu chứng, chẩn đoán, bác sĩ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="from-date">
              <FaCalendar size={18} />
              <span>Từ ngày</span>
            </label>
            <input
              id="from-date"
              type="date"
              value={searchFromDate}
              onChange={(e) => setSearchFromDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="to-date">
              <FaCalendar size={18} />
              <span>Đến ngày</span>
            </label>
            <input
              id="to-date"
              type="date"
              value={searchToDate}
              onChange={(e) => setSearchToDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group form-buttons">
            <button className="search-button" onClick={handleSearch}>
              <FaSearch size={18} />
              TÌM KIẾM
            </button>
            {(searchKeyword || searchFromDate || searchToDate) && (
              <button
                className="clear-filters-button"
                onClick={handleClearSearch}
              >
                <FaTimes size={18} />
                XÓA BỘ LỌC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách kết quả */}
      <div className="results-section">
        <div className="section-header">
          <div className="section-title">
            <FaFileMedical size={24} />
            <h2>
              DANH SÁCH KẾT QUẢ
              <span className="record-count"> ({currentRecords.length})</span>
            </h2>
          </div>
          <button className="refresh-button" onClick={fetchMedicalRecords}>
            <FaRedo size={18} />
            <span>LÀM MỚI</span>
          </button>
        </div>

        {medicalRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileMedical size={80} />
            </div>
            <h3>KHÔNG CÓ KẾT QUẢ NÀO</h3>
            <p>
              {searchKeyword || searchFromDate || searchToDate
                ? "Không tìm thấy kết quả khám nào phù hợp với bộ lọc"
                : "Bạn chưa có kết quả khám bệnh nào"}
            </p>
          </div>
        ) : (
          <>
            <div className="results-table-container">
              <div className="table-responsive">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Ngày khám</th>
                      <th>Triệu chứng</th>
                      <th>Chẩn đoán</th>
                      <th>Bác sĩ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác (Xem chi tiết, In)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          {record.examinationDate
                            ? formatDate(record.examinationDate)
                            : "Không xác định"}
                        </td>
                        <td
                          className="text-truncate"
                          title={record.chiefComplaint || "Không có"}
                        >
                          {record.chiefComplaint || "Không có"}
                        </td>
                        <td
                          className="text-truncate"
                          title={record.finalDiagnosis || "Không có"}
                        >
                          {record.finalDiagnosis || "Không có"}
                        </td>
                        <td>
                          <div className="doctor-info">
                            <FaUserMd size={18} />
                            <div>
                              <strong>
                                {record.doctorName || "Không xác định"}
                              </strong>
                              <small>{record.doctorSpecialty || ""}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(record.examinationStatus)}</td>
                        <td className="action-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-info action-btn-view"
                              onClick={() => handleViewDetail(record.id)}
                              disabled={detailLoading}
                              aria-label="Xem chi tiết"
                              title="Xem chi tiết"
                            >
                              <FaEye aria-hidden="true" />
                              <span className="action-label">Xem chi tiết</span>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary action-btn-print"
                              onClick={() => handlePrint(record)}
                              aria-label="In kết quả"
                              title="In kết quả"
                            >
                              <FaPrint aria-hidden="true" />
                              <span className="action-label">In</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="pagination-info">
                  Hiển thị {startIndex + 1} - {endIndex} trên {totalRecords} kết
                  quả
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-sm"
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                  >
                    <FaChevronLeft size={16} /> Trước
                  </button>
                  <span className="page-numbers">
                    Trang {page + 1} /{" "}
                    {Math.max(1, Math.ceil(totalRecords / rowsPerPage))}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={endIndex >= totalRecords}
                  >
                    Sau <FaChevronRight size={16} />
                  </button>
                </div>
                {/* page-size selector removed per UX request */}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal chi tiết kết quả */}
      {detailDialogOpen && selectedRecord && (
        <div
          className="modal-overlay"
          onClick={() => setDetailDialogOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="modal-loading">
                <FaSpinner className="animate-spin" size={32} />
                <p>Đang tải chi tiết...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>
                    <FaFileMedical size={24} />
                    <span>CHI TIẾT KẾT QUẢ KHÁM</span>
                  </h2>
                  <button
                    className="close-modal"
                    onClick={() => setDetailDialogOpen(false)}
                    aria-label="Đóng cửa sổ"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  {/* Thông tin chung */}
                  <div className="detail-section">
                    <h3 className="section-title">
                      <FaInfoCircle size={18} />
                      <span>THÔNG TIN CHUNG</span>
                    </h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Ngày khám:</span>
                        <span className="info-value">
                          {formatDate(selectedRecord.examinationDate)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Bác sĩ:</span>
                        <span className="info-value highlight">
                          {selectedRecord.doctorName}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Chuyên khoa:</span>
                        <span className="info-value">
                          {selectedRecord.doctorSpecialty}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Trạng thái:</span>
                        <span className="info-value">
                          {getStatusBadge(selectedRecord.examinationStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin khám */}
                  <div className="detail-section">
                    <h3 className="section-title">
                      <FaStethoscope size={18} />
                      <span>THÔNG TIN KHÁM</span>
                    </h3>
                    <div className="info-content">
                      <div className="info-block">
                        <h4>Triệu chứng chính:</h4>
                        <div className="info-text">
                          {selectedRecord.chiefComplaint || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Tiền sử bệnh:</h4>
                        <div className="info-text">
                          {selectedRecord.historyOfIllness || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Khám thực thể:</h4>
                        <div className="info-text">
                          {selectedRecord.physicalExamination || "Không có"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chẩn đoán */}
                  <div className="detail-section">
                    <h3 className="section-title">
                      <FaNotesMedical size={18} />
                      <span>CHẨN ĐOÁN</span>
                    </h3>
                    <div className="info-content">
                      <div className="info-block">
                        <h4>Chẩn đoán sơ bộ:</h4>
                        <div className="info-text">
                          {selectedRecord.preliminaryDiagnosis || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Chẩn đoán chính thức:</h4>
                        <div className="info-text">
                          {selectedRecord.finalDiagnosis || "Không có"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thuốc được kê */}
                  {selectedRecord.medications &&
                    selectedRecord.medications.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <FaPills size={18} />
                          <span>THUỐC ĐƯỢC KÊ</span>
                        </h3>
                        <div className="medication-table-container">
                          <table className="medication-table">
                            <thead>
                              <tr>
                                <th>Tên thuốc</th>
                                <th>Liều lượng</th>
                                <th>Tần suất</th>
                                <th>Thời gian</th>
                                <th>Hướng dẫn</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.medications.map((med, index) => (
                                <tr key={index}>
                                  <td>{med.name || ""}</td>
                                  <td>{med.dosage || ""}</td>
                                  <td>{med.frequency || ""}</td>
                                  <td>{med.duration || ""}</td>
                                  <td>{med.instructions || ""}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Hướng dẫn & lời khuyên */}
                  <div className="detail-section">
                    <h3 className="section-title">
                      <FaClipboardCheck size={18} />
                      <span>HƯỚNG DẪN & LỜI KHUYÊN</span>
                    </h3>
                    <div className="advice-content">
                      <div className="advice-text">
                        {selectedRecord.advice || "Không có lời khuyên cụ thể"}
                      </div>
                      {selectedRecord.followUpDate && (
                        <div className="follow-up-info">
                          <div className="follow-up-icon">
                            <FaCalendar size={16} />
                          </div>
                          <div className="follow-up-text">
                            <strong>HẸN TÁI KHÁM:</strong>{" "}
                            {formatDate(selectedRecord.followUpDate)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-button secondary"
                    onClick={() => setDetailDialogOpen(false)}
                  >
                    ĐÓNG
                  </button>
                  <button
                    className="modal-button primary"
                    onClick={() => handlePrint(selectedRecord)}
                  >
                    <FaPrint size={18} />
                    IN KẾT QUẢ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hỗ trợ nhanh */}
      <div className="quick-help">
        <div className="help-header">
          <FaPhoneAlt size={24} />
          <h3>CẦN HỖ TRỢ?</h3>
        </div>
        <p>
          Gọi tổng đài: <strong>1900 1234</strong> (Miễn phí)
        </p>
        <p className="help-time">Thời gian: 7:00 - 22:00 hàng ngày</p>
        <button className="help-button">
          <FaQuestionCircle size={20} />
          <span>HƯỚNG DẪN CHI TIẾT</span>
        </button>
      </div>
    </div>
  );
};

export default MedicalExaminationResults;
