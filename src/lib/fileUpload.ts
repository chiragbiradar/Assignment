import { supabase } from './supabase';
import { AttachmentFile } from '@/components/AttachmentUploader';

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export const uploadAttachment = async (
  file: File, 
  chatId: string, 
  messageId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Create a safe filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${chatId}/${messageId}.${fileExtension}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (onProgress) {
            onProgress(percent);
          }
        }
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path);
    
    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during upload'
    };
  }
};

export const getFileType = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  } else if (file.type.startsWith('audio/')) {
    return 'audio';
  } else if (file.type === 'application/pdf') {
    return 'application/pdf';
  } else {
    return 'document';
  }
};

export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  return validTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
