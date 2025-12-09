import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import "../../css/MedicalExaminationResults.css";

const MedicalExaminationResults = () => {
  const [user, setUser] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // States for search
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");

  // States for detail view
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.id) {
          fetchMedicalRecords(parsedUser.id);
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, [page, rowsPerPage]);

  const fetchMedicalRecords = async (patientId) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/patient/medical-records?patientId=${patientId}&page=${page}&size=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMedicalRecords(data.medicalRecords || []);
        setTotalRecords(data.totalItems || 0);
      } else {
        setError(data.message || "Không thể tải dữ liệu");
      }
    } catch (err) {
      console.error("Error fetching medical records:", err);
      setError("Lỗi khi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
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
        setError(data.message || "Không thể tìm kiếm dữ liệu");
      }
    } catch (err) {
      console.error("Error searching medical records:", err);
      setError("Lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setSearchFromDate("");
    setSearchToDate("");
    if (user?.id) {
      fetchMedicalRecords(user.id);
    }
  };

  const handleViewDetail = async (recordId) => {
    setDetailLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/patient/medical-records/${recordId}?patientId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSelectedRecord(data.medicalRecord);
        setDetailDialogOpen(true);
      } else {
        setError(data.message || "Không thể xem chi tiết");
      }
    } catch (err) {
      console.error("Error fetching record detail:", err);
      setError("Lỗi khi lấy chi tiết");
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
                `
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status) => {
    let className = "status-badge ";
    let label = status || "Không xác định";

    switch (status) {
      case "COMPLETED":
        className += "status-completed";
        label = "Đã hoàn thành";
        break;
      case "IN_PROGRESS":
        className += "status-in-progress";
        label = "Đang khám";
        break;
      case "PENDING":
        className += "status-pending";
        label = "Chờ khám";
        break;
      case "CANCELLED":
        className += "status-cancelled";
        label = "Đã hủy";
        break;
      default:
        className += "status-default";
    }

    return <span className={className}>{label}</span>;
  };

  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
  const currentRecords = medicalRecords.slice(startIndex, endIndex);

  return (
    <div className="medical-examination-results-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-file-medical"></i> KẾT QUẢ KHÁM BỆNH
          </h1>
          <p className="page-subtitle">
            Xem và quản lý toàn bộ kết quả khám bệnh của bạn
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Search Section */}
        <div className="search-section card">
          <h3 className="search-title">
            <i className="fas fa-search"></i> Tìm kiếm kết quả khám
          </h3>

          <div className="search-form">
            <div className="form-row">
              <div className="form-group">
                <label>Tìm kiếm theo triệu chứng, chẩn đoán...</label>
                <input
                  type="text"
                  className="form-control"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm..."
                />
              </div>
              <div className="form-group">
                <label>Từ ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={searchFromDate}
                  onChange={(e) => setSearchFromDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Đến ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={searchToDate}
                  onChange={(e) => setSearchToDate(e.target.value)}
                />
              </div>
              <div className="form-group form-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <i className="fas fa-search"></i> Tìm kiếm
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleClearSearch}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section card">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : medicalRecords.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-medical-alt"></i>
              <p>
                {searchKeyword || searchFromDate || searchToDate
                  ? "Không tìm thấy kết quả khám nào phù hợp"
                  : "Chưa có kết quả khám nào"}
              </p>
            </div>
          ) : (
            <>
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
                            ? format(
                                new Date(record.examinationDate),
                                "dd/MM/yyyy",
                                { locale: vi }
                              )
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
                            <i className="fas fa-user-md"></i>
                            <div>
                              <strong>
                                {record.doctorName || "Không xác định"}
                              </strong>
                              <small>{record.doctorSpecialty || ""}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusChip(record.examinationStatus)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewDetail(record.id)}
                              disabled={detailLoading}
                              title="Xem chi tiết"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handlePrint(record)}
                              title="In kết quả"
                            >
                              <i className="fas fa-print"></i>
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
                    onClick={() => handleChangePage(null, page - 1)}
                    disabled={page === 0}
                  >
                    <i className="fas fa-chevron-left"></i> Trước
                  </button>
                  <span className="page-numbers">
                    Trang {page + 1} / {Math.ceil(totalRecords / rowsPerPage)}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleChangePage(null, page + 1)}
                    disabled={endIndex >= totalRecords}
                  >
                    Sau <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <div className="page-size-selector">
                  <select
                    value={rowsPerPage}
                    onChange={(e) =>
                      handleChangeRowsPerPage({
                        target: { value: e.target.value },
                      })
                    }
                    className="form-control-sm"
                  >
                    <option value="5">5 dòng/trang</option>
                    <option value="10">10 dòng/trang</option>
                    <option value="25">25 dòng/trang</option>
                    <option value="50">50 dòng/trang</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Dialog */}
        {detailDialogOpen && (
          <div
            className="modal-overlay"
            onClick={() => setDetailDialogOpen(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {detailLoading ? (
                <div className="modal-loading">
                  <div className="spinner"></div>
                  <p>Đang tải chi tiết...</p>
                </div>
              ) : selectedRecord ? (
                <>
                  <div className="modal-header">
                    <h3>
                      <i className="fas fa-file-medical-alt"></i> Chi tiết kết
                      quả khám
                    </h3>
                    <button
                      className="btn btn-close"
                      onClick={() => setDetailDialogOpen(false)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="modal-body">
                    {/* Thông tin chung */}
                    <div className="detail-section">
                      <h4 className="section-title">Thông tin chung</h4>
                      <div className="info-grid">
                        <div className="info-row">
                          <span className="info-label">Ngày khám:</span>
                          <span className="info-value">
                            {selectedRecord.examinationDate
                              ? format(
                                  new Date(selectedRecord.examinationDate),
                                  "dd/MM/yyyy",
                                  { locale: vi }
                                )
                              : "Không xác định"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Bác sĩ:</span>
                          <span className="info-value">
                            {selectedRecord.doctorName || "Không xác định"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Chuyên khoa:</span>
                          <span className="info-value">
                            {selectedRecord.doctorSpecialty || "Không xác định"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Trạng thái:</span>
                          <span className="info-value">
                            {getStatusChip(selectedRecord.examinationStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin khám */}
                    <div className="detail-section">
                      <h4 className="section-title">Thông tin khám bệnh</h4>
                      <div className="info-grid">
                        <div className="info-row full-width">
                          <span className="info-label">Triệu chứng chính:</span>
                          <div className="info-value multiline">
                            {selectedRecord.chiefComplaint || "Không có"}
                          </div>
                        </div>
                        <div className="info-row full-width">
                          <span className="info-label">Tiền sử bệnh:</span>
                          <div className="info-value multiline">
                            {selectedRecord.historyOfIllness || "Không có"}
                          </div>
                        </div>
                        <div className="info-row full-width">
                          <span className="info-label">Khám thực thể:</span>
                          <div className="info-value multiline">
                            {selectedRecord.physicalExamination || "Không có"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chẩn đoán */}
                    <div className="detail-section">
                      <h4 className="section-title">Chẩn đoán</h4>
                      <div className="info-grid">
                        <div className="info-row full-width">
                          <span className="info-label">Chẩn đoán sơ bộ:</span>
                          <div className="info-value multiline">
                            {selectedRecord.preliminaryDiagnosis || "Không có"}
                          </div>
                        </div>
                        <div className="info-row full-width">
                          <span className="info-label">
                            Chẩn đoán chính thức:
                          </span>
                          <div className="info-value multiline">
                            {selectedRecord.finalDiagnosis || "Không có"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thuốc */}
                    {selectedRecord.medications &&
                      selectedRecord.medications.length > 0 && (
                        <div className="detail-section">
                          <h4 className="section-title">Thuốc được kê</h4>
                          <div className="table-responsive">
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
                                {selectedRecord.medications.map(
                                  (med, index) => (
                                    <tr key={index}>
                                      <td>{med.name || ""}</td>
                                      <td>{med.dosage || ""}</td>
                                      <td>{med.frequency || ""}</td>
                                      <td>{med.duration || ""}</td>
                                      <td>{med.instructions || ""}</td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {/* Lời khuyên */}
                    <div className="detail-section">
                      <h4 className="section-title">Hướng dẫn & Lời khuyên</h4>
                      <div className="advice-content">
                        {selectedRecord.advice || "Không có lời khuyên cụ thể"}
                      </div>
                      {selectedRecord.followUpDate && (
                        <div className="follow-up-info">
                          <strong>Hẹn tái khám:</strong>{" "}
                          {format(
                            new Date(selectedRecord.followUpDate),
                            "dd/MM/yyyy",
                            { locale: vi }
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setDetailDialogOpen(false)}
                    >
                      Đóng
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handlePrint(selectedRecord)}
                    >
                      <i className="fas fa-print"></i> In kết quả
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalExaminationResults;
