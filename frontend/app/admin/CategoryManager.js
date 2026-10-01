"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/app/actions/menu";
import { categoryImage, categoryShortName } from "@/lib/categories";
import { IMAGE_FOLDERS } from "@/lib/storage-paths";
import ImageUpload from "./ImageUpload";
import { FoodIcon } from "@/app/components/icons";

const inputClass =
  "w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-orange-500 bg-white text-sm";

function Thumb({ src, own }) {
  return (
    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-amber-600 ring-1 ring-gray-200">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-white">
          <FoodIcon width={22} height={22} />
        </span>
      )}
      {src && !own && (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 text-center text-[9px] font-semibold uppercase text-white">
          item
        </span>
      )}
    </span>
  );
}

function CategoryRow({ category, onChanged, onFailure }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [shortName, setShortName] = useState(category.shortName ?? "");
  const [busy, setBusy] = useState(false);

  const shownImage = categoryImage(category);

  const save = async (input) => {
    setBusy(true);
    try {
      const result = await updateCategory(category.id, input);
      if (!result.success) {
        onFailure(result, "Category update failed");
        return false;
      }
      onChanged();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }
    if (await save({ name, shortName })) setEditing(false);
  };

  return (
    <li className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <Thumb src={shownImage} own={Boolean(category.image)} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{category.name}</p>
          <p className="truncate text-xs text-gray-500">
            Shows as “{categoryShortName(category)}” · {category.menuItems?.length || 0} items
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="shrink-0 text-sm font-semibold text-blue-600"
        >
          {editing ? "Close" : "Edit"}
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mt-3 space-y-3 border-t border-gray-200 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Short name
              <input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                maxLength={16}
                placeholder={categoryShortName({ name })}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <div className="max-w-56">
            <ImageUpload
              label="Category image"
              aspect="aspect-square"
              folder={IMAGE_FOLDERS.categories}
              value={category.image ?? ""}
              savesImmediately
              disabled={busy}
              onChange={(url) => save({ image: url })}
            />
          </div>
          {busy && <p className="text-xs text-gray-500">Saving…</p>}
          {!category.image && (
            <p className="text-xs text-gray-500">
              No image: the site uses the first menu item photo, or an icon if there is none.
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-orange-500 py-2.5 font-bold text-white disabled:opacity-60"
          >
            Save
          </button>
        </form>
      )}
    </li>
  );
}

export default function CategoryManager({ categories, onChanged, onFailure }) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    setSaving(true);
    try {
      const result = await createCategory({ name, shortName });
      if (!result.success) {
        onFailure(result, "Category creation failed");
        return;
      }
      setName("");
      setShortName("");
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-5">Categories</h2>

      <form onSubmit={handleCreate} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
          placeholder="Name, e.g. Burger Specials"
        />
        <input
          type="text"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          maxLength={16}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
          placeholder="Short name (optional), e.g. Burgers"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add Category"}
        </button>
      </form>

      <p className="mt-6 mb-2 text-xs text-gray-500">
        Images upload to Supabase Storage (menu-images/categories). Open a category to add one.
      </p>

      {categories.length === 0 ? (
        <p className="text-gray-600">No categories found.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onChanged={onChanged}
              onFailure={onFailure}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
