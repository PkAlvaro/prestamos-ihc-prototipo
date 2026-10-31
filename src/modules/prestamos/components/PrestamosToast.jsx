import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export const useToast = () => useContext(ToastContext)

let _toastId = 0

const CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-emerald-600' },
  error: { icon: AlertCircle, bg: 'bg-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500' },
  info: { icon: Info, bg: 'bg-cai-dark' },
}

function ToastItem({ toast, onDismiss }) {
  const { icon: Icon, bg } = CONFIG[toast.type] ?? CONFIG.info

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.type === 'error' ? 5000 : 3500)
    return () => clearTimeout(t)
  }, [toast.id, toast.type, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[260px] max-w-[360px] text-white animate-toast-in ${bg}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const add = useCallback((message, type) => {
    const id = ++_toastId
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
  }, [])

  const toast = {
    success: msg => add(msg, 'success'),
    error: msg => add(msg, 'error'),
    warning: msg => add(msg, 'warning'),
    info: msg => add(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}
