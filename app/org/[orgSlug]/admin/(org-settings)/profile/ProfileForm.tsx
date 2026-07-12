"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/actions/admin";
import { UserCircle, Upload, X } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import toast from "react-hot-toast";

export default function ProfileForm({ 
  defaultName, 
  email, 
  defaultAvatar 
}: { 
  defaultName: string; 
  email: string; 
  defaultAvatar: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultAvatar);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("avatarUrl", avatarUrl || "");
    
    // Instead of directly calling formAction which requires a FormData event inside useActionState form,
    // wait, useActionState provides a formAction that can be used directly on the form's action prop.
    // If I intercept onSubmit, I can just use a hidden input for avatarUrl and let the form submit natively.
  };

  return (
    <form action={formAction} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm space-y-6">
      <input type="hidden" name="avatarUrl" value={avatarUrl || ""} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-2">Profile Photo</h3>
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Avatar" className="w-24 h-24 object-cover rounded-full border border-surface-200" />
              <button 
                type="button" 
                onClick={() => setAvatarUrl(null)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <CldUploadWidget 
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
              onSuccess={(result: any) => setAvatarUrl(result.info.secure_url)}
            >
              {({ open }) => (
                <button 
                  type="button" 
                  onClick={() => open()}
                  className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-surface-300 hover:border-primary-500/50 hover:bg-primary-50 transition-colors text-surface-500 hover:text-primary-600"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                </button>
              )}
            </CldUploadWidget>
          )}
          <div className="text-sm text-surface-600">
            <p>Upload a square profile photo.</p>
            <p>Recommended size: 256x256px.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-2">Personal Details</h3>
        
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label>
          <input type="email" disabled value={email} className="input-field w-full bg-surface-50 text-surface-500 cursor-not-allowed" />
          <p className="text-xs text-surface-500 mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
          <input name="name" type="text" required defaultValue={defaultName} className="input-field w-full" placeholder="e.g. Jane Doe" />
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm border border-emerald-200">
          Profile updated successfully.
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
          <UserCircle className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
