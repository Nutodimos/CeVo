"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { submitCapture } from "@/app/actions/voter";
import { Camera, SmartphoneNfc, Check, RefreshCw } from "lucide-react";

type CaptureState = "initializing" | "ready" | "captured" | "uploading" | "error";

export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captureState, setCaptureState] = useState<CaptureState>("initializing");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCaptureState("ready");
        }
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Camera error:", err);

        const errMsg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access was denied. Please allow camera permissions in your browser settings and refresh the page."
            : err instanceof DOMException && err.name === "NotFoundError"
              ? "No camera found on this device. Please use a device with a camera."
              : "Unable to access the camera. Please check your permissions and try again.";

        setError(errMsg);
        setCaptureState("error");
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture photo
  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    const guide = document.getElementById("guide-overlay");
    if (!ctx || !guide) return;

    // The dimensions of the video on the screen and the guide overlay on the screen
    const videoRect = video.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();

    // The actual resolution of the camera stream
    const nativeWidth = video.videoWidth;
    const nativeHeight = video.videoHeight;

    // CSS aspect ratio vs Native aspect ratio
    const nativeRatio = nativeWidth / nativeHeight;
    const containerRatio = videoRect.width / videoRect.height;

    let renderWidth = videoRect.width;
    let renderHeight = videoRect.height;
    let offsetX = 0;
    let offsetY = 0;

    // object-fit: cover scales the video to fill the container, centering it
    if (containerRatio > nativeRatio) {
      // Container is wider. Video scales to fit container width, cutting off top/bottom
      renderWidth = videoRect.width;
      renderHeight = videoRect.width / nativeRatio;
      offsetY = (renderHeight - videoRect.height) / 2;
    } else {
      // Container is taller. Video scales to fit container height, cutting off sides
      renderHeight = videoRect.height;
      renderWidth = videoRect.height * nativeRatio;
      offsetX = (renderWidth - videoRect.width) / 2;
    }

    // How many native pixels correspond to one rendered pixel?
    const scale = nativeWidth / renderWidth;

    // Position of the guide relative to the top-left of the video container
    const guideX = guideRect.left - videoRect.left;
    const guideY = guideRect.top - videoRect.top;

    // Translate to native video coordinates
    const sourceX = (guideX + offsetX) * scale;
    const sourceY = (guideY + offsetY) * scale;
    const sourceWidth = guideRect.width * scale;
    const sourceHeight = guideRect.height * scale;

    console.log("[CAPTURE MATH]:", {
      nativeWidth, nativeHeight,
      videoRect: { w: videoRect.width, h: videoRect.height, l: videoRect.left, t: videoRect.top },
      guideRect: { w: guideRect.width, h: guideRect.height, l: guideRect.left, t: guideRect.top },
      renderWidth, renderHeight, offsetX, offsetY, scale,
      sourceX, sourceY, sourceWidth, sourceHeight
    });

    // Set canvas to the cropped size exactly matching the guide
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    
    // Draw only the cropped portion from the native video
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight, // source rectangle
      0, 0, sourceWidth, sourceHeight              // destination rectangle
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    setCaptureState("captured");

    // Pause the video feed
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => (t.enabled = false));
    }
  }, []);

  // Retake
  const retake = useCallback(() => {
    setPreview(null);
    setCaptureState("ready");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => (t.enabled = true));
    }
  }, []);

  // Confirm and upload
  const confirmCapture = useCallback(async () => {
    if (!canvasRef.current) return;
    setCaptureState("uploading");

    try {
      // Get blob from canvas
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create image"))),
          "image/jpeg",
          0.85
        );
      });

      // Upload via API
      const formData = new FormData();
      formData.append("photo", blob, "card-photo.jpg");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Create PendingVote via server action
      const result = await submitCapture(
        url,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to process capture");
      }

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Navigate to ballot
      router.push(`/e/${slug}/ballot`);
    } catch (err) {
      console.error("Confirm error:", err);
      setError("Something went wrong. Please try again.");
      setCaptureState("captured");
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
        paddingTop: "2rem",
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{ width: "100%", maxWidth: "500px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "999px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-primary-300)",
              marginBottom: "1rem",
            }}
          >
            <Camera size={16} /> Step 1 of 2
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Capture Course Form
          </h1>
          <p
            style={{
              color: "var(--color-surface-600)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            Line up the top section of your course form, making sure the University crest and your info table are clearly visible.
          </p>
        </div>

        {/* Camera / Preview */}
        <div className="glass-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
          {captureState === "error" ? (
            <div
              style={{
                padding: "3rem 2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 1rem",
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                <SmartphoneNfc size={32} />
              </div>
              <p
                style={{
                  color: "#fca5a5",
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                {error}
              </p>
              <button
                className="btn-secondary"
                onClick={() => window.location.reload()}
              >
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <>
              <div className="camera-frame" style={{ display: preview ? "none" : "block" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <GuideOverlay />
              </div>

              {preview && (
                <div
                  className="animate-fade-in"
                  style={{ 
                    display: "block", 
                    borderRadius: "1rem", 
                    overflow: "hidden", 
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    background: "#000"
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Captured Course Form"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {captureState !== "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {captureState === "initializing" && (
              <button className="btn-primary" disabled style={{ width: "100%" }}>
                <div className="spinner" />
                <span>Starting camera...</span>
              </button>
            )}

            {captureState === "ready" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-surface-600)",
                    textAlign: "center",
                    marginBottom: "0.25rem",
                  }}
                >
                  Make sure the University crest and info table fill the frame
                </p>
                <button
                  className="btn-primary"
                  onClick={takePhoto}
                  style={{ width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}><Camera size={20} /> Capture Photo</span>
                </button>
              </div>
            )}

            {captureState === "captured" && (
              <>
                <button
                  className="btn-primary"
                  onClick={retake}
                  style={{ width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}><RefreshCw size={20} /> Retake Photo</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={confirmCapture}
                  style={{ width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}><Check size={20} /> Confirm & Continue</span>
                </button>
              </>
            )}

            {captureState === "uploading" && (
              <button className="btn-primary" disabled style={{ width: "100%" }}>
                <div className="spinner" />
                <span>Uploading...</span>
              </button>
            )}
          </div>
        )}

        {/* Error Toast */}
        {error && captureState !== "error" && (
          <div
            className="animate-slide-down"
            style={{
              marginTop: "1rem",
              padding: "0.875rem 1rem",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "0.75rem",
              color: "#fca5a5",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </main>
  );
}

function GuideOverlay() {
  return (
    <div
      id="guide-overlay"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%",
        aspectRatio: "1.4 / 1", // Course form top section ratio (crest + info table)
        border: "2px dashed rgba(255, 255, 255, 0.6)",
        borderRadius: "0.5rem",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
        zIndex: 10,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-2.5rem",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          width: "100%",
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        Line up the University crest and info table within the frame
      </div>
      <div className="corner top-left" />
      <div className="corner top-right" />
      <div className="corner bottom-left" />
      <div className="corner bottom-right" />
    </div>
  );
}
