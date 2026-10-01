"use client";

import { useId, useRef, useState } from "react";
import { discardUnsavedImage, prepareImage, uploadImage } from "@/lib/storage";

// One image field for menu items, categories and reviews: drag and drop or
// pick (gallery/camera on phones), resized to WebP in the browser, uploaded
// with progress. Old saved images are deleted by the server after the record
// saves; uploads replaced before saving are deleted here.
export default function ImageUpload({
  value,
  onChange,
  folder,
  label = "Image",
  aspect = "aspect-[4/3]",
  disabled = false,
  // Set when onChange saves the record right away (categories): the server
  // then deletes the replaced file, so nothing is tracked here.
  savesImmediately = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  // URLs uploaded in this session that no saved record points at yet.
  const unsaved = useRef(new Set());

  const [status, setStatus] = useState("idle"); // idle | preparing | uploading
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  const busy = status !== "idle";

  const replaceWith = (next) => {
    const previous = value;
    onChange(next);
    if (previous && previous !== next && unsaved.current.has(previous)) {
      unsaved.current.delete(previous);
      discardUnsavedImage(previous);
    }
  };

  const handleFile = async (file) => {
    if (!file || busy || disabled) return;
    setError("");

    try {
      setStatus("preparing");
      setProgress(0);
      const blob = await prepareImage(file);

      setStatus("uploading");
      const url = await uploadImage(blob, folder, setProgress);

      if (!savesImmediately) unsaved.current.add(url);
      replaceWith(url);
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openPicker = () => inputRef.current?.click();

  const applyPastedUrl = () => {
    const url = pasteValue.trim();
    if (!/^https?:\/\/\S+$/i.test(url) && !/^\/\S+$/.test(url)) {
      setError("Enter a full image link starting with https://, or a /path from public.");
      return;
    }
    setError("");
    setPasteOpen(false);
    setPasteValue("");
    replaceWith(url);
  };

  const dropHandlers = {
    onDragOver: (event) => {
      event.preventDefault();
      if (!busy && !disabled) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event) => {
      event.preventDefault();
      setDragging(false);
      handleFile(event.dataTransfer.files?.[0]);
    },
  };

  return (
    <div>
      <p className="mb-2 block font-semibold text-gray-700">{label}</p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        disabled={busy || disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {value ? (
        <div
          {...dropHandlers}
          className={`relative overflow-hidden rounded-xl border bg-gray-50 ${aspect} ${
            dragging ? "border-orange-500 ring-2 ring-orange-300" : "border-gray-200"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- any host, admin preview */}
          <img src={value} alt="" className="h-full w-full object-cover" />

          {!busy && (
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => replaceWith(null)}
                disabled={disabled}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-red-600 shadow hover:bg-white"
              >
                Remove
              </button>
            </div>
          )}

          {busy && <ProgressOverlay status={status} progress={progress} />}
        </div>
      ) : (
        <button
          type="button"
          {...dropHandlers}
          onClick={openPicker}
          disabled={busy || disabled}
          className={`relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${aspect} ${
            dragging
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/50"
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500" aria-hidden="true">
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">Upload photo</span>
          <span className="hidden text-xs text-gray-500 md:block">or drag and drop it here</span>
          <span className="text-xs text-gray-400">Resized to WebP, max 1200px</span>
          {busy && <ProgressOverlay status={status} progress={progress} />}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-2 text-sm">
        {pasteOpen ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPastedUrl();
                }
              }}
              placeholder="https://… or /menu/photo.webp"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 outline-none focus:border-orange-500"
              autoFocus
            />
            <button
              type="button"
              onClick={applyPastedUrl}
              className="rounded-lg bg-gray-900 px-3 py-1.5 font-semibold text-white"
            >
              Use
            </button>
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="px-2 font-semibold text-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            disabled={busy || disabled}
            className="text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
          >
            or paste image URL
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressOverlay({ status, progress }) {
  const percent = Math.round(progress * 100);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 px-6" aria-live="polite">
      <span className="text-sm font-semibold text-gray-800">
        {status === "preparing" ? "Optimizing photo…" : `Uploading… ${percent}%`}
      </span>
      <span className="h-2 w-full max-w-48 overflow-hidden rounded-full bg-gray-200">
        <span
          className={`block h-full rounded-full bg-orange-500 transition-[width] ${
            status === "preparing" ? "w-1/4 animate-pulse" : ""
          }`}
          style={status === "uploading" ? { width: `${Math.max(4, percent)}%` } : undefined}
        />
      </span>
    </div>
  );
}
