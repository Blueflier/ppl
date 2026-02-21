import { internalMutation } from "./_generated/server";

export const seedFriendData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all seeded users (those with onboardingComplete = true and no email)
    const allUsers = await ctx.db.query("users").collect();
    const seededUsers = allUsers.filter(
      (u) => u.onboardingComplete && u.name && u.name !== "__seed_marker__" && !u.email
    );

    if (seededUsers.length === 0) {
      console.log("No seeded users found");
      return;
    }

    // Always assign usernames to users that don't have one yet
    let usernameCount = 0;
    for (const user of seededUsers) {
      if (!user.username && user.name) {
        const parts = user.name.toLowerCase().split(" ");
        let base = parts.join("_");
        let username = base;
        let suffix = 1;
        while (true) {
          const existing = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", username))
            .first();
          if (!existing) break;
          username = `${base}${suffix}`;
          suffix++;
        }
        await ctx.db.patch(user._id, { username });
        usernameCount++;
      }
    }

    if (usernameCount > 0) {
      console.log(`Assigned ${usernameCount} usernames`);
    }

    // Skip friend creation if friends already exist (seedAll may have created them)
    const existingFriends = await ctx.db.query("friends").collect();
    if (existingFriends.length > 0) {
      console.log(`Friend data already exists (${existingFriends.length} records) — skipping friend creation.`);
      return;
    }

    // Create friend connections: each user gets 2-8 random friends
    let friendshipCount = 0;
    const createdPairs = new Set<string>();

    for (const user of seededUsers) {
      const numFriends = Math.floor(Math.random() * 7) + 2; // 2-8
      const others = seededUsers.filter((u) => u._id !== user._id);
      const shuffled = [...others].sort(() => Math.random() - 0.5);

      for (const friend of shuffled.slice(0, numFriends)) {
        const pairKey1 = `${user._id}_${friend._id}`;
        const pairKey2 = `${friend._id}_${user._id}`;
        if (createdPairs.has(pairKey1) || createdPairs.has(pairKey2)) continue;

        createdPairs.add(pairKey1);
        await ctx.db.insert("friends", {
          requesterId: user._id,
          receiverId: friend._id,
          status: "accepted",
          createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
        friendshipCount++;
      }
    }

    // Also add a few pending requests between random users
    let pendingCount = 0;
    const pendingPairs = seededUsers.slice(0, 10);
    for (let i = 0; i < pendingPairs.length - 1; i += 2) {
      const pairKey1 = `${pendingPairs[i]._id}_${pendingPairs[i + 1]._id}`;
      const pairKey2 = `${pendingPairs[i + 1]._id}_${pendingPairs[i]._id}`;
      if (createdPairs.has(pairKey1) || createdPairs.has(pairKey2)) continue;

      createdPairs.add(pairKey1);
      await ctx.db.insert("friends", {
        requesterId: pendingPairs[i]._id,
        receiverId: pendingPairs[i + 1]._id,
        status: "pending",
        createdAt: Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
      });
      pendingCount++;
    }

    console.log(
      `Seeded: ${friendshipCount} accepted friendships, ${pendingCount} pending requests`
    );
  },
});
