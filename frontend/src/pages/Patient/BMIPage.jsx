import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import bmiService from "../../api/bmiService";
import "../../css/BMIPage.css";

function BMIPage() {
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    gender: "",
    measurementDate: new Date().toISOString().split("T")[0],
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const toast = useToast();

  useEffect(() => {
    getHistory();
  }, []);

  const getHistory = async () => {
    try {
      const response = await bmiService.getBmiHistory();
      if (response.success) {
        setHistory(response.data);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi load lịch sử BMI:", error);
      toast.error("Lỗi khi tải lịch sử BMI!");
    }
  };

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateBMI = async () => {
    if (!formData.height || !formData.weight || !formData.gender) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    if (height <= 0 || weight <= 0) {
      toast.error("Chiều cao và cân nặng phải lớn hơn 0!");
      return;
    }

    setCalculating(true);

    try {
      const response = await bmiService.calculateBmi({
        height: height,
        weight: weight,
        gender: formData.gender,
      });

      if (response.success) {
        setResult({
          bmiValue: response.data.bmiValue,
          category: response.data.bmiCategory,
          gender: formData.gender,
        });
        toast.success("Tính BMI thành công!");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi tính BMI:", error);
      toast.error("Lỗi khi tính BMI!");
    } finally {
      setCalculating(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      toast.error("Vui lòng tính BMI trước khi lưu!");
      return;
    }

    setSaving(true);

    try {
      const saveData = {
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        bmiValue: result.bmiValue,
        bmiCategory: result.category,
        measurementDate: formData.measurementDate,
      };

      const response = await bmiService.saveBmi(saveData);

      if (response.success) {
        toast.success("Lưu kết quả BMI thành công!");

        setFormData({
          height: "",
          weight: "",
          gender: "",
          measurementDate: new Date().toISOString().split("T")[0],
        });
        setResult(null);

        await getHistory();
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi lưu BMI:", error);
      toast.error("Lỗi khi lưu BMI!");
    } finally {
      setSaving(false);
    }
  };

  const getCategory = (bmi, gender) => {
    if (gender === "MALE") {
      if (bmi < 18.5) return "Thiếu cân";
      if (bmi < 23) return "Bình thường";
      if (bmi < 25) return "Thừa cân";
      if (bmi < 30) return "Tiền béo phì";
      if (bmi < 35) return "Béo phì độ I";
      if (bmi < 40) return "Béo phì độ II";
      return "Béo phì độ III";
    } else {
      if (bmi < 18) return "Thiếu cân";
      if (bmi < 22) return "Bình thường";
      if (bmi < 24) return "Thừa cân";
      if (bmi < 29) return "Tiền béo phì";
      if (bmi < 34) return "Béo phì độ I";
      if (bmi < 39) return "Béo phì độ II";
      return "Béo phì độ III";
    }
  };

  const getColor = (bmiValue, gender) => {
    const category = getCategory(bmiValue, gender);
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

  return (
    <div className="bmi-container">
      <div className="bmi-header">
        <h1>Theo dõi chỉ số BMI</h1>
        <p>Quản lý và theo dõi chỉ số khối cơ thể của bạn</p>
      </div>

      <div className="bmi-tabs">
        <button
          className={`tab-button ${activeTab === "calculator" ? "active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          Máy tính BMI
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
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
                    checked={formData.gender === "MALE"}
                    onChange={handleChange}
                  />
                  <span className="gender-label">Nam</span>
                </label>
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === "FEMALE"}
                    onChange={handleChange}
                  />
                  <span className="gender-label">Nữ</span>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Chiều cao (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
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
                value={formData.weight}
                onChange={handleChange}
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
                value={formData.measurementDate}
                onChange={handleChange}
              />
            </div>

            <div className="action-buttons">
              <button
                className="calculate-button"
                onClick={calculateBMI}
                disabled={
                  calculating ||
                  !formData.height ||
                  !formData.weight ||
                  !formData.gender
                }
              >
                {calculating ? "Đang tính..." : "Tính BMI"}
              </button>
            </div>

            {result && (
              <div
                className="bmi-result"
                style={{
                  borderColor: getColor(result.bmiValue, result.gender),
                }}
              >
                <h3>Kết quả BMI của bạn</h3>
                <div className="bmi-gender">
                  {result.gender === "MALE" ? "Nam" : "Nữ"}
                </div>
                <div
                  className="bmi-value"
                  style={{
                    color: getColor(result.bmiValue, result.gender),
                  }}
                >
                  {result.bmiValue}
                </div>
                <div className="bmi-category">
                  Phân loại: <strong>{result.category}</strong>
                </div>
                <button
                  className="save-button"
                  onClick={saveResult}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu kết quả"}
                </button>
              </div>
            )}
          </div>

          <div className="bmi-info">
            <h3>Phân loại BMI theo WHO</h3>

            <div className="gender-tabs">
              <div className="gender-tab active">Tiêu chuẩn Nam</div>
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

              <div className="gender-tab">Tiêu chuẩn Nữ</div>
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
              <h4>Lưu ý về giới tính</h4>
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
          {history.length === 0 ? (
            <div className="no-data">
              <p>Chưa có dữ liệu BMI</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-date">
                    {new Date(record.measurementDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </div>
                  <div className="history-details">
                    <span>Chiều cao: {record.height} cm</span>
                    <span>Cân nặng: {record.weight} kg</span>
                    <span>
                      Giới tính: {record.gender === "MALE" ? "Nam" : "Nữ"}
                    </span>
                  </div>
                  <div
                    className="history-bmi"
                    style={{
                      color: getColor(record.bmiValue, record.gender),
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
}

export default BMIPage;
