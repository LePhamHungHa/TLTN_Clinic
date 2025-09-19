// Import các hàm cần dùng từ Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";   // dùng cho Phone Auth
import { getAnalytics } from "firebase/analytics";

// Cấu hình Firebase cho project của bạn
const firebaseConfig = {
  apiKey: "", // nhớ xóa key này khi public code
  authDomain: "clinicweb-8fa34.firebaseapp.com",
  projectId: "clinicweb-8fa34",
  storageBucket: "clinicweb-8fa34.firebasestorage.app",
  messagingSenderId: "112307862186",
  appId: "1:112307862186:web:442234250282e98d25aed3",
  measurementId: "G-FNPZEELB26"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Export auth để dùng cho Phone Authentication
export const auth = getAuth(app);

// không bắt buộc
export const analytics = getAnalytics(app);

export default app;
