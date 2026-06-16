// WHAT: Student ID verification card — shows student verification status and upload flow
// WHY: Modular card component for verification page, handles student ID-specific UI and document upload
// FUTURE: Add AI-based document verification, auto-extract matric number, validate against university DB

"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader,
  Camera,
} from "lucide-react";

type VerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";

interface StudentIDVerificationCardProps {
  status: VerificationStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  matricNumber?: string;
  documentUrl?: string;
  onSubmit: (file: File, matricNumber: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function StudentIDVerificationCard({
  status,
  submittedAt,
  approvedAt,
  rejectionReason,
  matricNumber,
  documentUrl,
  onSubmit,
  isLoading = false,
}: StudentIDVerificationCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [matricInput, setMatricInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a document");
      return;
    }

    if (!matricInput.trim()) {
      setError("Please enter your matric number");
      return;
    }

    try {
      setError(null);
      await onSubmit(file, matricInput);
      setFile(null);
      setPreview(null);
      setMatricInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit document",
      );
    }
  };

  const getStatusBadgeColor = (s: VerificationStatus) => {
    switch (s) {
      case "approved":
        return "bg-green-50 text-green-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (s: VerificationStatus) => {
    switch (s) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-700" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-700" />;
      case "pending":
        return <Loader className="w-4 h-4 text-amber-700 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <FileText className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Student ID Verification
            </h3>
            <p className="text-sm text-gray-600">+6 points to trust score</p>
          </div>
        </div>
        {status === "approved" && (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <span className="text-sm font-medium text-green-700">Verified</span>
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className={`rounded-lg p-4 mb-4 ${getStatusBadgeColor(status)}`}>
        {status === "approved" ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(status)}
              <span className="font-medium">Verified Student</span>
            </div>
            {approvedAt && matricNumber && (
              <>
                <p className="text-sm">Matric: {matricNumber}</p>
                <p className="text-xs opacity-75">
                  Approved on {new Date(approvedAt).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        ) : status === "pending" ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(status)}
              <span className="font-medium">Under Review</span>
            </div>
            <p className="text-sm">We'll notify you within 24 hours</p>
            {submittedAt && matricNumber && (
              <p className="text-xs opacity-75 mt-2">
                Submitted: {new Date(submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : status === "rejected" ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(status)}
              <span className="font-medium">Rejected</span>
            </div>
            {rejectionReason && (
              <p className="text-sm mb-2">{rejectionReason}</p>
            )}
            <p className="text-sm">You can resubmit with a clearer document</p>
          </div>
        ) : (
          <p className="text-sm">
            Upload your student ID card or matric letter
          </p>
        )}
      </div>

      {/* Upload Form - Only show for not_submitted or rejected */}
      {(status === "not_submitted" || status === "rejected") && (
        <div className="space-y-3">
          {/* File Input Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {preview ? (
              <div>
                <img
                  src={preview}
                  alt="Document preview"
                  className="w-full max-h-48 object-contain mb-2"
                />
                <p className="text-sm text-gray-600">Click to change image</p>
              </div>
            ) : (
              <div>
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  Take a photo or upload
                </p>
                <p className="text-xs text-gray-500">
                  Student ID card or matric letter
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            disabled={isLoading}
          />

          {/* Camera Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            disabled={isLoading}
          />

          {/* Matric Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matric/Registration Number
            </label>
            <input
              type="text"
              placeholder="e.g., 2024/001234"
              value={matricInput}
              onChange={(e) => {
                setMatricInput(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit for Verification
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
