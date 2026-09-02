/**
 * Cloudinary file upload & client-side validation utilities
 * Max photo size: 5 MB
 * Max document size: 10 MB
 */

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  url: string;
  publicId?: string;
  format?: string;
}

export function validateFile(file: File, type: 'photo' | 'doc'): { valid: boolean; error?: string } {
  if (type === 'photo') {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, WEBP).' };
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { valid: false, error: `Student photo exceeds maximum size of 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB uploaded).` };
    }
  } else {
    const validDocTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validDocTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload a valid document (PDF, PNG, JPG, DOC).' };
    }
    if (file.size > MAX_DOC_SIZE_BYTES) {
      return { valid: false, error: `Document exceeds maximum size of 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB uploaded).` };
    }
  }
  return { valid: true };
}

/**
 * Uploads file via Cloudinary unsigned upload preset or returns base64 preview for development
 */
export async function uploadToCloudinary(
  file: File,
  type: 'photo' | 'doc'
): Promise<{ success: boolean; url: string; error?: string }> {
  const validation = validateFile(file, type);
  if (!validation.valid) {
    return { success: false, url: '', error: validation.error };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary keys are configured in environment
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', type === 'photo' ? 'tic360_students' : 'tic360_documents');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      return { success: true, url: data.secure_url };
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      return { success: false, url: '', error: err.message || 'Cloudinary upload failed.' };
    }
  }

  // Fallback to local Data URL preview when keys are pending setup
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.readAsDataURL(file);
  });
}
