import axios from 'axios';

const API_URL = 'http://localhost:8080/api/bmi';

class BmiService {
  
  // Lưu BMI với các chỉ số sức khỏe bổ sung
  async saveBmi(bmiData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/save`, bmiData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lưu BMI:', error);
      throw error;
    }
  }

  // Tính toán BMI và các chỉ số sức khỏe
  async calculateBmi(bmiData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/calculate`, bmiData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tính toán BMI:', error);
      throw error;
    }
  }

  // Lấy lịch sử BMI
  async getBmiHistory() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử BMI:', error);
      throw error;
    }
  }

  // Lấy BMI gần nhất
  async getLatestBmi() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy BMI gần nhất:', error);
      throw error;
    }
  }

  // Lấy dữ liệu biểu đồ
  async getChartData(days = 30) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chart-data?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu biểu đồ:', error);
      throw error;
    }
  }

  // Xóa bản ghi BMI
  async deleteBmi(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa BMI:', error);
      throw error;
    }
  }
}

export default new BmiService();