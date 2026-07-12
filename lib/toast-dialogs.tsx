"use client";

import toast from 'react-hot-toast';

/**
 * Custom Promise-based wrapper to simulate `confirm()` with a beautiful toast UI.
 */
export const toastConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <p className="text-sm font-medium text-surface-900">{message}</p>
        <div className="flex justify-end gap-2 mt-1">
          <button 
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-surface-100 hover:bg-surface-200 text-surface-700 transition-colors"
            onClick={() => { toast.dismiss(t.id); resolve(false); }}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            onClick={() => { toast.dismiss(t.id); resolve(true); }}
          >
            Confirm
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      position: 'top-center',
    });
  });
};

/**
 * Custom Promise-based wrapper to simulate `prompt()` with a beautiful toast UI.
 */
export const toastPrompt = (message: string, placeholder?: string, defaultValue?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <p className="text-sm font-medium text-surface-900">{message}</p>
        <input 
          id={`prompt-${t.id}`}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (document.getElementById(`prompt-${t.id}`) as HTMLInputElement).value;
              toast.dismiss(t.id); 
              resolve(val); 
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-1">
          <button 
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-surface-100 hover:bg-surface-200 text-surface-700 transition-colors"
            onClick={() => { toast.dismiss(t.id); resolve(null); }}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            onClick={() => { 
              const val = (document.getElementById(`prompt-${t.id}`) as HTMLInputElement).value;
              toast.dismiss(t.id); 
              resolve(val); 
            }}
          >
            Submit
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      position: 'top-center',
    });
  });
};
