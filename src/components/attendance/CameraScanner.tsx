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
    <div className="relative w-full aspect-[4/3] max-w-sm mx-auto bg-[#0d0f12] rounded-xl overflow-hidden border border-white/[0.08] shadow-lg flex items-center justify-center">
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
          className="p-1.5 rounded-md bg-[#14161c]/80 hover:bg-[#1a1d24] text-zinc-200 border border-white/[0.1] backdrop-blur-sm transition"
          title="Switch Camera"
        >
          <SwitchCamera className="w-4 h-4" />
        </button>
      </div>

      {/* Target Reticle / Viewfinder */}
      {hasCameraAccess && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative w-44 h-44 border border-white/40 rounded-lg flex items-center justify-center">
            {/* Clean Reticle */}
            <Scan className="w-7 h-7 text-white/30" />
          </div>
          <p className="absolute bottom-3 text-[10px] font-mono text-zinc-300 bg-[#14161c]/90 px-2.5 py-1 rounded border border-white/[0.08] backdrop-blur-sm">
            Align QR Pass inside reticle
          </p>
        </div>
      )}

      {/* Fallback when Camera Unavailable / Denied */}
      {hasCameraAccess === false && (
        <div className="absolute inset-0 bg-[#0d0f12] p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
          <div className="p-2.5 bg-white/[0.04] text-zinc-300 rounded-lg border border-white/[0.08]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Camera Standby</h3>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
              {errorMessage || 'Allow camera permissions or use manual search check-in below.'}
            </p>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Fast desk manual check-in active below</span>
          </div>
        </div>
      )}
    </div>
  );
}

