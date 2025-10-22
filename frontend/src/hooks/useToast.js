// src/hooks/useToast.js
import toast from 'react-hot-toast';
import { toastPresets } from '../config/toastConfig';

export const useToast = () => {
  const showToast = {
    // ✅ Success - Icon tích xanh
    success: (message) => toast.success(message, {
      ...toastPresets.success(message),
      icon: '✅',
    }),
    
    // ❌ Error - Icon chữ X đỏ
    error: (message) => toast.error(message, {
      ...toastPresets.error(message),
      icon: '❌',
    }),
    
    // ⚠️ Warning - Icon cảnh báo
    warning: (message) => toast(message, {
      ...toastPresets.warning(message),
      icon: '⚠️',
    }),
    
    // 💙 Info - Icon thông tin
    info: (message) => toast(message, {
      ...toastPresets.info(message),
      icon: 'ℹ️',
    }),
    
    // ⏳ Loading - Icon đồng hồ cát
    loading: (message) => toast.loading(message, {
      ...toastPresets.loading(message),
      icon: '⏳',
    }),
    
    // 🎯 Custom với icon tuỳ chỉnh
    custom: (message, options = {}) => toast(message, options),
    
    // ❌ Dismiss
    dismiss: (toastId) => toast.dismiss(toastId),
    
    // 🔄 Dismiss All
    dismissAll: () => toast.dismiss(),
    
    // 🔄 Promise
    promise: (promise, messages) => toast.promise(promise, messages),
  };

  return showToast;
};

export default useToast;