import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, FlipHorizontal, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      setError(null);
      stopCamera();

      try {
        // Check for multiple video devices
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((device) => device.kind === 'videoinput');
          if (isMounted) {
            setHasMultipleCameras(videoDevices.length > 1);
          }
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera permission was denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera device found on your laptop/device.');
          } else {
            setError('Unable to access camera feed. Please check your camera permissions.');
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || isCapturing) return;

    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // If front camera, flip horizontally for natural mirror effect
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `camera_photo_${Date.now()}.png`, {
                type: 'image/png',
              });
              onCapture(file);
              stopCamera();
              onClose();
            } else {
              setError('Failed to process captured image.');
            }
            setIsCapturing(false);
          },
          'image/png',
          0.95
        );
      } else {
        setIsCapturing(false);
      }
    } catch (err) {
      console.error('Capture error:', err);
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Camera Capture
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Take a photo using your laptop or device camera</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Stream Viewfinder Area */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Flash Effect */}
          {flash && <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />}

          {error ? (
            <div className="p-8 text-center max-w-md flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Camera Access Error</h4>
                <p className="text-xs text-zinc-400">{error}</p>
              </div>
              <button
                onClick={() => setFacingMode((prev) => prev)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera Access
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Grid Overlay Framing Lines */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-b border-white/5" />
            </div>
          )}
        </div>

        {/* Footer Actions / Shutter Button */}
        <div className="p-6 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
          <div className="w-12 flex justify-start">
            {hasMultipleCameras && !error && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full transition-all border border-zinc-700/50"
                title="Switch Camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Main Shutter Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={!!error || isCapturing}
              onClick={handleCapture}
              className="relative group p-1.5 rounded-full border-2 border-white/30 hover:border-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title="Capture photo"
            >
              <div className="w-14 h-14 rounded-full bg-white group-hover:bg-emerald-400 transition-colors flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-zinc-950 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          <div className="w-12 flex justify-end">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
