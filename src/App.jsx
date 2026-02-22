import { useState, useRef, useCallback, useEffect } from "react";

// ─── Config ─────────────────────────────────────────────────────────────────
const FORMATS = {
  "image/heic": { label: "HEIC", color: "#7c3aed", targets: ["JPG", "PNG"] },
  "image/heif": { label: "HEIC", color: "#7c3aed", targets: ["JPG", "PNG"] },
  "image/jpeg": { label: "JPG", color: "#f59e0b", targets: ["PNG", "WEBP"] },
  "image/jpg": { label: "JPG", color: "#f59e0b", targets: ["PNG", "WEBP"] },
  "image/png": { label: "PNG", color: "#10b981", targets: ["JPG", "WEBP"] },
  "image/webp": { label: "WEBP", color: "#06b6d4", targets: ["JPG", "PNG"] },
  "image/gif": { label: "GIF", color: "#ec4899", targets: ["OPTIMIZE"] },
  "image/avif": { label: "AVIF", color: "#8b5cf6", targets: ["JPG", "PNG"] },
  "image/svg+xml": { label: "SVG", color: "#f43f5e", targets: ["PNG"] },
  "application/pdf": { label: "PDF", color: "#ef4444", targets: ["COMPRESS"] },
};

const TARGET_META = {
  JPG: { mime: "image/jpeg", ext: "jpg", color: "#f59e0b", btnLabel: ".JPG" },
  PNG: { mime: "image/png", ext: "png", color: "#10b981", btnLabel: ".PNG" },
  WEBP: { mime: "image/webp", ext: "webp", color: "#06b6d4", btnLabel: ".WEBP" },
  OPTIMIZE: { mime: null, ext: "gif", color: "#ec4899", btnLabel: "Optimize" },
  COMPRESS: { mime: null, ext: "pdf", color: "#ef4444", btnLabel: "Compress" },
};

const CONVERSION_SUGGESTIONS = [
  "HEIC \u2192 JPG",
  "PDF Compressor",
  "PNG \u2192 WebP",
  "GIF Optimizer",
  "HEIC \u2192 PNG",
  "JPG \u2192 PNG",
  "WebP \u2192 JPG",
  "SVG \u2192 PNG",
  "AVIF \u2192 JPG",
  "PNG \u2192 JPG",
];

function detectType(file) {
  // Check extension first for HEIC since browsers often report empty/wrong MIME
  const ext = file.name.split(".").pop().toLowerCase();
  const extMap = { heic: "image/heic", heif: "image/heif", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml", pdf: "application/pdf" };
  if ((ext === "heic" || ext === "heif") && extMap[ext]) return extMap[ext];
  if (file.type && FORMATS[file.type]) return file.type;
  return extMap[ext] || null;
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "");
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator?.userAgent || "");
}

function isHeic(type) {
  return type === "image/heic" || type === "image/heif";
}

// ─── Mesh Background ────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #fefce8 0%, #fdf2f8 25%, #f0f9ff 50%, #f5f3ff 75%, #ecfdf5 100%)",
      }} />
      <div style={{
        position: "absolute", inset: "-20%",
        background: `
          radial-gradient(ellipse 600px 400px at 20% 30%, rgba(251,191,36,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 500px 500px at 80% 20%, rgba(236,72,153,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 700px 350px at 60% 80%, rgba(59,130,246,0.09) 0%, transparent 70%),
          radial-gradient(ellipse 400px 600px at 10% 70%, rgba(16,185,129,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 500px 400px at 90% 60%, rgba(139,92,246,0.08) 0%, transparent 70%)
        `,
        animation: "meshDrift 25s ease-in-out infinite alternate",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />
    </div>
  );
}

// ─── Logo ───────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <a href="/" style={{ textDecoration: "none" }}>
      <h1 style={{
        fontSize: 56, fontWeight: 900, margin: 0, letterSpacing: "-0.04em",
        background: "linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b, #10b981, #06b6d4, #7c3aed)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundSize: "300% 300%",
        animation: "gradientShift 8s ease infinite",
        cursor: "pointer", lineHeight: 1.1, userSelect: "none",
      }}>
        convert.fun
      </h1>
    </a>
  );
}

// ─── Rotating Suggestion Hook ───────────────────────────────────────────────
function useRotatingSuggestion() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % CONVERSION_SUGGESTIONS.length);
        setFade(true);
      }, 350);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return { suggestion: CONVERSION_SUGGESTIONS[index], fade };
}

// ─── Share Button ───────────────────────────────────────────────────────────
function ShareMoment({ visible }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleShare = useCallback(async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: "convert.fun", text: "The funnest file converter.", url: "https://convert.fun" });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText("https://convert.fun");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={handleShare}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 100,
        border: "1px solid rgba(0,0,0,0.06)",
        background: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
        color: copied ? "#10b981" : "#a8a29e",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "all 0.3s ease",
        animation: "fadeInUp 0.6s ease both",
        animationDelay: "0.5s",
        marginTop: 10,
      }}
    >
      {copied ? "Copied!" : "Share convert.fun"}
    </button>
  );
}

// ─── File Card ──────────────────────────────────────────────────────────────
function FileCard({ file, onConvert, onRemove, status, downloadUrl, targetFormat }) {
  const type = detectType(file);
  const fmt = FORMATS[type];
  const isUnsupported = !fmt;
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [xHovered, setXHovered] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  // Get the "also convert to" targets — all targets except the one already converted
  const alsoTargets = fmt ? fmt.targets.filter((t) => t !== targetFormat) : [];

  useEffect(() => {
    if (status === "done" && downloadUrl && targetFormat) {
      const filename = `${baseName(file.name)}.${TARGET_META[targetFormat].ext}`;
      triggerDownload(downloadUrl, filename);
      // Trigger success flash
      setShowSuccessFlash(true);
      const t = setTimeout(() => setShowSuccessFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [status, downloadUrl, targetFormat, file.name]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
      borderRadius: 20, padding: "20px 24px",
      boxShadow: status === "done"
        ? "0 4px 24px rgba(16,185,129,0.12)"
        : status === "error"
        ? "0 4px 24px rgba(239,68,68,0.10)"
        : "0 2px 16px rgba(0,0,0,0.04)",
      border: `1.5px solid ${isUnsupported ? "#e5e7eb" : status === "done" ? "#10b98144" : status === "error" ? "#ef444433" : "rgba(0,0,0,0.04)"}`,
      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      animation: showSuccessFlash ? "successPulse 0.8s ease both" : "cardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      position: "relative", overflow: "hidden",
    }}>
      {/* Converting progress bar */}
      {status === "converting" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 3,
          background: `linear-gradient(90deg, ${fmt?.color || "#666"}, ${fmt?.color || "#666"}88)`,
          animation: "progressBar 1.5s ease-in-out infinite",
        }} />
      )}

      {/* Success shimmer overlay */}
      {showSuccessFlash && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20,
          background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.08) 50%, transparent 100%)",
          animation: "shimmer 0.8s ease both",
          pointerEvents: "none",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Format badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isUnsupported ? "#f3f4f6"
            : status === "done" ? "linear-gradient(135deg, #10b98118, #10b98108)"
            : status === "error" ? "#fef2f2"
            : `linear-gradient(135deg, ${fmt.color}18, ${fmt.color}08)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: status === "done" ? 18 : 11, fontWeight: 800,
          color: isUnsupported ? "#9ca3af" : status === "done" ? "#10b981" : status === "error" ? "#ef4444" : fmt.color,
          letterSpacing: "0.06em",
          transition: "all 0.4s ease",
        }}>
          {isUnsupported ? "???" : status === "done" ? "\u2713" : status === "error" ? "!" : fmt.label}
        </div>

        {/* File info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {file.name}
          </div>
          <div style={{ fontSize: 12, color: status === "error" ? "#ef4444" : status === "done" ? "#10b981" : "#9ca3af", marginTop: 2, transition: "color 0.3s" }}>
            {status === "error"
              ? "Couldn\u2019t convert this file"
              : status === "done"
              ? `Converted to ${TARGET_META[targetFormat].ext.toUpperCase()}`
              : file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
          </div>
        </div>

        {/* Actions area */}
        {isUnsupported ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600, padding: "6px 12px", background: "#fef3c7", borderRadius: 8 }}>
              Coming soon
            </div>
            <RemoveButton hovered={xHovered} onHover={setXHovered} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </div>
        ) : status === "error" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onConvert(file, fmt.targets[0]); }}
              style={{
                padding: "6px 14px", borderRadius: 10, border: "1.5px solid #fca5a5",
                background: "white", color: "#ef4444", fontWeight: 600, fontSize: 12,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
            >
              Retry
            </button>
            <RemoveButton hovered={xHovered} onHover={setXHovered} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </div>
        ) : status === "done" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={(e) => { e.stopPropagation(); triggerDownload(downloadUrl, `${baseName(file.name)}.${TARGET_META[targetFormat].ext}`); }}
              style={{
                padding: "6px 14px", borderRadius: 10, border: "1.5px solid #d1d5db",
                background: "white", color: "#6b7280", fontWeight: 600, fontSize: 12,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}
            >
              Re-download
            </button>
            {alsoTargets.map((t) => {
              const tm = TARGET_META[t];
              const isHovered = hoveredBtn === t;
              return (
                <button key={t}
                  onClick={(e) => { e.stopPropagation(); onConvert(file, t); }}
                  onMouseEnter={() => setHoveredBtn(t)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: "6px 14px", borderRadius: 10,
                    border: `1.5px solid ${isHovered ? tm.color : "#e5e7eb"}`,
                    background: isHovered ? `${tm.color}08` : "white",
                    color: isHovered ? tm.color : "#9ca3af",
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                >
                  Also {tm.btnLabel}
                </button>
              );
            })}
          </div>
        ) : status === "converting" ? (
          <div style={{
            padding: "6px 14px", borderRadius: 10,
            background: `${fmt.color}0d`, color: fmt.color, fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>&#9881;</span>
            Converting
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {fmt.targets.map((t) => {
              const tm = TARGET_META[t];
              const isHovered = hoveredBtn === t;
              return (
                <button key={t}
                  onClick={(e) => { e.stopPropagation(); onConvert(file, t); }}
                  onMouseEnter={() => setHoveredBtn(t)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: "8px 18px", borderRadius: 12, border: "none",
                    background: isHovered
                      ? `linear-gradient(135deg, ${tm.color}, ${tm.color}bb)`
                      : `linear-gradient(135deg, ${tm.color}15, ${tm.color}08)`,
                    color: isHovered ? "white" : tm.color,
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: isHovered ? "scale(1.08)" : "scale(1)",
                    boxShadow: isHovered ? `0 6px 20px ${tm.color}33` : "none",
                    letterSpacing: "0.02em",
                  }}
                >
                  {tm.btnLabel}
                </button>
              );
            })}
            <RemoveButton hovered={xHovered} onHover={setXHovered} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tiny Remove Button ─────────────────────────────────────────────────────
function RemoveButton({ hovered, onHover, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        width: 28, height: 28, borderRadius: 8, border: "none",
        background: hovered ? "#fef2f2" : "transparent",
        color: hovered ? "#ef4444" : "#d1d5db",
        fontSize: 16, fontWeight: 400, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0, lineHeight: 1,
      }}
    >
      &#10005;
    </button>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function ConvertFun() {
  const [files, setFiles] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [downloads, setDownloads] = useState({});
  const [targets, setTargets] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [totalConverted, setTotalConverted] = useState(0);
  const [glowPhase, setGlowPhase] = useState(0);
  const [mobile] = useState(isMobile);
  const inputRef = useRef(null);
  const dragCountRef = useRef(0);
  const { suggestion, fade } = useRotatingSuggestion();

  // Animate glow color phase while dragging
  useEffect(() => {
    if (!dragOver) return;
    let frame;
    let start = performance.now();
    const tick = (now) => {
      setGlowPhase(((now - start) / 20) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragOver]);

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }, []);

  const removeFile = useCallback((fileToRemove) => {
    const key = fileToRemove.name + fileToRemove.lastModified;
    setFiles((prev) => prev.filter((f) => (f.name + f.lastModified) !== key));
    setStatuses((s) => { const n = { ...s }; delete n[key]; return n; });
    setDownloads((d) => {
      if (d[key]) URL.revokeObjectURL(d[key]);
      const n = { ...d }; delete n[key]; return n;
    });
    setTargets((t) => { const n = { ...t }; delete n[key]; return n; });
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCountRef.current++;
    if (dragCountRef.current === 1) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const convertImage = useCallback(async (file, targetFormat) => {
    const key = file.name + file.lastModified;
    // Clear previous conversion state so card resets to fresh "converting"
    setStatuses((s) => ({ ...s, [key]: "converting" }));
    setTargets((t) => ({ ...t, [key]: targetFormat }));
    // Clear old download URL
    setDownloads((d) => {
      if (d[key]) URL.revokeObjectURL(d[key]);
      const n = { ...d };
      delete n[key];
      return n;
    });

    try {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

      if (targetFormat === "COMPRESS" || targetFormat === "OPTIMIZE") {
        // PDF/GIF passthrough for now
        await new Promise((r) => setTimeout(r, 400));
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        setDownloads((d) => ({ ...d, [key]: URL.createObjectURL(blob) }));
      } else {
        const detectedType = detectType(file);

        let sourceBlob = file;
        // HEIC conversion via heic-to (supports HEVC from modern iPhones)
        if (isHeic(detectedType)) {
          try {
            const { heicTo } = await import("heic-to");
            const tm = TARGET_META[targetFormat];
            const converted = await heicTo({
              blob: file,
              type: tm.mime,
              quality: 0.92,
            });
            setDownloads((d) => ({ ...d, [key]: URL.createObjectURL(converted) }));
            setStatuses((s) => ({ ...s, [key]: "done" }));
            setTotalConverted((c) => c + 1);
            return;
          } catch (heicErr) {
            console.error("heic-to failed:", heicErr);
            setStatuses((s) => ({ ...s, [key]: "error" }));
            return;
          }
        }

        // Canvas-based conversion (for non-HEIC formats)
        const tm = TARGET_META[targetFormat];
        const bitmap = await createImageBitmap(sourceBlob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (targetFormat === "JPG") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0);
        const blob = await new Promise((res) => canvas.toBlob(res, tm.mime, 0.92));
        setDownloads((d) => ({ ...d, [key]: URL.createObjectURL(blob) }));
      }

      setStatuses((s) => ({ ...s, [key]: "done" }));
      setTotalConverted((c) => c + 1);
    } catch (err) {
      console.error(err);
      setStatuses((s) => ({ ...s, [key]: "error" }));
    }
  }, []);

  const convertAll = useCallback((targetFormat) => {
    files.forEach((f) => {
      const key = f.name + f.lastModified;
      if (!statuses[key]) {
        const type = detectType(f);
        const fmt = FORMATS[type];
        if (fmt && fmt.targets.includes(targetFormat)) convertImage(f, targetFormat);
      }
    });
  }, [files, statuses, convertImage]);

  const clearAll = () => {
    Object.values(downloads).forEach(URL.revokeObjectURL);
    setFiles([]); setStatuses({}); setDownloads({}); setTargets({});
  };

  const pendingFiles = files.filter((f) => !statuses[f.name + f.lastModified]);
  const commonTargets = pendingFiles.length > 1
    ? [...new Set(pendingFiles.flatMap((f) => { const t = detectType(f); return FORMATS[t]?.targets || []; }))]
    : [];

  // Show share after 3+ conversions
  const showShare = totalConverted >= 3;

  // Glow colors
  const hue1 = glowPhase % 360;
  const hue2 = (glowPhase + 120) % 360;
  const hue3 = (glowPhase + 240) % 360;
  const glowShadow = dragOver
    ? `0 0 30px hsla(${hue1},85%,60%,0.35), 0 0 60px hsla(${hue2},85%,60%,0.2), 0 0 90px hsla(${hue3},85%,60%,0.1), inset 0 0 30px hsla(${hue1},85%,70%,0.06)`
    : "0 2px 20px rgba(0,0,0,0.03)";

  // Drop zone padding — when files exist and dragging, expand to ~2x height
  const hasFiles = files.length > 0;
  let dropPadding;
  if (!hasFiles) {
    dropPadding = "100px 32px";
  } else if (dragOver) {
    dropPadding = "56px 28px";
  } else {
    dropPadding = "24px 28px";
  }

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
    }}>
      <MeshBackground />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Logo />
          <p style={{
            fontSize: 17, color: "#78716c", marginTop: 10, fontWeight: 500,
            letterSpacing: "-0.01em",
          }}>
            You've never had so much fun converting files.
          </p>
          {totalConverted > 0 && (
            <div style={{
              display: "inline-block", marginTop: 14, padding: "5px 14px", borderRadius: 100,
              background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
              fontSize: 13, fontWeight: 700, animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
              letterSpacing: "0.01em",
            }}>
              {totalConverted} file{totalConverted !== 1 ? "s" : ""} converted
            </div>
          )}
        </div>

        {/* ── Drop Zone ───────────────────────────────────────────────── */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            borderRadius: 28,
            padding: dropPadding,
            background: dragOver
              ? "rgba(255,255,255,0.95)"
              : "rgba(255,255,255,0.55)",
            backdropFilter: "blur(20px)",
            cursor: "pointer",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: dragOver ? "scale(1.02)" : "scale(1)",
            boxShadow: glowShadow,
            textAlign: "center",
            border: dragOver ? "1.5px solid rgba(255,255,255,0.6)" : "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <input ref={inputRef} type="file" multiple
            accept="image/*,.pdf,.heic,.heif,.webp,.avif"
            onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />

          {files.length === 0 ? (
            <>
              <div style={{
                marginBottom: 10,
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(4px)",
                transition: "all 0.35s ease",
                minHeight: "1.4em",
              }}>
                <span style={{
                  fontSize: 15, fontWeight: 500, color: "#c4b5a4",
                  fontStyle: "italic", letterSpacing: "0.01em",
                }}>
                  {suggestion}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#a8a29e" }}>
                {mobile
                  ? "Tap to choose files"
                  : "JPG \u00b7 PNG \u00b7 HEIC \u00b7 WebP \u00b7 AVIF \u00b7 SVG \u00b7 GIF \u00b7 PDF"}
              </div>
            </>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              color: dragOver ? "#7c3aed" : "#7c3aed",
              fontWeight: 600, fontSize: dragOver ? 16 : 14,
              transition: "all 0.4s ease",
            }}>
              <span style={{
                fontSize: dragOver ? 22 : 18,
                transition: "font-size 0.4s ease",
              }}>+</span> {mobile ? "Add more files" : dragOver ? "Drop it!" : "Drop more files or click to add"}
            </div>
          )}
        </div>

        {/* ── Batch Actions ───────────────────────────────────────────── */}
        {commonTargets.length > 0 && pendingFiles.length > 1 && (
          <div style={{
            marginTop: 16, padding: "12px 18px", borderRadius: 16,
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)",
            boxShadow: "0 1px 8px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.03)",
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            animation: "cardEnter 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#78716c" }}>
              Convert all {pendingFiles.length} &rarr;
            </span>
            {commonTargets.map((t) => {
              const tm = TARGET_META[t];
              return (
                <button key={t} onClick={() => convertAll(t)} style={{
                  padding: "6px 16px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${tm.color}, ${tm.color}cc)`,
                  color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {tm.btnLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* ── File Cards ──────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {files.map((f, i) => {
              const key = f.name + f.lastModified;
              return (
                <div key={key} style={{ animationDelay: `${i * 0.06}s` }}>
                  <FileCard
                    file={f}
                    status={statuses[key]}
                    downloadUrl={downloads[key]}
                    targetFormat={targets[key]}
                    onConvert={convertImage}
                    onRemove={() => removeFile(f)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Clear ───────────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button onClick={clearAll} style={{
              padding: "10px 24px", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.06)",
              background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)",
              color: "#a8a29e", fontWeight: 600, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#a8a29e"; }}
            >
              Start fresh
            </button>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <div style={{ fontSize: 12, color: "#c4b5a4", letterSpacing: "0.02em" }}>
            100% browser-based. Your files never leave your device.
          </div>
          <ShareMoment visible={showShare} />
        </div>
      </div>

      {/* ── Global Styles ───────────────────────────────────────────── */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes meshDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(3%, -2%) rotate(0.5deg); }
          50% { transform: translate(-2%, 3%) rotate(-0.5deg); }
          75% { transform: translate(2%, 1%) rotate(0.3deg); }
          100% { transform: translate(-1%, -2%) rotate(-0.3deg); }
        }
        @keyframes cardEnter {
          0% { opacity: 0; transform: translateY(16px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes successPulse {
          0% { box-shadow: 0 4px 24px rgba(16,185,129,0.12); }
          40% { box-shadow: 0 4px 32px rgba(16,185,129,0.25), 0 0 0 4px rgba(16,185,129,0.08); }
          100% { box-shadow: 0 4px 24px rgba(16,185,129,0.12); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
