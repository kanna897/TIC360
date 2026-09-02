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

const getCloudName = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tic360_cloudinary_cloud_name');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
};

const getUploadPreset = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tic360_cloudinary_preset');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
};

export const getCloudinaryConfig = () => {
  const cloudName = getCloudName();
  const uploadPreset = getUploadPreset();
  const isConfigured = Boolean(cloudName && uploadPreset && !cloudName.includes('placeholder'));
  return { cloudName, uploadPreset, isConfigured };
};

export const updateCloudinaryCredentials = (cloudName: string, uploadPreset: string) => {
  if (typeof window !== 'undefined') {
    if (cloudName) localStorage.setItem('tic360_cloudinary_cloud_name', cloudName);
    else localStorage.removeItem('tic360_cloudinary_cloud_name');

    if (uploadPreset) localStorage.setItem('tic360_cloudinary_preset', uploadPreset);
    else localStorage.removeItem('tic360_cloudinary_preset');
  }
};

export function validateFile(file: File, type: 'photo' | 'doc'): { valid: boolean; error?: string } {
  if (type === 'photo') {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, WEBP).' };
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return {
        valid: false,
        error: `Student photo exceeds maximum size of 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB uploaded).`,
      };
    }
  } else {
    const validDocTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validDocTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload a valid document (PDF, PNG, JPG, DOC).' };
    }
    if (file.size > MAX_DOC_SIZE_BYTES) {
      return {
        valid: false,
        error: `Document exceeds maximum size of 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB uploaded).`,
      };
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

  const { cloudName, uploadPreset, isConfigured } = getCloudinaryConfig();

  // If Cloudinary keys are configured in environment or localStorage
  if (isConfigured) {
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
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Upload failed with status ${res.status}`);
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

/**
 * Test Cloudinary connection using a tiny 1x1 test pixel
 */
export async function testCloudinaryConnection(
  cloudNameInput?: string,
  presetInput?: string
): Promise<{ success: boolean; message: string }> {
  const cloudName = cloudNameInput || getCloudName();
  const uploadPreset = presetInput || getUploadPreset();

  if (!cloudName || !uploadPreset) {
    return { success: false, message: 'Cloud Name and Unsigned Upload Preset are required.' };
  }

  try {
    // 1x1 transparent PNG blob for test
    const base64Pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=';
    const blob = await (await fetch(base64Pixel)).blob();
    const testFile = new File([blob], 'test_ping.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'tic360_test');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        message: `Cloudinary Error: ${errJson?.error?.message || `HTTP ${res.status}`}. Please check that your upload preset is set to 'Unsigned'.`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: `Cloudinary verified successfully! Test image uploaded to ${data.secure_url}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Network error'}`,
    };
  }
}
