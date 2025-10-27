import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileCode, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomGameUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const CustomGameUpload = ({ onFileSelect, selectedFile }: CustomGameUploadProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndSelectFile(files[0]);
    }
  };

  const validateAndSelectFile = (file: File) => {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    // Check file type
    const validTypes = ['text/html', 'application/zip', 'application/x-zip-compressed'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.html') && !file.name.endsWith('.zip')) {
      toast.error('Invalid file type. Please upload an HTML or ZIP file.');
      return;
    }

    onFileSelect(file);
    toast.success('Game file selected successfully!');
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">Upload Game File</Label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-neon-purple bg-neon-purple/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="game-upload"
          type="file"
          accept=".html,.zip"
          onChange={handleFileInput}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <FileCode className="h-12 w-12 text-neon-purple mx-auto" />
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('game-upload')?.click()}
            >
              Change File
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">
              Drag and drop your game file here, or
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('game-upload')?.click()}
            >
              Browse Files
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              HTML or ZIP file, max 50MB
            </p>
          </>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300 space-y-2">
            <p className="font-semibold text-blue-300">Game Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>• Single HTML file or ZIP bundle with index.html entry point</li>
              <li>• Supports brand customization via URL parameters (optional)</li>
              <li>• Use ?primaryColor=hex&secondaryColor=hex&logoUrl=url</li>
              <li>• Game should be self-contained (all assets included)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
