import { useEffect } from "react";
import { toast as sonnerToast } from "sonner";

// Wrapper around sonner toast for consistent styling
export const toast = {
  success: (message) => {
    sonnerToast.success(message, {
      duration: 4000,
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 168, 107, 0.2)',
        color: '#333',
      }
    });
  },
  error: (message) => {
    sonnerToast.error(message, {
      duration: 5000,
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#333',
      }
    });
  },
  info: (message) => {
    sonnerToast.info(message, {
      duration: 4000,
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(74, 144, 226, 0.2)',
        color: '#333',
      }
    });
  },
  loading: (message) => {
    return sonnerToast.loading(message, {
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 168, 107, 0.2)',
        color: '#333',
      }
    });
  },
  dismiss: (toastId) => {
    sonnerToast.dismiss(toastId);
  }
};

export default function useToast() {
  return toast;
}