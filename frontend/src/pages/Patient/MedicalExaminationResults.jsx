import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import "../../css/MedicalExaminationResults.css";

const MedicalExaminationResults = () => {
  const [userData, setUserData] = useState(null);
  const [examinationData, setExaminationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getAuthToken = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser)?.token || null;
    } catch {
      return null;
    }
  }, []);

  const loadExaminationData = useCallback(async () => {
    if (!userData?.id) return;

    setIsLoading(true);
    setErrorText("");

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        setErrorText("Vui lòng đăng nhập để xem kết quả");
        setIsLoading(false);
        return;
      }

      const apiResponse = await fetch(
        `http://localhost:8080/api/patient/medical-records?patientId=${userData.id}&page=${currentPage}&size=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!apiResponse.ok) {
        throw new Error(`Lỗi HTTP! Mã lỗi: ${apiResponse.status}`);
      }

      const resultData = await apiResponse.json();

      if (resultData.success) {
        setExaminationData(resultData.medicalRecords || []);
        setTotalItems(resultData.totalItems || 0);
      } else {
        setErrorText(resultData.message || "Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      setErrorText("Lỗi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  }, [userData, currentPage, itemsPerPage, getAuthToken]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (parseError) {
        console.error("Lỗi phân tích dữ liệu người dùng:", parseError);
      }
    }
  }, []);

  useEffect(() => {
    if (userData?.id) {
      loadExaminationData();
    }
  }, [userData, loadExaminationData]);

  const performSearch = async () => {
    if (!userData?.id) return;

    setIsLoading(true);
    setErrorText("");

    try {
      const authToken = getAuthToken();
      let apiUrl = `http://localhost:8080/api/patient/medical-records/search?patientId=${userData.id}&page=0&size=${itemsPerPage}`;

      if (searchText) {
        apiUrl += `&keyword=${encodeURIComponent(searchText)}`;
      }
      if (startDate) {
        apiUrl += `&fromDate=${startDate}`;
      }
      if (endDate) {
        apiUrl += `&toDate=${endDate}`;
      }

      const apiResponse = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!apiResponse.ok) {
        throw new Error(`Lỗi HTTP! Mã lỗi: ${apiResponse.status}`);
      }

      const resultData = await apiResponse.json();

      if (resultData.success) {
        setExaminationData(resultData.medicalRecords || []);
        setTotalItems(resultData.totalItems || 0);
        setCurrentPage(0);
      } else {
        setErrorText(resultData.message || "Không thể thực hiện tìm kiếm");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      setErrorText("Lỗi trong quá trình tìm kiếm");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearchFilters = () => {
    setSearchText("");
    setStartDate("");
    setEndDate("");
    if (userData?.id) {
      loadExaminationData();
    }
  };

  const viewDetail = async (recordId) => {
    setLoadingDetail(true);

    try {
      const authToken = getAuthToken();
      const apiResponse = await fetch(
        `http://localhost:8080/api/patient/medical-records/${recordId}?patientId=${userData.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!apiResponse.ok) {
        throw new Error(`Lỗi HTTP! Mã lỗi: ${apiResponse.status}`);
      }

      const resultData = await apiResponse.json();

      if (resultData.success) {
        setSelectedItem(resultData.medicalRecord);
        setShowDetail(true);
      } else {
        setErrorText(resultData.message || "Không thể xem chi tiết");
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết:", error);
      setErrorText("Lỗi khi truy xuất dữ liệu chi tiết");
    } finally {
      setLoadingDetail(false);
    }
  };

  const printRecord = (record) => {
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

  const changePage = (newPage) => {
    setCurrentPage(newPage);
  };

  const getStatusDisplay = (status) => {
    const statusOptions = {
      COMPLETED: {
        label: "ĐÃ HOÀN THÀNH",
        className: "status-completed",
      },
      IN_PROGRESS: {
        label: "ĐANG KHÁM",
        className: "status-in-progress",
      },
      PENDING: {
        label: "CHỜ KHÁM",
        className: "status-pending",
      },
      CANCELLED: {
        label: "ĐÃ HỦY",
        className: "status-cancelled",
      },
    };

    const option = statusOptions[status] || {
      label: "KHÔNG XÁC ĐỊNH",
      className: "status-default",
    };

    return (
      <span className={`status-badge ${option.className}`}>
        <span>{option.label}</span>
      </span>
    );
  };

  const startIndex = currentPage * itemsPerPage;
  const currentRecords = examinationData;
  const endIndex = startIndex + (examinationData ? examinationData.length : 0);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Chưa có";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  };

  if (isLoading && examinationData.length === 0) {
    return (
      <div className="medical-results-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large">
              <div className="spinner-icon"></div>
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
      <div className="patient-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <div className="header-icon"></div>
          </div>
          <h1 className="header-title">KẾT QUẢ KHÁM BỆNH</h1>
          <p className="header-subtitle">
            Toàn bộ kết quả khám bệnh của bạn được lưu ở trang này
          </p>
        </div>
      </div>

      {errorText && (
        <div className="error-message-card">
          <div className="error-icon">
            <div className="error-icon-img"></div>
          </div>
          <div className="error-content">
            <h4>CÓ LỖI XẢY RA</h4>
            <p>{errorText}</p>
          </div>
          <button className="retry-button-large" onClick={loadExaminationData}>
            <div className="retry-icon"></div>
            THỬ LẠI
          </button>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <div className="stat-icon-img"></div>
          </div>
          <div className="stat-content">
            <h3>Tổng số kết quả</h3>
            <p className="stat-number">{totalItems}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="stat-icon-img"></div>
          </div>
          <div className="stat-content">
            <h3>Đã hoàn thành</h3>
            <p className="stat-number">
              {
                examinationData.filter(
                  (r) => r.examinationStatus === "COMPLETED",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="stat-icon-img"></div>
          </div>
          <div className="stat-content">
            <h3>Đang khám</h3>
            <p className="stat-number">
              {
                examinationData.filter(
                  (r) => r.examinationStatus === "IN_PROGRESS",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <div className="stat-icon-img"></div>
          </div>
          <div className="stat-content">
            <h3>Có thuốc kê</h3>
            <p className="stat-number">
              {
                examinationData.filter(
                  (r) => r.medications && r.medications.length > 0,
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      <div className="simple-filters">
        <div className="filters-title">
          <div className="filter-title-icon"></div>
          <h2>TÌM KẾT QUẢ KHÁM</h2>
        </div>

        <div className="filter-row single">
          <div className="filter-group">
            <label htmlFor="keyword-search">
              <div className="filter-label-icon"></div>
              <span>Từ khóa</span>
            </label>
            <input
              id="keyword-search"
              type="text"
              placeholder="Triệu chứng, chẩn đoán, bác sĩ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="from-date">
              <div className="filter-label-icon"></div>
              <span>Từ ngày</span>
            </label>
            <input
              id="from-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="to-date">
              <div className="filter-label-icon"></div>
              <span>Đến ngày</span>
            </label>
            <input
              id="to-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group form-buttons">
            <button className="search-button" onClick={performSearch}>
              <div className="search-button-icon"></div>
              TÌM KIẾM
            </button>
            {(searchText || startDate || endDate) && (
              <button
                className="clear-filters-button"
                onClick={resetSearchFilters}
              >
                <div className="clear-button-icon"></div>
                XÓA BỘ LỌC
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="results-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-title-icon"></div>
            <h2>
              DANH SÁCH KẾT QUẢ
              <span className="record-count"> ({currentRecords.length})</span>
            </h2>
          </div>
          <button className="refresh-button" onClick={loadExaminationData}>
            <div className="refresh-icon"></div>
            <span>LÀM MỚI</span>
          </button>
        </div>

        {examinationData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <div className="empty-icon-img"></div>
            </div>
            <h3>KHÔNG CÓ KẾT QUẢ NÀO</h3>
            <p>
              {searchText || startDate || endDate
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
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          {record.examinationDate
                            ? formatDateDisplay(record.examinationDate)
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
                            <div className="doctor-icon"></div>
                            <div>
                              <strong>
                                {record.doctorName || "Không xác định"}
                              </strong>
                              <small>{record.doctorSpecialty || ""}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusDisplay(record.examinationStatus)}</td>
                        <td className="action-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-info action-btn-view"
                              onClick={() => viewDetail(record.id)}
                              disabled={loadingDetail}
                              aria-label="Xem chi tiết"
                              title="Xem chi tiết"
                            >
                              <div className="view-icon"></div>
                              <span className="action-label">Xem chi tiết</span>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary action-btn-print"
                              onClick={() => printRecord(record)}
                              aria-label="In kết quả"
                              title="In kết quả"
                            >
                              <div className="print-icon"></div>
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
                  Hiển thị {startIndex + 1} - {endIndex} trên {totalItems} kết
                  quả
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-sm"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <div className="prev-icon"></div> Trước
                  </button>
                  <span className="page-numbers">
                    Trang {currentPage + 1} /{" "}
                    {Math.max(1, Math.ceil(totalItems / itemsPerPage))}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={endIndex >= totalItems}
                  >
                    Sau <div className="next-icon"></div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div className="modal-loading">
                <div className="modal-spinner"></div>
                <p>Đang tải chi tiết...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>
                    <div className="modal-title-icon"></div>
                    <span>CHI TIẾT KẾT QUẢ KHÁM</span>
                  </h2>
                  <button
                    className="close-modal"
                    onClick={() => setShowDetail(false)}
                    aria-label="Đóng cửa sổ"
                  >
                    <div className="close-icon"></div>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-section">
                    <h3 className="section-title">
                      <div className="section-title-icon-small"></div>
                      <span>THÔNG TIN CHUNG</span>
                    </h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Ngày khám:</span>
                        <span className="info-value">
                          {formatDateDisplay(selectedItem.examinationDate)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Bác sĩ:</span>
                        <span className="info-value highlight">
                          {selectedItem.doctorName}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Chuyên khoa:</span>
                        <span className="info-value">
                          {selectedItem.doctorSpecialty}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Trạng thái:</span>
                        <span className="info-value">
                          {getStatusDisplay(selectedItem.examinationStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">
                      <div className="section-title-icon-small"></div>
                      <span>THÔNG TIN KHÁM</span>
                    </h3>
                    <div className="info-content">
                      <div className="info-block">
                        <h4>Triệu chứng chính:</h4>
                        <div className="info-text">
                          {selectedItem.chiefComplaint || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Tiền sử bệnh:</h4>
                        <div className="info-text">
                          {selectedItem.historyOfIllness || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Khám thực thể:</h4>
                        <div className="info-text">
                          {selectedItem.physicalExamination || "Không có"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="section-title">
                      <div className="section-title-icon-small"></div>
                      <span>CHẨN ĐOÁN</span>
                    </h3>
                    <div className="info-content">
                      <div className="info-block">
                        <h4>Chẩn đoán sơ bộ:</h4>
                        <div className="info-text">
                          {selectedItem.preliminaryDiagnosis || "Không có"}
                        </div>
                      </div>
                      <div className="info-block">
                        <h4>Chẩn đoán chính thức:</h4>
                        <div className="info-text">
                          {selectedItem.finalDiagnosis || "Không có"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedItem.medications &&
                    selectedItem.medications.length > 0 && (
                      <div className="detail-section">
                        <h3 className="section-title">
                          <div className="section-title-icon-small"></div>
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
                              {selectedItem.medications.map((med, index) => (
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

                  <div className="detail-section">
                    <h3 className="section-title">
                      <div className="section-title-icon-small"></div>
                      <span>HƯỚNG DẪN & LỜI KHUYÊN</span>
                    </h3>
                    <div className="advice-content">
                      <div className="advice-text">
                        {selectedItem.advice || "Không có lời khuyên cụ thể"}
                      </div>
                      {selectedItem.followUpDate && (
                        <div className="follow-up-info">
                          <div className="follow-up-icon">
                            <div className="calendar-icon-small"></div>
                          </div>
                          <div className="follow-up-text">
                            <strong>HẸN TÁI KHÁM:</strong>{" "}
                            {formatDateDisplay(selectedItem.followUpDate)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-button secondary"
                    onClick={() => setShowDetail(false)}
                  >
                    ĐÓNG
                  </button>
                  <button
                    className="modal-button primary"
                    onClick={() => printRecord(selectedItem)}
                  >
                    <div className="print-icon-small"></div>
                    IN KẾT QUẢ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="quick-help">
        <div className="help-header">
          <div className="help-header-icon"></div>
          <h3>CẦN HỖ TRỢ?</h3>
        </div>
        <p>
          Gọi tổng đài: <strong>1900 1234</strong> (Miễn phí)
        </p>
        <p className="help-time">Thời gian: 7:00 - 22:00 hàng ngày</p>
        <button className="help-button">
          <div className="help-button-icon"></div>
          <span>HƯỚNG DẪN CHI TIẾT</span>
        </button>
      </div>
    </div>
  );
};

export default MedicalExaminationResults;
