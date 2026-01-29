import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import bmiService from "../../api/bmiService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../../css/BMIPage.css";

function BMIPage() {
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    gender: "",
    measurementDate: new Date().toISOString().split("T")[0],
    systolic: "",
    diastolic: "",
    bloodSugar: "",
    spo2: "",
    notes: "",
  });

  const [result, setResult] = useState(null);
  const [calculations, setCalculations] = useState({
    bmiValue: null,
    bmiCategory: "",
    bloodPressureCategory: "",
    bloodSugarCategory: "",
    spo2Category: "",
  });

  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [timeRange, setTimeRange] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState("bmi");
  const toast = useToast();

  useEffect(() => {
    getHistory();
    getChartData();
  }, [timeRange]);

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
      toast.error("Lỗi khi tải lịch sử!");
    }
  };

  const getChartData = async () => {
    try {
      const response = await bmiService.getChartData(timeRange);
      if (response.success) {
        const transformedData = transformChartData(response.data);
        setChartData(transformedData);
      }
    } catch (error) {
      console.error("Lỗi load biểu đồ:", error);
    }
  };

  const transformChartData = (apiData) => {
    const dates = apiData.dates || [];
    const bmi = apiData.bmi || [];
    const systolic = apiData.systolic || [];
    const diastolic = apiData.diastolic || [];
    const bloodSugar = apiData.bloodSugar || [];
    const spo2 = apiData.spo2 || [];
    const weight = apiData.weight || [];

    return dates
      .map((date, index) => ({
        date: date.substring(5), // Format: MM-DD
        fullDate: date,
        bmi: bmi[index],
        systolic: systolic[index],
        diastolic: diastolic[index],
        bloodSugar: bloodSugar[index],
        spo2: spo2[index],
        weight: weight[index],
      }))
      .filter(
        (item) =>
          item.bmi != null ||
          item.systolic != null ||
          item.bloodSugar != null ||
          item.spo2 != null,
      );
  };

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateAll = async () => {
    if (!formData.height || !formData.weight || !formData.gender) {
      toast.error("Vui lòng nhập chiều cao, cân nặng và giới tính!");
      return;
    }

    setCalculating(true);

    try {
      const response = await bmiService.calculateBmi({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        systolic: formData.systolic ? parseInt(formData.systolic) : null,
        diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        bloodSugar: formData.bloodSugar
          ? parseFloat(formData.bloodSugar)
          : null,
        spo2: formData.spo2 ? parseInt(formData.spo2) : null,
      });

      if (response.success) {
        setCalculations(response.data);
        setResult({
          bmiValue: response.data.bmiValue,
          category: response.data.bmiCategory,
          gender: formData.gender,
        });
        toast.success("Tính toán thành công!");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi tính toán:", error);
      toast.error("Lỗi khi tính toán!");
    } finally {
      setCalculating(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      toast.error("Vui lòng tính toán trước khi lưu!");
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
        systolic: formData.systolic ? parseInt(formData.systolic) : null,
        diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        bloodSugar: formData.bloodSugar
          ? parseFloat(formData.bloodSugar)
          : null,
        spo2: formData.spo2 ? parseInt(formData.spo2) : null,
        notes: formData.notes,
      };

      const response = await bmiService.saveBmi(saveData);

      if (response.success) {
        toast.success("Lưu chỉ số sức khỏe thành công!");

        setFormData({
          height: "",
          weight: "",
          gender: "",
          measurementDate: new Date().toISOString().split("T")[0],
          systolic: "",
          diastolic: "",
          bloodSugar: "",
          spo2: "",
          notes: "",
        });
        setResult(null);
        setCalculations({
          bmiValue: null,
          bmiCategory: "",
          bloodPressureCategory: "",
          bloodSugarCategory: "",
          spo2Category: "",
        });

        await getHistory();
        await getChartData();
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      toast.error("Lỗi khi lưu!");
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

  const getBloodPressureColor = (category) => {
    switch (category) {
      case "Bình thường":
        return "#27ae60";
      case "Bình thường cao":
        return "#f39c12";
      case "Tiền tăng huyết áp":
        return "#e67e22";
      case "Tăng huyết áp độ 1":
        return "#e74c3c";
      case "Tăng huyết áp độ 2":
        return "#c0392b";
      case "Tăng huyết áp độ 3":
        return "#7d3c98";
      default:
        return "#95a5a6";
    }
  };

  const getBloodSugarColor = (category) => {
    switch (category) {
      case "Bình thường":
        return "#27ae60";
      case "Tiền đái tháo đường":
        return "#f39c12";
      case "Đái tháo đường":
        return "#e74c3c";
      case "Hạ đường huyết":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  };

  const getSpo2Color = (category) => {
    switch (category) {
      case "Bình thường":
        return "#27ae60";
      case "Thiếu oxy nhẹ":
        return "#f39c12";
      case "Thiếu oxy trung bình":
        return "#e67e22";
      case "Thiếu oxy nặng":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="bmi-chart__no-data">
          <p>Không có dữ liệu để hiển thị biểu đồ</p>
        </div>
      );
    }

    const chartConfig = {
      bmi: {
        title: "Chỉ số BMI theo thời gian",
        dataKey: "bmi",
        color: "#667eea",
        yAxisLabel: "Chỉ số BMI",
      },
      bloodPressure: {
        title: "Huyết áp theo thời gian",
        dataKey1: "systolic",
        dataKey2: "diastolic",
        color1: "#e74c3c",
        color2: "#3498db",
        yAxisLabel: "mmHg",
      },
      bloodSugar: {
        title: "Đường huyết theo thời gian",
        dataKey: "bloodSugar",
        color: "#9b59b6",
        yAxisLabel: "mmol/L",
      },
      spo2: {
        title: "SpO2 theo thời gian",
        dataKey: "spo2",
        color: "#2ecc71",
        yAxisLabel: "%",
      },
      weight: {
        title: "Cân nặng theo thời gian",
        dataKey: "weight",
        color: "#e67e22",
        yAxisLabel: "kg",
      },
    };

    const config = chartConfig[selectedMetric];

    return (
      <div className="bmi-chart__container">
        <h3>{config.title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              label={{
                value: config.yAxisLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            {selectedMetric === "bloodPressure" ? (
              <>
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke={config.color1}
                  name="Huyết áp tâm thu"
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke={config.color2}
                  name="Huyết áp tâm trương"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                name={config.title}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bmi-container">
      <div className="bmi-header">
        <h1 className="bmi-header__title">Theo dõi chỉ số sức khỏe</h1>
        <p className="bmi-header__description">
          Quản lý và theo dõi các chỉ số sức khỏe của bạn (BMI, huyết áp, đường
          huyết, SpO₂)
        </p>
      </div>

      <div className="bmi-tabs">
        <button
          className={`bmi-tabs__button ${activeTab === "calculator" ? "bmi-tabs__button--active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          Nhập chỉ số
        </button>
        <button
          className={`bmi-tabs__button ${activeTab === "history" ? "bmi-tabs__button--active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Lịch sử
        </button>
        <button
          className={`bmi-tabs__button ${activeTab === "chart" ? "bmi-tabs__button--active" : ""}`}
          onClick={() => setActiveTab("chart")}
        >
          Biểu đồ
        </button>
      </div>

      {activeTab === "calculator" && (
        <div className="bmi-calculator">
          <div className="bmi-calculator__card">
            <h2 className="bmi-calculator__title">Nhập chỉ số sức khỏe</h2>

            <div className="bmi-calculator__row">
              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">Ngày đo *</label>
                <input
                  type="date"
                  name="measurementDate"
                  value={formData.measurementDate}
                  onChange={handleChange}
                  className="bmi-calculator__input"
                />
              </div>

              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">Giới tính *</label>
                <div className="bmi-calculator__gender-options">
                  <label className="bmi-calculator__gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="MALE"
                      checked={formData.gender === "MALE"}
                      onChange={handleChange}
                      className="bmi-calculator__radio"
                    />
                    <span className="bmi-calculator__gender-label">Nam</span>
                  </label>
                  <label className="bmi-calculator__gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="FEMALE"
                      checked={formData.gender === "FEMALE"}
                      onChange={handleChange}
                      className="bmi-calculator__radio"
                    />
                    <span className="bmi-calculator__gender-label">Nữ</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bmi-calculator__row">
              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">
                  Chiều cao (cm) *
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Nhập chiều cao"
                  min="50"
                  max="250"
                  step="0.1"
                  className="bmi-calculator__input"
                />
              </div>

              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">Cân nặng (kg) *</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Nhập cân nặng"
                  min="20"
                  max="300"
                  step="0.1"
                  className="bmi-calculator__input"
                />
              </div>
            </div>

            <div className="bmi-calculator__section-title">Huyết áp</div>
            <div className="bmi-calculator__row">
              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">
                  Huyết áp tâm thu (mmHg)
                </label>
                <input
                  type="number"
                  name="systolic"
                  value={formData.systolic}
                  onChange={handleChange}
                  placeholder="VD: 120"
                  min="60"
                  max="250"
                  className="bmi-calculator__input"
                />
              </div>

              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">
                  Huyết áp tâm trương (mmHg)
                </label>
                <input
                  type="number"
                  name="diastolic"
                  value={formData.diastolic}
                  onChange={handleChange}
                  placeholder="VD: 80"
                  min="40"
                  max="150"
                  className="bmi-calculator__input"
                />
              </div>
            </div>

            <div className="bmi-calculator__section-title">Các chỉ số khác</div>
            <div className="bmi-calculator__row">
              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">
                  Đường huyết (mmol/L)
                </label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={formData.bloodSugar}
                  onChange={handleChange}
                  placeholder="VD: 5.5"
                  min="1"
                  max="30"
                  step="0.1"
                  className="bmi-calculator__input"
                />
              </div>

              <div className="bmi-calculator__input-group">
                <label className="bmi-calculator__label">SpO2 (%)</label>
                <input
                  type="number"
                  name="spo2"
                  value={formData.spo2}
                  onChange={handleChange}
                  placeholder="VD: 98"
                  min="70"
                  max="100"
                  className="bmi-calculator__input"
                />
              </div>
            </div>

            <div className="bmi-calculator__input-group">
              <label className="bmi-calculator__label">Ghi chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ghi chú thêm về tình trạng sức khỏe..."
                rows="3"
                className="bmi-calculator__textarea"
              />
            </div>

            <div className="bmi-calculator__action-buttons">
              <button
                className={`bmi-calculator__button bmi-calculator__button--calculate ${calculating || !formData.height || !formData.weight || !formData.gender ? "bmi-calculator__button--disabled" : ""}`}
                onClick={calculateAll}
                disabled={
                  calculating ||
                  !formData.height ||
                  !formData.weight ||
                  !formData.gender
                }
              >
                {calculating ? "Đang tính..." : "Tính toán tất cả"}
              </button>
            </div>

            {(result ||
              calculations.bloodPressureCategory ||
              calculations.bloodSugarCategory ||
              calculations.spo2Category) && (
              <div className="bmi-results">
                <h3 className="bmi-results__title">Kết quả đánh giá</h3>

                {result && (
                  <div
                    className="bmi-results__card"
                    style={{
                      borderColor: getColor(result.bmiValue, result.gender),
                    }}
                  >
                    <div className="bmi-results__card-header">
                      <h4 className="bmi-results__card-title">Chỉ số BMI</h4>
                      <span className="bmi-results__gender">
                        {result.gender === "MALE" ? "Nam" : "Nữ"}
                      </span>
                    </div>
                    <div
                      className="bmi-results__value"
                      style={{
                        color: getColor(result.bmiValue, result.gender),
                      }}
                    >
                      {result.bmiValue}
                    </div>
                    <div className="bmi-results__category">
                      Phân loại: <strong>{result.category}</strong>
                    </div>
                  </div>
                )}

                {calculations.bloodPressureCategory && (
                  <div
                    className="bmi-results__card"
                    style={{
                      borderColor: getBloodPressureColor(
                        calculations.bloodPressureCategory,
                      ),
                    }}
                  >
                    <div className="bmi-results__card-header">
                      <h4 className="bmi-results__card-title">Huyết áp</h4>
                      {formData.systolic && formData.diastolic && (
                        <span className="bmi-results__value-small">
                          {formData.systolic}/{formData.diastolic} mmHg
                        </span>
                      )}
                    </div>
                    <div className="bmi-results__category">
                      Phân loại:{" "}
                      <strong
                        style={{
                          color: getBloodPressureColor(
                            calculations.bloodPressureCategory,
                          ),
                        }}
                      >
                        {calculations.bloodPressureCategory}
                      </strong>
                    </div>
                  </div>
                )}

                {calculations.bloodSugarCategory && (
                  <div
                    className="bmi-results__card"
                    style={{
                      borderColor: getBloodSugarColor(
                        calculations.bloodSugarCategory,
                      ),
                    }}
                  >
                    <div className="bmi-results__card-header">
                      <h4 className="bmi-results__card-title">Đường huyết</h4>
                      {formData.bloodSugar && (
                        <span className="bmi-results__value-small">
                          {formData.bloodSugar} mmol/L
                        </span>
                      )}
                    </div>
                    <div className="bmi-results__category">
                      Phân loại:{" "}
                      <strong
                        style={{
                          color: getBloodSugarColor(
                            calculations.bloodSugarCategory,
                          ),
                        }}
                      >
                        {calculations.bloodSugarCategory}
                      </strong>
                    </div>
                  </div>
                )}

                {calculations.spo2Category && (
                  <div
                    className="bmi-results__card"
                    style={{
                      borderColor: getSpo2Color(calculations.spo2Category),
                    }}
                  >
                    <div className="bmi-results__card-header">
                      <h4 className="bmi-results__card-title">SpO2</h4>
                      {formData.spo2 && (
                        <span className="bmi-results__value-small">
                          {formData.spo2}%
                        </span>
                      )}
                    </div>
                    <div className="bmi-results__category">
                      Phân loại:{" "}
                      <strong
                        style={{
                          color: getSpo2Color(calculations.spo2Category),
                        }}
                      >
                        {calculations.spo2Category}
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  className={`bmi-results__save-button ${saving || !result ? "bmi-results__save-button--disabled" : ""}`}
                  onClick={saveResult}
                  disabled={saving || !result}
                >
                  {saving ? "Đang lưu..." : "Lưu tất cả chỉ số"}
                </button>
              </div>
            )}
          </div>

          <div className="bmi-info">
            <h3 className="bmi-info__title">Hướng dẫn đọc chỉ số</h3>

            <div className="bmi-info__section">
              <h4 className="bmi-info__section-title">📊 Chỉ số BMI</h4>
              <div className="bmi-info__categories">
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#3498db" }}
                  ></span>
                  <span>Thiếu cân: &lt; 18.5 (Nam), &lt; 18 (Nữ)</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: 18.5-22.9 (Nam), 18-21.9 (Nữ)</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Thừa cân: 23-24.9 (Nam), 22-23.9 (Nữ)</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#e67e22" }}
                  ></span>
                  <span>Tiền béo phì: 25-29.9 (Nam), 24-28.9 (Nữ)</span>
                </div>
              </div>
            </div>

            <div className="bmi-info__section">
              <h4 className="bmi-info__section-title">❤️ Huyết áp</h4>
              <div className="bmi-info__categories">
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: &lt; 120/80 mmHg</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Tiền tăng huyết áp: 120-139/80-89 mmHg</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#e74c3c" }}
                  ></span>
                  <span>Tăng huyết áp: ≥ 140/90 mmHg</span>
                </div>
              </div>
            </div>

            <div className="bmi-info__section">
              <h4 className="bmi-info__section-title">🍬 Đường huyết</h4>
              <div className="bmi-info__categories">
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: 3.9-6.1 mmol/L</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Tiền đái tháo đường: 6.1-7.0 mmol/L</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#e74c3c" }}
                  ></span>
                  <span>Đái tháo đường: &gt; 7.0 mmol/L</span>
                </div>
              </div>
            </div>

            <div className="bmi-info__section">
              <h4 className="bmi-info__section-title">
                💨 SpO2 (Độ bão hòa oxy)
              </h4>
              <div className="bmi-info__categories">
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#27ae60" }}
                  ></span>
                  <span>Bình thường: 95-100%</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#f39c12" }}
                  ></span>
                  <span>Thiếu oxy nhẹ: 90-94%</span>
                </div>
                <div className="bmi-info__category">
                  <span
                    className="bmi-info__color-dot"
                    style={{ backgroundColor: "#e74c3c" }}
                  ></span>
                  <span>Thiếu oxy nặng: &lt; 90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bmi-history">
          <h2 className="bmi-history__title">Lịch sử chỉ số sức khỏe</h2>
          {history.length === 0 ? (
            <div className="bmi-history__no-data">
              <p>Chưa có dữ liệu chỉ số sức khỏe</p>
            </div>
          ) : (
            <div className="bmi-history__list">
              {history.map((record) => (
                <div key={record.id} className="bmi-history__item">
                  <div className="bmi-history__date">
                    {new Date(record.measurementDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </div>
                  <div className="bmi-history__details">
                    <div className="bmi-history__detail-row">
                      <span className="bmi-history__detail-label">
                        Chiều cao:
                      </span>
                      <span className="bmi-history__detail-value">
                        {record.height} cm
                      </span>
                    </div>
                    <div className="bmi-history__detail-row">
                      <span className="bmi-history__detail-label">
                        Cân nặng:
                      </span>
                      <span className="bmi-history__detail-value">
                        {record.weight} kg
                      </span>
                    </div>
                    <div className="bmi-history__detail-row">
                      <span className="bmi-history__detail-label">
                        Giới tính:
                      </span>
                      <span className="bmi-history__detail-value">
                        {record.gender === "MALE" ? "Nam" : "Nữ"}
                      </span>
                    </div>
                    {record.systolic && record.diastolic && (
                      <div className="bmi-history__detail-row">
                        <span className="bmi-history__detail-label">
                          Huyết áp:
                        </span>
                        <span className="bmi-history__detail-value">
                          {record.systolic}/{record.diastolic} mmHg
                        </span>
                      </div>
                    )}
                    {record.bloodSugar && (
                      <div className="bmi-history__detail-row">
                        <span className="bmi-history__detail-label">
                          Đường huyết:
                        </span>
                        <span className="bmi-history__detail-value">
                          {record.bloodSugar} mmol/L
                        </span>
                      </div>
                    )}
                    {record.spo2 && (
                      <div className="bmi-history__detail-row">
                        <span className="bmi-history__detail-label">SpO2:</span>
                        <span className="bmi-history__detail-value">
                          {record.spo2}%
                        </span>
                      </div>
                    )}
                    {record.notes && (
                      <div className="bmi-history__detail-row bmi-history__detail-row--notes">
                        <span className="bmi-history__detail-label">
                          Ghi chú:
                        </span>
                        <span className="bmi-history__detail-value">
                          {record.notes}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bmi-history__indicators">
                    <div
                      className="bmi-history__bmi"
                      style={{
                        color: getColor(record.bmiValue, record.gender),
                      }}
                    >
                      <div className="bmi-history__indicator-label">BMI</div>
                      <div className="bmi-history__indicator-value">
                        {record.bmiValue}
                      </div>
                      <div className="bmi-history__indicator-category">
                        {record.bmiCategory}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "chart" && (
        <div className="bmi-chart">
          <div className="bmi-chart__controls">
            <div className="bmi-chart__time-range">
              <label className="bmi-chart__control-label">
                Khoảng thời gian:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="bmi-chart__select"
              >
                <option value={7}>7 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={90}>90 ngày</option>
                <option value={180}>6 tháng</option>
                <option value={365}>1 năm</option>
              </select>
            </div>

            <div className="bmi-chart__metric-selector">
              <label className="bmi-chart__control-label">
                Chỉ số hiển thị:
              </label>
              <div className="bmi-chart__metric-buttons">
                <button
                  className={`bmi-chart__metric-button ${selectedMetric === "bmi" ? "bmi-chart__metric-button--active" : ""}`}
                  onClick={() => setSelectedMetric("bmi")}
                >
                  BMI
                </button>
                <button
                  className={`bmi-chart__metric-button ${selectedMetric === "bloodPressure" ? "bmi-chart__metric-button--active" : ""}`}
                  onClick={() => setSelectedMetric("bloodPressure")}
                >
                  Huyết áp
                </button>
                <button
                  className={`bmi-chart__metric-button ${selectedMetric === "bloodSugar" ? "bmi-chart__metric-button--active" : ""}`}
                  onClick={() => setSelectedMetric("bloodSugar")}
                >
                  Đường huyết
                </button>
                <button
                  className={`bmi-chart__metric-button ${selectedMetric === "spo2" ? "bmi-chart__metric-button--active" : ""}`}
                  onClick={() => setSelectedMetric("spo2")}
                >
                  SpO2
                </button>
                <button
                  className={`bmi-chart__metric-button ${selectedMetric === "weight" ? "bmi-chart__metric-button--active" : ""}`}
                  onClick={() => setSelectedMetric("weight")}
                >
                  Cân nặng
                </button>
              </div>
            </div>
          </div>

          <div className="bmi-chart__wrapper">{renderChart()}</div>

          <div className="bmi-chart__summary">
            <h3 className="bmi-chart__summary-title">Thống kê chỉ số</h3>
            <div className="bmi-chart__summary-cards">
              <div className="bmi-chart__summary-card">
                <h4 className="bmi-chart__summary-card-title">
                  Tổng số lần đo
                </h4>
                <div className="bmi-chart__summary-value">
                  {chartData.length}
                </div>
              </div>
              {chartData.length > 0 && (
                <>
                  <div className="bmi-chart__summary-card">
                    <h4 className="bmi-chart__summary-card-title">
                      BMI trung bình
                    </h4>
                    <div className="bmi-chart__summary-value">
                      {(
                        chartData.reduce(
                          (sum, item) => sum + (item.bmi || 0),
                          0,
                        ) / chartData.filter((item) => item.bmi).length || 0
                      ).toFixed(1)}
                    </div>
                  </div>
                  <div className="bmi-chart__summary-card">
                    <h4 className="bmi-chart__summary-card-title">
                      Cân nặng trung bình
                    </h4>
                    <div className="bmi-chart__summary-value">
                      {(
                        chartData.reduce(
                          (sum, item) => sum + (item.weight || 0),
                          0,
                        ) / chartData.filter((item) => item.weight).length || 0
                      ).toFixed(1)}{" "}
                      kg
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BMIPage;
