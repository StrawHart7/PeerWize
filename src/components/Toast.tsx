"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

const CONFIG = {
  success: {
    icon: CheckCircle,
    bg: "#006A4E",
    text: "#fff",
  },
  error: {
    icon: XCircle,
    bg: "#D21034",
    text: "#fff",
  },
  info: {
    icon: Info,
    bg: "#1A1C1E",
    text: "#fff",
  },
};

export function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, bg, text } = CONFIG[toast.type];

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, onDismiss]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300"
      style={{
        backgroundColor: bg,
        color: text,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        minWidth: "280px",
        maxWidth: "340px",
      }}
    >
      <Icon size={18} color={text} className="shrink-0" />
      <span className="flex-1 text-sm font-medium font-[var(--font-vietnam)]">
        {toast.message}
      </span>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
        <X size={16} color={text} />
      </button>
    </div>
  );
}