// src/components/ToastProvider.jsx
import { Toaster } from "react-hot-toast";
import { toastConfig } from "../config/toastConfig";

const ToastProvider = () => {
  return (
    <>
      <Toaster {...toastConfig} />
      {/* CSS để canh giữa tuyệt đối */}
      <style jsx global>{`
        /* Container toast - canh giữa màn hình */
        .go3958317564 {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 9999 !important;
          width: auto !important;
          max-width: 100vw !important;
          pointer-events: none !important;
        }

        /* Mỗi toast item */
        .go3958317564 .go2072408551 {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 8px 0 !important;
          pointer-events: auto !important;
        }

        /* Animation xuất hiện từ giữa */
        .go3958317564 .go2072408551 {
          animation: toastPopUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes toastPopUp {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Đảm bảo toast content có kích thước cố định */
        .go3958317564 .go2072408551 > div {
          width: 100% !important;
          min-width: 320px !important;
          max-width: 400px !important;
          margin: 0 auto !important;
        }

        /* Responsive cho mobile */
        @media (max-width: 480px) {
          .go3958317564 .go2072408551 > div {
            min-width: 280px !important;
            max-width: 90vw !important;
            margin: 0 16px !important;
          }
        }

        /* Icon size */
        .go3958317564 .go2072408551 > div [data-icon] {
          font-size: 18px !important;
          margin-right: 12px !important;
        }
      `}</style>
    </>
  );
};

export default ToastProvider;
