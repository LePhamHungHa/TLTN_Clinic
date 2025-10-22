import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import bmiService from "../../api/bmiService";
import "../../css/BMIPage.css";

const BMIPage = () => {
  const [bmiData, setBmiData] = useState({
    height: "",
    weight: "",
    gender: "",
    measurementDate: new Date().toISOString().split("T")[0],
  });
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiHistory, setBmiHistory] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const toast = useToast();

  // Load lịch sử từ database
  useEffect(() => {
    loadBmiHistory();
  }, []);

  const loadBmiHistory = async () => {
    try {
      const response = await bmiService.getBmiHistory();
      if (response.success) {
        setBmiHistory(response.data);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi load lịch sử BMI:", error);
      toast.error("Lỗi khi tải lịch sử BMI!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBmiData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Tính BMI
  const calculateBMI = async () => {
    if (!bmiData.height || !bmiData.weight || !bmiData.gender) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const height = parseFloat(bmiData.height);
    const weight = parseFloat(bmiData.weight);

    if (height <= 0 || weight <= 0) {
      toast.error("Chiều cao và cân nặng phải lớn hơn 0!");
      return;
    }

    setIsCalculating(true);

    try {
      const response = await bmiService.calculateBmi({
        height: height,
        weight: weight,
        gender: bmiData.gender,
      });

      if (response.success) {
        setBmiResult({
          bmiValue: response.data.bmiValue,
          category: response.data.bmiCategory,
          gender: bmiData.gender,
        });
        toast.success("Tính BMI thành công!");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi tính BMI:", error);
      toast.error("Lỗi khi tính BMI!");
    } finally {
      setIsCalculating(false);
    }
  };

  // Lưu vào database
  const saveBMI = async () => {
    if (!bmiResult) {
      toast.error("Vui lòng tính BMI trước khi lưu!");
      return;
    }

    setIsSaving(true);

    try {
      const saveData = {
        height: parseFloat(bmiData.height),
        weight: parseFloat(bmiData.weight),
        gender: bmiData.gender,
        bmiValue: bmiResult.bmiValue,
        bmiCategory: bmiResult.category,
        measurementDate: bmiData.measurementDate,
      };

      const response = await bmiService.saveBmi(saveData);

      if (response.success) {
        toast.success("Lưu kết quả BMI thành công!");

        // Reset form
        setBmiData({
          height: "",
          weight: "",
          gender: "",
          measurementDate: new Date().toISOString().split("T")[0],
        });
        setBmiResult(null);

        // Load lại lịch sử
        await loadBmiHistory();
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi lưu BMI:", error);
      toast.error("Lỗi khi lưu BMI!");
    } finally {
      setIsSaving(false);
    }
  };

  // 🎯 PHÂN LOẠI BMI THEO GIỚI TÍNH
  const getBmiCategory = (bmi, gender) => {
    if (gender === "MALE") {
      // Tiêu chuẩn BMI cho Nam
      if (bmi < 18.5) return "Thiếu cân";
      if (bmi < 23) return "Bình thường";
      if (bmi < 25) return "Thừa cân";
      if (bmi < 30) return "Tiền béo phì";
      if (bmi < 35) return "Béo phì độ I";
      if (bmi < 40) return "Béo phì độ II";
      return "Béo phì độ III";
    } else {
      // Tiêu chuẩn BMI cho Nữ (thường có ngưỡng thấp hơn)
      if (bmi < 18) return "Thiếu cân";
      if (bmi < 22) return "Bình thường";
      if (bmi < 24) return "Thừa cân";
      if (bmi < 29) return "Tiền béo phì";
      if (bmi < 34) return "Béo phì độ I";
      if (bmi < 39) return "Béo phì độ II";
      return "Béo phì độ III";
    }
  };

  const getBmiColor = (bmiValue, gender) => {
    const category = getBmiCategory(bmiValue, gender);
    switch (category) {
      case "Thiếu cân":
        return "#3498db";
      case "Bình thường":
        return "#27ae60";
      case "Thừa cân":
        return "#f39c12";
      case "Tiền béo phì":
        return "#e67e22";
      case "Béo phì độ I":
        return "#e74c3c";
      case "Béo phì độ II":
        return "#c0392b";
      case "Béo phì độ III":
        return "#7d3c98";
      default:
        return "#95a5a6";
    }
  };

  const getGenderIcon = (gender) => {
    return gender === "MALE" ? "👨" : gender === "FEMALE" ? "👩" : "❓";
  };

  return (
    <div className="bmi-container">
      <div className="bmi-header">
        <h1>Theo dõi chỉ số BMI</h1>
        <p>Quản lý và theo dõi chỉ số khối cơ thể của bạn</p>
      </div>

      <div className="bmi-tabs">
        <button
          className={`tab-btn ${activeTab === "calculator" ? "active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          Máy tính BMI
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Lịch sử BMI
        </button>
      </div>

      {activeTab === "calculator" && (
        <div className="bmi-calculator">
          <div className="calculator-card">
            <h2>Tính chỉ số BMI</h2>

            <div className="input-group">
              <label>Giới tính *</label>
              <div className="gender-options">
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={bmiData.gender === "MALE"}
                    onChange={handleInputChange}
                  />
                  <span className="gender-label">
                    <span className="gender-icon">👨</span> Nam
                  </span>
                </label>
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={bmiData.gender === "FEMALE"}
                    onChange={handleInputChange}
                  />
                  <span className="gender-label">
                    <span className="gender-icon">👩</span> Nữ
                  </span>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Chiều cao (cm)</label>
              <input
                type="number"
                name="height"
                value={bmiData.height}
                onChange={handleInputChange}
                placeholder="Nhập chiều cao"
                min="50"
                max="250"
                step="0.1"
              />
            </div>

            <div className="input-group">
              <label>Cân nặng (kg)</label>
              <input
                type="number"
                name="weight"
                value={bmiData.weight}
                onChange={handleInputChange}
                placeholder="Nhập cân nặng"
                min="20"
                max="300"
                step="0.1"
              />
            </div>

            <div className="input-group">
              <label>Ngày đo</label>
              <input
                type="date"
                name="measurementDate"
                value={bmiData.measurementDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="action-buttons">
              <button
                className="calculate-btn"
                onClick={calculateBMI}
                disabled={
                  isCalculating ||
                  !bmiData.height ||
                  !bmiData.weight ||
                  !bmiData.gender
                }
              >
                {isCalculating ? "Đang tính..." : "Tính BMI"}
              </button>
            </div>

            {bmiResult && (
              <div
                className="bmi-result"
                style={{
                  borderColor: getBmiColor(
                    bmiResult.bmiValue,
                    bmiResult.gender
                  ),
                }}
              >
                <h3>Kết quả BMI của bạn</h3>
                <div className="bmi-gender">
                  {getGenderIcon(bmiResult.gender)}{" "}
                  {bmiResult.gender === "MALE" ? "Nam" : "Nữ"}
                </div>
                <div
                  className="bmi-value"
                  style={{
                    color: getBmiColor(bmiResult.bmiValue, bmiResult.gender),
                  }}
                >
                  {bmiResult.bmiValue}
                </div>
                <div className="bmi-category">
                  Phân loại: <strong>{bmiResult.category}</strong>
                </div>
                <button
                  className="save-btn"
                  onClick={saveBMI}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang lưu..." : "Lưu kết quả"}
                </button>
              </div>
            )}
          </div>

          <div className="bmi-info">
            <h3>Phân loại BMI theo WHO</h3>

            <div className="gender-tabs">
              <div className="gender-tab active">👨 Tiêu chuẩn Nam</div>
              <div className="bmi-categories">
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#3498db" }}
                  ></span>
                  <span>Thiếu cân: &lt; 18.5</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: 18.5 - 22.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Thừa cân: 23 - 24.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#e67e22" }}
                  ></span>
                  <span>Tiền béo phì: 25 - 29.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#e74c3c" }}
                  ></span>
                  <span>Béo phì độ I: 30 - 34.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#c0392b" }}
                  ></span>
                  <span>Béo phì độ II: 35 - 39.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#7d3c98" }}
                  ></span>
                  <span>Béo phì độ III: ≥ 40</span>
                </div>
              </div>

              <div className="gender-tab">👩 Tiêu chuẩn Nữ</div>
              <div className="bmi-categories">
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#3498db" }}
                  ></span>
                  <span>Thiếu cân: &lt; 18</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: 18 - 21.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Thừa cân: 22 - 23.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#e67e22" }}
                  ></span>
                  <span>Tiền béo phì: 24 - 28.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#e74c3c" }}
                  ></span>
                  <span>Béo phì độ I: 29 - 33.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#c0392b" }}
                  ></span>
                  <span>Béo phì độ II: 34 - 38.9</span>
                </div>
                <div className="category-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: "#7d3c98" }}
                  ></span>
                  <span>Béo phì độ III: ≥ 39</span>
                </div>
              </div>
            </div>

            <div className="gender-info">
              <h4>💡 Lưu ý về giới tính</h4>
              <p>Tiêu chuẩn BMI khác nhau giữa nam và nữ do sự khác biệt về:</p>
              <ul>
                <li>Tỷ lệ cơ bắp (nam thường có nhiều cơ hơn)</li>
                <li>Phân bố mỡ trong cơ thể</li>
                <li>Mật độ xương và cấu trúc cơ thể</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bmi-history">
          <h2>Lịch sử BMI</h2>
          {bmiHistory.length === 0 ? (
            <div className="no-data">
              <p>Chưa có dữ liệu BMI</p>
            </div>
          ) : (
            <div className="history-list">
              {bmiHistory.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-date">
                    {new Date(record.measurementDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                  <div className="history-details">
                    <span>Chiều cao: {record.height} cm</span>
                    <span>Cân nặng: {record.weight} kg</span>
                    <span>
                      Giới tính: {record.gender === "MALE" ? "👨 Nam" : "👩 Nữ"}
                    </span>
                  </div>
                  <div
                    className="history-bmi"
                    style={{
                      color: getBmiColor(record.bmiValue, record.gender),
                    }}
                  >
                    BMI: {record.bmiValue}
                  </div>
                  <div className="history-category">{record.bmiCategory}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BMIPage;
