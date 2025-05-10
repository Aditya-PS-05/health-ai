// components/FileUpload.tsx
'use client';

import { useState, useRef } from 'react';

interface UploadedFile {
  fileId: string;
  filename: string;
  url: string;
  path: string;
}

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accepted file types
  const acceptedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOCX, JPG, PNG, or TXT files.');
      return false;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload files smaller than 10MB.');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!validateFile(selectedFile)) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 20;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add user ID if available (from auth system)
      // formData.append('userId', 'user123');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadProgress(100);
      
      const data = await response.json();
      setUploadedFiles(prev => [...prev, data]);
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      clearInterval(progressInterval);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Health Documents</h2>
      
      {/* Drag & Drop Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer
          ${isUploading ? 'bg-gray-100 border-gray-300' : 'border-blue-300 hover:border-blue-500 bg-blue-50'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center">
          <svg 
            className="w-12 h-12 text-blue-500 mb-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          
          <p className="mb-2 text-sm text-gray-700">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOCX, JPG, PNG, TXT (Max 10MB)
          </p>
          
          {selectedFile && (
            <div className="mt-4 text-left w-full">
              <p className="text-sm font-medium text-gray-900">Selected file:</p>
              <p className="text-sm text-gray-700 truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt,.xlsx,.xls"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
      
      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className={`w-full py-2.5 px-4 rounded-md font-medium text-white 
          ${!selectedFile || isUploading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </button>
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Uploaded Documents</h3>
          <ul className="divide-y divide-gray-200">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <svg 
                    className="w-5 h-5 text-gray-500 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.filename}
                  </span>
                </div>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Privacy Note */}
      <p className="mt-6 text-xs text-gray-500 text-center">
        Your documents are securely stored and only used for AI analysis.
        We prioritize your privacy and data security.
      </p>
    </div>
  );
}