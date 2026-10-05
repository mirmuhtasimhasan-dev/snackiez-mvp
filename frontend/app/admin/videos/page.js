"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createCreatorVideo,
  deleteCreatorVideo,
  getCreatorVideos,
  updateCreatorVideo,
} from "@/app/actions/videos";

// Video and poster files live in the project's public/videos folder and are
// referenced here by path, e.g. /videos/salsasblog_.mp4.
const VIDEO_PREFIX = "/videos/";

const emptyForm = {
  creatorName: "",
  handle: "",
  instagramUrl: "",
  videoUrl: "",
  posterUrl: "",
  sortOrder: "0",
  isVisible: true,
};

const inputClass =
  "w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white";

export default function AdminVideosPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const handleFailure = (result, fallbackMessage) => {
    if (result.unauthorized) {
      router.push("/admin/login");
      return;
    }
    setError(result.message || fallbackMessage);
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const result = await getCreatorVideos();
      if (!result.success) {
        handleFailure(result, "Failed to fetch videos");
        return;
      }
      setVideos(result.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.push("/admin/login");
          return;
        }
        setCheckingAuth(false);
        fetchVideos();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const videoUrl = form.videoUrl.trim();
    const posterUrl = form.posterUrl.trim();

    if (!form.creatorName.trim()) {
      setError("Creator name is required.");
      return;
    }
    if (!videoUrl.startsWith(VIDEO_PREFIX) || videoUrl.length <= VIDEO_PREFIX.length) {
      setError("Video path must start with /videos/, e.g. /videos/salsasblog_.mp4");
      return;
    }
    if (posterUrl && (!posterUrl.startsWith(VIDEO_PREFIX) || posterUrl.length <= VIDEO_PREFIX.length)) {
      setError("Poster path must start with /videos/, e.g. /videos/salsasblog_-poster.jpg");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        videoUrl,
        posterUrl,
        sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
      };
      const result = editingId
        ? await updateCreatorVideo(editingId, payload)
        : await createCreatorVideo(payload);

      if (!result.success) {
        handleFailure(result, "Saving the video failed");
        return;
      }

      resetForm();
      fetchVideos();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setError("");
    setForm({
      creatorName: video.creatorName,
      handle: video.handle || "",
      instagramUrl: video.instagramUrl || "",
      videoUrl: video.videoUrl,
      posterUrl: video.posterUrl || "",
      sortOrder: String(video.sortOrder),
      isVisible: video.isVisible,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (video) => {
    setBusyId(video.id);
    try {
      const result = await updateCreatorVideo(video.id, { isVisible: !video.isVisible });
      if (!result.success) {
        handleFailure(result, "Failed to update video");
        return;
      }
      setVideos((prev) => prev.map((item) => (item.id === video.id ? result.data : item)));
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (video) => {
    if (!confirm(`Delete the video from ${video.creatorName}? The files in public/videos are not touched.`)) return;

    setBusyId(video.id);
    try {
      const result = await deleteCreatorVideo(video.id);
      if (!result.success) {
        handleFailure(result, "Failed to delete video");
        return;
      }
      if (editingId === video.id) resetForm();
      setVideos((prev) => prev.filter((item) => item.id !== video.id));
    } finally {
      setBusyId("");
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold text-gray-700">Loading…</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-orange-500">Creator Videos</h1>
        <p className="mt-1 text-gray-600">
          Shown in “Loved by Creators” on the home page, lowest sort order first. The section
          is hidden when no video is visible. Put the MP4 and poster files in the
          project&apos;s <code className="rounded bg-gray-200 px-1">public/videos</code> folder, then
          enter their paths here.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-md md:grid-cols-2">
          <h2 className="text-xl font-bold md:col-span-2">{editingId ? "Edit video" : "Add video"}</h2>

          <div>
            <label htmlFor="videoUrl" className="mb-2 block font-semibold text-gray-700">Video path</label>
            <input id="videoUrl" name="videoUrl" value={form.videoUrl} onChange={handleChange} className={inputClass} placeholder="/videos/salsasblog_.mp4" spellCheck={false} autoCapitalize="none" />
          </div>

          <div>
            <label htmlFor="posterUrl" className="mb-2 block font-semibold text-gray-700">Poster path</label>
            <input id="posterUrl" name="posterUrl" value={form.posterUrl} onChange={handleChange} className={inputClass} placeholder="/videos/salsasblog_-poster.jpg" spellCheck={false} autoCapitalize="none" />
          </div>

          <div>
            <label htmlFor="creatorName" className="mb-2 block font-semibold text-gray-700">Creator name</label>
            <input id="creatorName" name="creatorName" value={form.creatorName} onChange={handleChange} className={inputClass} placeholder="Foodie Dhaka" />
          </div>

          <div>
            <label htmlFor="handle" className="mb-2 block font-semibold text-gray-700">Handle</label>
            <input id="handle" name="handle" value={form.handle} onChange={handleChange} className={inputClass} placeholder="@foodiedhaka" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="instagramUrl" className="mb-2 block font-semibold text-gray-700">Instagram reel link</label>
            <input id="instagramUrl" name="instagramUrl" type="url" value={form.instagramUrl} onChange={handleChange} className={inputClass} placeholder="https://www.instagram.com/reel/…" />
          </div>

          <div className="grid grid-cols-2 items-end gap-4 md:col-span-2">
            <div>
              <label htmlFor="sortOrder" className="mb-2 block font-semibold text-gray-700">Sort order</label>
              <input id="sortOrder" name="sortOrder" type="number" step="1" value={form.sortOrder} onChange={handleChange} className={inputClass} />
            </div>
            <label className="flex items-center gap-3 pb-3 font-semibold text-gray-700">
              <input name="isVisible" type="checkbox" checked={form.isVisible} onChange={handleChange} className="h-5 w-5" />
              Show on home page
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 md:col-span-2">
              {error}
            </p>
          )}

          <div className="flex gap-4 md:col-span-2">
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : editingId ? "Update video" : "Add video"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="w-full rounded-xl bg-gray-900 py-3 font-bold text-white">
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold">All videos</h2>

          {loading ? (
            <p className="py-8 text-center text-gray-600">Loading videos…</p>
          ) : videos.length === 0 ? (
            <p className="py-8 text-center text-gray-600">
              No videos yet. The home page section stays hidden until you add one.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200">
              {videos.map((video) => (
                <li key={video.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <span className="w-10 shrink-0 text-sm font-semibold text-gray-500">#{video.sortOrder}</span>

                  <div className="aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {video.posterUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- admin preview
                      <img src={video.posterUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{video.creatorName}</p>
                    <p className="truncate text-sm text-gray-600">
                      {video.handle ? `@${video.handle}` : "No handle"}
                      {video.instagramUrl && (
                        <>
                          {" · "}
                          <a href={video.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            Reel
                          </a>
                        </>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-gray-500">{video.videoUrl}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        video.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {video.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => handleEdit(video)} className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggle(video)} disabled={busyId === video.id} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {video.isVisible ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => handleDelete(video)} disabled={busyId === video.id} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
