'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiDownload, FiFile, FiFileText, FiImage, FiVideo, FiMusic } from 'react-icons/fi';
import { Message } from '@/lib/supabase';

type MessageAttachmentProps = {
  message: Message;
};

export default function MessageAttachment({ message }: MessageAttachmentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset image loading state when message changes
  useEffect(() => {
    if (message.has_attachment && message.attachment_type === 'image') {
      setImageLoading(true);
    }
  }, [message.id]);

  if (!message.has_attachment || !message.attachment_url) {
    return null;
  }

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(message.attachment_url!);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.attachment_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLoading(false);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
      setLoading(false);
    }
  };

  const getAttachmentIcon = () => {
    switch (message.attachment_type) {
      case 'image':
        return <FiImage className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <FiVideo className="h-5 w-5 text-red-500" />;
      case 'audio':
        return <FiMusic className="h-5 w-5 text-purple-500" />;
      case 'document':
      case 'application/pdf':
        return <FiFileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FiFile className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderAttachment = () => {
    switch (message.attachment_type) {
      case 'image':
        return (
          <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shadow-sm p-1 my-2">
            {/* Loading overlay */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
              </div>
            )}

            <Image
              src={message.attachment_url || ''}
              alt={message.attachment_name || 'Image attachment'}
              fill
              className="object-contain rounded p-1 z-0"
              unoptimized={true}
              onLoadingComplete={() => setImageLoading(false)}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                console.error('Image failed to load:', message.attachment_url);
                setImageLoading(false);
                // Replace with a fallback image or show an error state
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
              }}
            />

            {/* Image info and download button */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6 flex justify-between items-center">
              <div className="text-white text-xs truncate max-w-[70%]">
                {message.attachment_name || 'Image'}
              </div>
              <button
                className="bg-white text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center"
                onClick={handleDownload}
                disabled={loading}
                title="Download image"
              >
                <FiDownload className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full max-w-xs rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shadow-sm p-1 my-2">
            <video
              controls
              className="w-full max-h-48 rounded"
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5Ij5WaWRlbzwvdGV4dD48L3N2Zz4="
              onError={(e) => {
                console.error('Video failed to load:', message.attachment_url);
              }}
            >
              <source src={message.attachment_url || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video info and download button */}
            <div className="mt-2 px-1 flex justify-between items-center">
              <div className="text-gray-700 text-xs truncate max-w-[70%]">
                {message.attachment_name || 'Video'}
                {message.attachment_size && (
                  <span className="text-gray-500 ml-1">
                    ({(message.attachment_size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                )}
              </div>
              <button
                className="bg-gray-100 text-gray-700 p-1.5 rounded-full hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center"
                onClick={handleDownload}
                disabled={loading}
                title="Download video"
              >
                <FiDownload className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="w-full max-w-xs rounded-lg border border-gray-200 shadow-sm p-3 my-2 bg-gray-50">
            <div className="flex items-center mb-2">
              <FiMusic className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-sm font-medium truncate flex-1">
                {message.attachment_name || 'Audio file'}
              </div>
            </div>
            <audio
              controls
              className="w-full rounded"
              onError={(e) => {
                console.error('Audio failed to load:', message.attachment_url);
              }}
            >
              <source src={message.attachment_url || ''} />
              Your browser does not support the audio element.
            </audio>
            <div className="flex justify-between items-center mt-2">
              {message.attachment_size && (
                <div className="text-xs text-gray-500">
                  {(message.attachment_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
              <button
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center text-xs"
                onClick={handleDownload}
                disabled={loading}
              >
                <FiDownload className="h-3.5 w-3.5 mr-1" />
                Download
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm my-2">
            <div className="mr-3 p-2 bg-gray-100 rounded-full">
              {getAttachmentIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.attachment_name || 'File attachment'}
              </p>
              {message.attachment_size && (
                <p className="text-xs text-gray-500">
                  {message.attachment_size > 1024 * 1024
                    ? `${(message.attachment_size / (1024 * 1024)).toFixed(2)} MB`
                    : `${(message.attachment_size / 1024).toFixed(1)} KB`}
                </p>
              )}
            </div>
            <button
              className="ml-2 bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors shadow-sm"
              onClick={handleDownload}
              disabled={loading}
              title="Download file"
            >
              <FiDownload className="h-5 w-5" />
              {loading && <span className="sr-only">Downloading...</span>}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="mb-2">
      {renderAttachment()}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
