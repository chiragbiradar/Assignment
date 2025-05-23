'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { FiX, FiPaperclip, FiFile, FiImage, FiVideo, FiFileText } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

export type AttachmentFile = {
  file: File;
  previewUrl?: string;
  type: string;
  uploading: boolean;
  progress: number;
  error?: string;
};

type AttachmentUploaderProps = {
  onAttachmentSelect: (file: AttachmentFile | null) => void;
  selectedAttachment: AttachmentFile | null;
};

export default function AttachmentUploader({ onAttachmentSelect, selectedAttachment }: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    // Determine file type
    let type = 'document';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('video/')) {
      type = 'video';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
    }

    // Create preview URL for images and videos
    let previewUrl;
    if (type === 'image' || type === 'video') {
      previewUrl = URL.createObjectURL(file);
    }

    const newAttachment: AttachmentFile = {
      file,
      previewUrl,
      type,
      uploading: false,
      progress: 0
    };

    onAttachmentSelect(newAttachment);
  };

  const handleRemoveAttachment = () => {
    if (selectedAttachment?.previewUrl) {
      URL.revokeObjectURL(selectedAttachment.previewUrl);
    }
    onAttachmentSelect(null);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FiImage className="h-6 w-6 text-blue-500" />;
      case 'video':
        return <FiVideo className="h-6 w-6 text-red-500" />;
      case 'audio':
        return <FiFileText className="h-6 w-6 text-purple-500" />;
      default:
        return <FiFile className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      {!selectedAttachment ? (
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <FiPaperclip className="h-6 w-6 mx-auto text-gray-400" />
          <p className="mt-1 text-sm text-gray-500">
            Click to attach or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Images, videos, documents (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>
      ) : (
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {selectedAttachment.type === 'image' && selectedAttachment.previewUrl ? (
                <div className="w-12 h-12 relative rounded overflow-hidden mr-3">
                  <Image
                    src={selectedAttachment.previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Preview image failed to load');
                      // Fall back to the file icon
                      e.currentTarget.style.display = 'none';
                      // We'll show the fallback icon
                      setSelectedAttachment({
                        ...selectedAttachment,
                        previewUrl: undefined
                      });
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded mr-3">
                  {getFileIcon(selectedAttachment.type)}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate" title={selectedAttachment.file.name}>
                  {selectedAttachment.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedAttachment.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={handleRemoveAttachment}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {selectedAttachment.uploading && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${selectedAttachment.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {selectedAttachment.progress}%
              </p>
            </div>
          )}

          {selectedAttachment.error && (
            <p className="text-xs text-red-500 mt-1">
              {selectedAttachment.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
