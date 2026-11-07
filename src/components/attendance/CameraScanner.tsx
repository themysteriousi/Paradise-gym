import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, SwitchCamera, AlertCircle, Scan } from 'lucide-react';

interface CameraScannerProps {
  onScanSuccess: (tokenString: string) => void;
  onCameraUnavailable?: () => void;
}

export default function CameraScanner({
  onScanSuccess,
  onCameraUnavailable,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastScannedTokenRef = useRef<string | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    async function initCamera() {
      try {
        setErrorMessage(null);
        readerRef.current = new BrowserQRCodeReader();

        // Check media devices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera is not supported on this browser or platform');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasCameraAccess(true);

          // Start ZXing decode from video element
          readerRef.current.decodeFromVideoElement(
            videoRef.current,
            (result) => {
              if (result && result.getText()) {
                const token = result.getText();
                // Prevent duplicate rapid callbacks within 2 seconds
                if (lastScannedTokenRef.current === token) return;
                lastScannedTokenRef.current = token;
                setTimeout(() => {
                  lastScannedTokenRef.current = null;
                }, 2000);

                onScanSuccess(token);
              }
            }
          );
        }
      } catch (err: unknown) {
        setHasCameraAccess(false);
        const msg = err instanceof Error ? err.message : 'Unable to access camera';
        setErrorMessage(msg);
        if (onCameraUnavailable) onCameraUnavailable();
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, onScanSuccess, onCameraUnavailable]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full aspect-[4/3] max-w-sm mx-auto bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Camera Controls Overlay */}
      <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
        <button
          onClick={toggleFacingMode}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-sm transition"
          title="Switch Camera"
        >
          <SwitchCamera className="w-4 h-4" />
        </button>
      </div>

      {/* Target Reticle / Laser Viewfinder */}
      {hasCameraAccess && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative w-48 h-48 border-2 border-brand-500/80 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            {/* Animated Laser Scan Line */}
            <div className="absolute left-1 right-1 h-0.5 bg-brand-400 shadow-[0_0_10px_#22c55e] animate-pulse" />
            <Scan className="w-8 h-8 text-brand-400/40" />
          </div>
          <p className="absolute bottom-4 text-[11px] font-semibold text-white/90 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 backdrop-blur-sm">
            Align QR Pass inside frame
          </p>
        </div>
      )}

      {/* Fallback when Camera Unavailable / Denied */}
      {hasCameraAccess === false && (
        <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Camera Standby / Unavailable</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {errorMessage || 'Allow camera permissions or use manual search check-in below.'}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Fast desk manual check-in active below</span>
          </div>
        </div>
      )}
    </div>
  );
}

