"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MePage() {
  const { isAuthed, logout } = useAuth();
  const user = useQuery(
    api.users.getUser,
    isAuthed ? {} : "skip"
  );
  const interests = useQuery(
    api.interests.getUserInterests,
    isAuthed ? {} : "skip"
  );
  const updateUser = useMutation(api.users.updateUser);
  const deleteInterest = useMutation(api.interests.deleteInterest);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white" />
      </div>
    );
  }

  const handleSaveName = async () => {
    if (nameValue.trim()) {
      await updateUser({ name: nameValue.trim() });
    }
    setEditingName(false);
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-6 text-xl font-bold">Me</h1>

      {/* Name */}
      <div className="mb-4">
        <label className="text-xs font-medium text-zinc-500">Name</label>
        {editingName ? (
          <div className="mt-1 flex gap-2">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={handleSaveName}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Save
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setNameValue(user.name ?? "");
              setEditingName(true);
            }}
            className="mt-1 cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          >
            {user.name || (
              <span className="text-zinc-400">Tap to set your name</span>
            )}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="text-xs font-medium text-zinc-500">Email</label>
        <p className="mt-1 text-sm">{user.email ?? "—"}</p>
      </div>

      {/* Interests */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-medium">Your interests</h2>
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest._id}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800"
              >
                {interest.canonicalValue}
                <button
                  onClick={() =>
                    deleteInterest({
                      interestId: interest._id,
                    })
                  }
                  className="ml-1 text-zinc-400 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No interests yet</p>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-700"
      >
        Log out
      </button>
    </div>
  );
}
