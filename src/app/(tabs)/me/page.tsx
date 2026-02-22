"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";

function InterestStatsPanel({ selectedInterest }: { selectedInterest: string | null }) {
  const interestStats = useQuery(
    api.interests.getInterestStats,
    selectedInterest ? { canonicalValue: selectedInterest } : "skip"
  );

  // Buffer last known good data so we never flash empty
  const [display, setDisplay] = useState<{
    interest: string;
    stats: { othersCount: number; eventsCount: number };
  } | null>(null);

  useEffect(() => {
    if (selectedInterest && interestStats) {
      setDisplay({ interest: selectedInterest, stats: interestStats });
    } else if (!selectedInterest) {
      setDisplay(null);
    }
  }, [selectedInterest, interestStats]);

  const isLoading = selectedInterest && (!interestStats || display?.interest !== selectedInterest);

  return (
    <div className="rounded-2xl border border-gray-200 p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Interest Stats
      </h3>
      {display ? (
        <div className={`space-y-4 transition-opacity duration-150 ${isLoading ? "opacity-50" : "opacity-100"}`}>
          <p className="text-sm font-medium text-black capitalize">{display.interest}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Others with this interest</span>
              <span className="text-sm font-bold text-sage">{display.stats.othersCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Related events</span>
              <span className="text-sm font-bold text-blue-500">{display.stats.eventsCount}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-300 italic">No interests yet</p>
      )}
    </div>
  );
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-3.5 w-3.5 ${className}`}
    >
      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
    </svg>
  );
}

const SF_NEIGHBORHOODS = [
  "Mission", "SoMa", "Hayes Valley", "Marina", "Castro", "Nob Hill",
  "North Beach", "Pacific Heights", "Sunset", "Richmond", "Haight-Ashbury",
  "Tenderloin", "Potrero Hill", "Dogpatch", "Noe Valley", "Bernal Heights",
  "Inner Sunset", "Outer Sunset", "Cole Valley", "Lower Haight",
];

const CATEGORY_LABELS: Record<string, string> = {
  hobby: "Hobbies",
  problem: "Problems",
  skill: "Skills",
  learning: "Learning",
};

type InterestCategory = "hobby" | "problem" | "skill" | "learning";

export default function MePage() {
  const { isAuthed, logout } = useAuth();
  const user = useQuery(api.users.getUser, isAuthed ? {} : "skip");
  const interests = useQuery(api.interests.getUserInterests, isAuthed ? {} : "skip");
  const friendCount = useQuery(api.friends.getFriendCount, isAuthed ? {} : "skip");
  const friends = useQuery(api.friends.getFriends, isAuthed ? {} : "skip");
  const pendingRequests = useQuery(api.friends.getPendingRequests, isAuthed ? {} : "skip");
  const connectionCount = useQuery(api.connections.getConnectionCount, isAuthed ? {} : "skip");
  const eventsAttended = useQuery(api.rsvps.getEventsAttendedCount, isAuthed ? {} : "skip");

  const updateUser = useMutation(api.users.updateUser);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const saveProfileImage = useMutation(api.users.saveProfileImage);
  const deleteInterest = useMutation(api.interests.deleteInterest);
  const addInterest = useMutation(api.interests.addInterest);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const declineFriendRequest = useMutation(api.friends.declineFriendRequest);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  // Interest state
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<InterestCategory | null>(null);
  const [newInterestValue, setNewInterestValue] = useState("");

  // Friends state
  const [friendUsername, setFriendUsername] = useState("");
  const [friendError, setFriendError] = useState("");
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);

  // Auto-select first interest on mount
  useEffect(() => {
    if (interests && interests.length > 0 && selectedInterest === null) {
      setSelectedInterest(interests[0].canonicalValue);
    }
  }, [interests, selectedInterest]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  const saveField = async (field: string) => {
    if (field === "name" && nameValue.trim()) {
      await updateUser({ name: nameValue.trim() });
    } else if (field === "bio") {
      await updateUser({ bio: bioValue.trim() || undefined });
    } else if (field === "username") {
      try {
        await updateUser({ username: usernameValue.trim() });
      } catch (e: any) {
        alert(e.message || "Failed to update username");
        return;
      }
    }
    setEditField(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await saveProfileImage({ storageId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddInterest = async (category: InterestCategory) => {
    if (!newInterestValue.trim()) return;
    try {
      await addInterest({ category, rawValue: newInterestValue.trim() });
      setNewInterestValue("");
      setAddingCategory(null);
    } catch (e: any) {
      alert(e.message || "Failed to add interest");
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) return;
    setFriendError("");
    const result = await sendFriendRequest({ username: friendUsername.trim() });
    if (result.success) {
      setFriendUsername("");
    } else {
      setFriendError(result.error || "Failed to send request");
    }
  };

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Group interests by category
  const grouped = (interests ?? []).reduce(
    (acc, interest) => {
      const cat = interest.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(interest);
      return acc;
    },
    {} as Record<string, typeof interests extends (infer T)[] | undefined ? T[] : never[]>
  );

  return (
    <div className="px-4 pt-4 pb-24 overflow-y-auto h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-5xl flex gap-6">
        {/* Left column — Profile identity, stats, friends */}
        <div className="flex-1 min-w-0">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative h-16 w-16 shrink-0 rounded-full bg-sage flex items-center justify-center overflow-hidden group"
            >
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
                  <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </button>
            <div className="flex-1 min-w-0">
              {editField === "name" ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveField("name")}
                    placeholder="Your name"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-black outline-none focus:border-sage placeholder:text-gray-400"
                  />
                  <button onClick={() => saveField("name")} className="rounded-lg bg-sage px-3 py-1.5 text-xs text-white">Save</button>
                </div>
              ) : (
                <div onClick={() => { setNameValue(user.name ?? ""); setEditField("name"); }} className="flex items-center gap-2 cursor-pointer group">
                  <h2 className="text-lg font-bold text-black">
                    {user.name || <span className="text-gray-400">Tap to add name</span>}
                  </h2>
                  <PencilIcon className="text-gray-300 group-hover:text-gray-500" />
                </div>
              )}
              {editField === "username" ? (
                <div className="mt-1 flex gap-2">
                  <input
                    autoFocus
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && saveField("username")}
                    placeholder="your_username"
                    maxLength={20}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-black outline-none focus:border-sage placeholder:text-gray-400"
                  />
                  <button onClick={() => saveField("username")} className="rounded-lg bg-sage px-3 py-1.5 text-xs text-white">Save</button>
                </div>
              ) : (
                <div
                  onClick={() => { setUsernameValue(user.username ?? ""); setEditField("username"); }}
                  className="mt-0.5 flex items-center gap-2 cursor-pointer group"
                >
                  <p className="text-sm text-gray-500">
                    {user.username ? `@${user.username}` : <span className="text-gray-300 italic">Set a username</span>}
                  </p>
                  <PencilIcon className="shrink-0 text-gray-300 group-hover:text-gray-500" />
                </div>
              )}
              <p className="text-xs text-gray-400 truncate">{user.email ?? "—"}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-gray-200 px-3 py-3 text-center">
              <p className="text-lg font-bold text-black">{eventsAttended ?? 0}</p>
              <p className="text-xs text-gray-400">Events attended</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-3 text-center">
              <p className="text-lg font-bold text-black">{friendCount ?? 0}</p>
              <p className="text-xs text-gray-400">Friends</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-3 text-center">
              <p className="text-lg font-bold text-black">{connectionCount ?? 0}</p>
              <p className="text-xs text-gray-400">Connections</p>
            </div>
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-gray-200 p-4 mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Profile</h3>

            {/* Bio */}
            <div>
              <label className="text-xs font-medium text-gray-400">Bio</label>
              {editField === "bio" ? (
                <div className="mt-1">
                  <textarea
                    autoFocus
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    maxLength={160}
                    rows={3}
                    placeholder="A few words about yourself..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none resize-none focus:border-sage placeholder:text-gray-300"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{bioValue.length}/160</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditField(null)} className="text-xs text-gray-400">Cancel</button>
                      <button onClick={() => saveField("bio")} className="rounded-lg bg-sage px-3 py-1 text-xs text-white">Save</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={() => { setBioValue(user.bio ?? ""); setEditField("bio"); }} className="mt-1 flex items-center gap-2 cursor-pointer group">
                  <p className="text-sm text-black">
                    {user.bio || <span className="text-gray-300 italic">Add a short bio</span>}
                  </p>
                  <PencilIcon className="shrink-0 text-gray-300 group-hover:text-gray-500" />
                </div>
              )}
            </div>

            {/* Neighborhood */}
            <div>
              <label className="text-xs font-medium text-gray-400">Neighborhood</label>
              {neighborhoodOpen ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SF_NEIGHBORHOODS.map((hood) => (
                    <button
                      key={hood}
                      onClick={async () => { await updateUser({ neighborhood: hood }); setNeighborhoodOpen(false); }}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${user.neighborhood === hood ? "bg-sage text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {hood}
                    </button>
                  ))}
                  <button onClick={() => setNeighborhoodOpen(false)} className="text-xs text-gray-400 ml-1">Cancel</button>
                </div>
              ) : (
                <div onClick={() => setNeighborhoodOpen(true)} className="mt-1 flex items-center gap-2 cursor-pointer group">
                  <p className="text-sm text-black">
                    {user.neighborhood || <span className="text-gray-300 italic">Pick your hood</span>}
                  </p>
                  <PencilIcon className="shrink-0 text-gray-300 group-hover:text-gray-500" />
                </div>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="text-xs font-medium text-gray-400">Age</label>
              <p className="mt-1 text-sm text-black">{user.age ?? <span className="text-gray-300 italic">—</span>}</p>
            </div>
          </div>

          {/* Friends section */}
          <div className="rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Friends</h3>
              <button
                onClick={() => setFriendsModalOpen(true)}
                className="text-xs text-sage font-medium hover:underline"
              >
                {friendCount ?? 0} {(friendCount ?? 0) === 1 ? "friend" : "friends"}
              </button>
            </div>

            {/* Pending requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">Pending requests</p>
                {pendingRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-sm text-black">
                      {req.requesterName}
                      {req.requesterUsername && <span className="text-gray-400 ml-1">@{req.requesterUsername}</span>}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => acceptFriendRequest({ friendshipId: req._id })}
                        className="rounded-lg bg-sage px-2.5 py-1 text-xs text-white"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest({ friendshipId: req._id })}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add friend */}
            <div className="flex gap-2">
              <input
                value={friendUsername}
                onChange={(e) => { setFriendUsername(e.target.value); setFriendError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendFriendRequest()}
                placeholder="Add friend by username"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-sage placeholder:text-gray-300"
              />
              <button
                onClick={handleSendFriendRequest}
                className="rounded-lg bg-sage px-4 py-2 text-sm text-white"
              >
                Send
              </button>
            </div>
            {friendError && <p className="text-xs text-terra mt-1">{friendError}</p>}
          </div>

          {/* Logout */}
          <button onClick={logout} className="rounded-lg border border-terra/60 px-4 py-2 text-sm text-terra">
            Log out
          </button>
        </div>

        {/* Right column — Interest stats + interests */}
        <div className="flex-1 min-w-0">
          {/* Interest stats card */}
          <div className="sticky top-4">
            <InterestStatsPanel selectedInterest={selectedInterest} />

            {/* Grouped Interests */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Interests</h3>
              {(["hobby", "problem", "skill", "learning"] as InterestCategory[]).map((category) => {
                const items = grouped[category] ?? [];
                return (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1.5">{CATEGORY_LABELS[category]}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((interest) => (
                        <button
                          key={interest._id}
                          onClick={() => setSelectedInterest(
                            selectedInterest === interest.canonicalValue ? null : interest.canonicalValue
                          )}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
                            selectedInterest === interest.canonicalValue
                              ? "border-2 border-sage bg-sage/10 text-sage font-medium"
                              : "border border-gray-200 text-black hover:bg-gray-50"
                          }`}
                        >
                          {interest.canonicalValue}
                          <span
                            onClick={(e) => { e.stopPropagation(); deleteInterest({ interestId: interest._id }); }}
                            className="ml-1 text-gray-300 hover:text-terra cursor-pointer"
                          >
                            &times;
                          </span>
                        </button>
                      ))}
                      {addingCategory === category ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={newInterestValue}
                            onChange={(e) => setNewInterestValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddInterest(category);
                              if (e.key === "Escape") { setAddingCategory(null); setNewInterestValue(""); }
                            }}
                            placeholder="Type interest..."
                            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-black outline-none focus:border-sage placeholder:text-gray-300 w-36"
                          />
                          <button onClick={() => handleAddInterest(category)} className="rounded-full bg-sage px-2.5 py-1 text-xs text-white">Add</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingCategory(category); setNewInterestValue(""); }}
                          className="rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-400 hover:border-sage hover:text-sage transition-colors"
                        >
                          + Add more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!interests || interests.length === 0) && (
                <p className="text-sm text-gray-300 italic">No interests yet — head to Ideate to discover some</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Friends modal */}
      {friendsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFriendsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-80 max-h-96 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-black">Friends</h3>
              <button onClick={() => setFriendsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            {friends && friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend._id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-xs font-bold text-sage">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{friend.name}</p>
                      {friend.username && <p className="text-xs text-gray-400">@{friend.username}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-300 italic text-center py-4">No friends yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
