// src/config/toastConfig.js
export const toastConfig = {
  position: "top-center",
  gutter: 16,
  toastOptions: {
    // ⏰ THỜI GIAN CHUNG
    duration: 3000,
    
    // 🎨 STYLE CHUNG - Ô VUÔNG BO GÓC Ở GIỮA
    style: {
      background: '#ffffff',
      color: '#1f2937',
      fontSize: '15px',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      padding: '20px 24px',
      fontWeight: '500',
      maxWidth: '400px',
      minWidth: '320px',
      textAlign: 'center',
      border: '1px solid #e5e7eb',
      lineHeight: '1.5',
      margin: '0 auto',
    },
    
    // ✅ SUCCESS - Đăng nhập thành công (Icon: ✓)
    success: {
      duration: 2500,
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '2px solid #22c55e',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(34, 197, 94, 0.15)',
        padding: '20px 24px',
        maxWidth: '400px',
        minWidth: '320px',
        textAlign: 'center',
      },
      icon: '✅', // 👈 Icon tích xanh
      iconTheme: {
        primary: '#16a34a',
        secondary: '#f0fdf4',
      },
    },
    
    // ❌ ERROR - Lỗi đăng nhập (Icon: ❌)
    error: {
      duration: 4000,
      style: {
        background: '#fef2f2',
        color: '#991b1b',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)',
        padding: '20px 24px',
        maxWidth: '400px',
        minWidth: '320px',
        textAlign: 'center',
      },
      icon: '❌', // 👈 Icon chữ X đỏ
      iconTheme: {
        primary: '#dc2626',
        secondary: '#fef2f2',
      },
    },
    
    // ⚠️ WARNING - Cảnh báo (Icon: ⚠️)
    warning: {
      duration: 3500,
      style: {
        background: '#fffbeb',
        color: '#92400e',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(245, 158, 11, 0.15)',
        padding: '20px 24px',
        maxWidth: '400px',
        minWidth: '320px',
        textAlign: 'center',
      },
      icon: '⚠️', // 👈 Icon cảnh báo
      iconTheme: {
        primary: '#d97706',
        secondary: '#fffbeb',
      },
    },
    
    // 💙 INFO - Thông tin (Icon: ℹ️)
    info: {
      duration: 3000,
      style: {
        background: '#eff6ff',
        color: '#1e40af',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15)',
        padding: '20px 24px',
        maxWidth: '400px',
        minWidth: '320px',
        textAlign: 'center',
      },
      icon: 'ℹ️', // 👈 Icon thông tin
      iconTheme: {
        primary: '#2563eb',
        secondary: '#eff6ff',
      },
    },
    
    // ⏳ LOADING - Đang tải (Icon: ⏳)
    loading: {
      duration: Infinity,
      style: {
        background: '#f9fafb',
        color: '#374151',
        border: '2px solid #6b7280',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(107, 114, 128, 0.15)',
        padding: '20px 24px',
        maxWidth: '400px',
        minWidth: '320px',
        textAlign: 'center',
      },
      icon: '⏳', // 👈 Icon đồng hồ cát
      iconTheme: {
        primary: '#6b7280',
        secondary: '#f9fafb',
      },
    },
  },
};

// Export các preset để dùng riêng lẻ
export const toastPresets = {
  success: (message) => ({
    ...toastConfig.toastOptions.success,
    message,
  }),
  error: (message) => ({
    ...toastConfig.toastOptions.error,
    message,
  }),
  warning: (message) => ({
    ...toastConfig.toastOptions.warning,
    message,
  }),
  info: (message) => ({
    ...toastConfig.toastOptions.info,
    message,
  }),
  loading: (message) => ({
    ...toastConfig.toastOptions.loading,
    message,
  }),
};