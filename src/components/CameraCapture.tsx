import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Check,
  Video,
  MapPin,
  Clock,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface CameraCaptureProps {
  onCapture: (file: File, url?: string, loc?: { lat: number; lng: number } | null, timestamp?: string) => void;
  onCancel: () => void;
  type: "photo" | "video";
  overlayText?: string;
  minVideoDuration?: number; // seconds
}

export function CameraCapture({
  onCapture,
  onCancel,
  type,
  overlayText,
  minVideoDuration = 10,
}: CameraCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn("Error getting GPS:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString("en-US", { hour12: false }));
  }, [preview]);

  useEffect(() => {
    async function setupCamera() {
      if (preview) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: type === "video",
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setErrorMsg(
          err.message || "Permission denied. Please upload a file manually.",
        );
      }
    }
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [type, preview]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `photo_${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              setPreview({ file, url: URL.createObjectURL(blob) });
            }
          },
          "image/jpeg",
          0.8,
        );
      }
    }
  };

  const startRecording = () => {
    if (streamRef.current) {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], `video_${Date.now()}.webm`, {
          type: "video/webm",
        });
        setPreview({ file, url: URL.createObjectURL(blob) });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current!);
      if (duration < minVideoDuration) {
        alert(`Recording must be at least ${minVideoDuration} seconds.`);
        setDuration(0);
        chunksRef.current = [];
        setPreview(null);
      }
    }
  };

  const confirmAndUpload = async () => {
    if (!preview) return;
    setIsUploading(true);
    let uploadedUrl = preview.url;
    try {
      if (isSupabaseConfigured() && supabase) {
        const ext =
          preview.file.name.split(".").pop() ||
          (type === "video" ? "webm" : "jpg");
        const fileName = `${Date.now()}_evidence.${ext}`;
        const { error } = await supabase.storage
          .from("evidence")
          .upload(fileName, preview.file);
        if (error) {
          console.warn(
            "Supabase upload failed, falling back to base64 (bucket missing?)",
            error,
          );
          const reader = new FileReader();
          reader.readAsDataURL(preview.file);
          reader.onloadend = () => {
            onCapture(preview.file, reader.result as string, gpsLocation, timestamp);
            setIsUploading(false);
          };
          return;
        } else {
          const { data } = supabase.storage
            .from("evidence")
            .getPublicUrl(fileName);
          if (data) {
            uploadedUrl = data.publicUrl;
          }
        }
      } else {
        await new Promise((res) => setTimeout(res, 1500));
        const reader = new FileReader();
        reader.readAsDataURL(preview.file);
        reader.onloadend = () => {
          onCapture(preview.file, reader.result as string, gpsLocation, timestamp);
          setIsUploading(false);
        };
        return;
      }
      onCapture(preview.file, uploadedUrl, gpsLocation, timestamp);
    } catch (e) {
      console.error(e);
      const reader = new FileReader();
      reader.readAsDataURL(preview.file);
      reader.onloadend = () => {
        onCapture(preview.file, reader.result as string, gpsLocation, timestamp);
        setIsUploading(false);
      };
      return;
    }
    setIsUploading(false);
  };

  if (preview) {
    return (
      <div className="fixed inset-0 z-50 bg-geo-bg flex flex-col antialiased">
        <div className="p-4 pt-safe flex justify-between items-center bg-white border-b border-geo-border">
          <h3 className="font-bold text-xs uppercase tracking-widest text-geo-dark">
            Confirm Evidence
          </h3>
          <button
            onClick={() => setPreview(null)}
            disabled={isUploading}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-geo-input rounded border border-geo-border-light hover:bg-[#e2e8e4] disabled:opacity-50"
          >
            Retake
          </button>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="bg-black flex-1 rounded-xl overflow-hidden relative border border-geo-border flex items-center justify-center">
            {type === "photo" && preview.url ? (
              <img
                src={preview.url}
                className="w-full h-full object-cover opacity-80"
                alt="Preview"
              />
            ) : (
              <video
                src={preview.url}
                controls
                className="w-full h-full object-cover opacity-80"
              />
            )}

            {/* GPS Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/20 text-white font-mono text-[10px] gap-1 flex flex-col">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-geo-mid" /> LAT:{" "}
                {gpsLocation ? gpsLocation.lat.toFixed(4) : "20.937 N"}, LON:{" "}
                {gpsLocation ? gpsLocation.lng.toFixed(4) : "77.779 E"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-geo-mid" /> {timestamp}
              </div>
            </div>
          </div>

          <button
            onClick={confirmAndUpload}
            disabled={isUploading}
            className="w-full bg-geo-dark text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition flex items-center justify-center gap-2 mb-safe shadow-sm disabled:opacity-70"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> UPLOADING TO
                DATABASE...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> UPLOAD TO DATA LOGGER
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col antialiased">
      <div className="absolute top-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent pt-safe">
        <button
          onClick={onCancel}
          className="p-3 bg-black/40 rounded-full text-white backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
        {type === "video" && (
          <div
            className={`px-3 py-1 rounded-full font-mono text-sm font-bold flex items-center gap-2 ${isRecording ? "bg-red-500 text-white" : "bg-black/50 text-white"}`}
          >
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
            00:{duration.toString().padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-zinc-900 border-y border-zinc-800 my-16 mx-4 rounded-3xl overflow-hidden">
        {errorMsg ? (
          <div className="p-6 text-center max-w-sm">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-bold text-sm mb-2">{errorMsg}</p>
            <div className="text-white/70 text-xs mt-4 bg-white/5 p-4 rounded-lg text-left leading-relaxed">
              <p className="mb-2 font-bold uppercase tracking-widest text-[10px] text-white/50">
                How to fix this:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  Check your browser address bar and click the{" "}
                  <strong>Camera icon</strong> to allow permissions.
                </li>
                <li>
                  If you are viewing this app inside a preview iframe, click{" "}
                  <strong>Open App in New Tab</strong>.
                </li>
                <li>
                  Ensure your device/OS allows the browser to use the camera and
                  microphone.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={type === "photo"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <p className="text-white/50 font-mono text-xs absolute top-4 left-4 uppercase tracking-widest z-10 bg-black/50 px-2 py-1 rounded">
              Live Viewfinder
            </p>

            {/* Overlay standard */}
            <div className="absolute bottom-4 left-4 right-4 text-center z-10">
              <p className="bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest p-3 rounded-lg border border-white/10">
                {overlayText || `Capture evidence details clearly`}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 w-full h-32 pb-safe flex items-center justify-center bg-black">
        {type === "photo" ? (
          <div className="relative">
            <button
              onClick={capturePhoto}
              disabled={!!errorMsg}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black bg-white" />
            </button>
            <p className="absolute -top-6 w-full text-center text-white/50 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
              Tap to capture
            </p>
          </div>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={
              (isRecording && duration < minVideoDuration) || !!errorMsg
            }
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
          >
            <div
              className={`w-14 h-14 rounded-full transition-all ${isRecording ? "bg-red-500 scale-50 rounded-sm" : "bg-red-500"}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
