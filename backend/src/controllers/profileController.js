const prisma = require("../config/db");

// ── Badge definitions ─────────────────────────────────────────────────────────
const BADGE_DEFS = [
  { key: "first_project",      label: "First Project",       desc: "Created your first project",          icon: "🚀", color: "from-indigo-500 to-purple-600" },
  { key: "collaborator",       label: "Collaborator",        desc: "Joined your first project",           icon: "🤝", color: "from-green-500 to-teal-500" },
  { key: "connector",          label: "Connector",           desc: "Made your first connection",          icon: "🌐", color: "from-blue-500 to-cyan-500" },
  { key: "streak_3",           label: "3-Day Streak",        desc: "Active 3 days in a row",              icon: "🔥", color: "from-orange-500 to-red-500" },
  { key: "streak_7",           label: "7-Day Streak",        desc: "Active 7 days in a row",              icon: "⚡", color: "from-yellow-400 to-orange-500" },
  { key: "streak_30",          label: "30-Day Streak",       desc: "Active 30 days in a row",             icon: "💎", color: "from-purple-500 to-pink-500" },
  { key: "project_5",          label: "Project Master",      desc: "Created 5 or more projects",          icon: "🏆", color: "from-yellow-500 to-amber-500" },
  { key: "top_contributor",    label: "Top Contributor",     desc: "Contributed to 3+ projects",          icon: "⭐", color: "from-amber-400 to-yellow-300" },
  { key: "commentator",        label: "Commentator",         desc: "Posted 10+ comments",                 icon: "💬", color: "from-sky-400 to-blue-500" },
  { key: "liked_10",           label: "Appreciated",         desc: "Received 10+ likes across projects",  icon: "❤️", color: "from-red-400 to-pink-500" },
  { key: "open_source",        label: "Open Source Hero",    desc: "All projects are public",             icon: "🌍", color: "from-green-400 to-emerald-500" },
  { key: "recruiter_ready",    label: "Recruiter Ready",     desc: "Profile has bio, skills, and links",  icon: "💼", color: "from-slate-400 to-gray-500" },
];

// ── Reputation score formula ──────────────────────────────────────────────────
// projects×10 + contributions×8 + connections×3 + comments×1 + likes_received×2 + streak_bonus
function calcReputation({ projects, contributions, connections, comments, likesReceived, currentStreak, badges }) {
  const base = (projects * 10) + (contributions * 8) + (connections * 3) + (comments * 1) + (likesReceived * 2);
  const streakBonus = currentStreak >= 30 ? 50 : currentStreak >= 7 ? 20 : currentStreak >= 3 ? 10 : 0;
  const badgeBonus = badges * 5;
  return Math.min(base + streakBonus + badgeBonus, 9999);
}

function getLevel(score) {
  if (score >= 5000) return { level: 10, label: "Legend", next: null };
  if (score >= 2500) return { level: 9,  label: "Expert",      next: 5000 };
  if (score >= 1500) return { level: 8,  label: "Senior Dev",  next: 2500 };
  if (score >= 800)  return { level: 7,  label: "Dev III",     next: 1500 };
  if (score >= 400)  return { level: 6,  label: "Dev II",      next: 800  };
  if (score >= 200)  return { level: 5,  label: "Dev I",       next: 400  };
  if (score >= 100)  return { level: 4,  label: "Junior Dev",  next: 200  };
  if (score >= 50)   return { level: 3,  label: "Intern",      next: 100  };
  if (score >= 20)   return { level: 2,  label: "Newcomer",    next: 50   };
  return               { level: 1,  label: "Beginner",    next: 20   };
}

// ── Record daily activity & update streak ─────────────────────────────────────
async function recordDailyActivity(userId) {
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const today = new Date(todayStr);

  let streak = await prisma.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        totalActiveDays: 1,
        activityGrid: { [todayStr]: 1 },
      },
    });
    return streak;
  }

  const grid = (streak.activityGrid || {});
  const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate).toISOString().slice(0, 10) : null;

  // Increment count for today
  grid[todayStr] = (grid[todayStr] || 0) + 1;

  // Streak logic
  let newCurrent = streak.currentStreak;
  let newTotal = streak.totalActiveDays;

  if (lastDate !== todayStr) {
    newTotal += 1;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDate === yesterdayStr) {
      newCurrent += 1; // continued streak
    } else {
      newCurrent = 1; // streak broken
    }
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent);

  return prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActiveDate: today,
      totalActiveDays: newTotal,
      activityGrid: grid,
    },
  });
}

// ── Check & award badges ──────────────────────────────────────────────────────
async function awardBadges(userId) {
  const [
    projects, contributions, connections, comments,
    likesReceived, streak, existingBadges, user,
  ] = await Promise.all([
    prisma.project.count({ where: { ownerId: userId } }),
    prisma.projectMember.count({ where: { userId, role: "CONTRIBUTOR" } }),
    prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ senderId: userId }, { receiverId: userId }] } }),
    prisma.projectComment.count({ where: { userId } }),
    prisma.projectLike.count({ where: { project: { ownerId: userId } } }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { bio: true, skills: true, linkedinUrl: true, githubProfileUrl: true, website: true } }),
  ]);

  const earned = new Set(existingBadges.map(b => b.badgeKey));
  const toAward = [];

  if (projects >= 1   && !earned.has("first_project"))   toAward.push("first_project");
  if (contributions >= 1 && !earned.has("collaborator")) toAward.push("collaborator");
  if (connections >= 1   && !earned.has("connector"))    toAward.push("connector");
  if ((streak?.currentStreak ?? 0) >= 3  && !earned.has("streak_3"))  toAward.push("streak_3");
  if ((streak?.currentStreak ?? 0) >= 7  && !earned.has("streak_7"))  toAward.push("streak_7");
  if ((streak?.currentStreak ?? 0) >= 30 && !earned.has("streak_30")) toAward.push("streak_30");
  if (projects >= 5   && !earned.has("project_5"))        toAward.push("project_5");
  if (contributions >= 3 && !earned.has("top_contributor")) toAward.push("top_contributor");
  if (comments >= 10  && !earned.has("commentator"))      toAward.push("commentator");
  if (likesReceived >= 10 && !earned.has("liked_10"))     toAward.push("liked_10");
  const recruiterReady = user?.bio && user.skills?.length > 0 && (user.linkedinUrl || user.githubProfileUrl || user.website);
  if (recruiterReady && !earned.has("recruiter_ready"))   toAward.push("recruiter_ready");

  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map(badgeKey => ({ userId, badgeKey })),
      skipDuplicates: true,
    });
  }

  return toAward;
}

// ── GET /profile/me  — full profile for authenticated user ────────────────────
const getMyFullProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Record today's activity + update streak
    await recordDailyActivity(userId);
    await awardBadges(userId);

    const [
      user, projects, contributions, connections, comments,
      likesReceived, streak, badges, recentActivity,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: {
        id: true, username: true, email: true, avatarUrl: true,
        githubUsername: true, githubProfileUrl: true,
        bio: true, location: true, website: true, skills: true,
        linkedinUrl: true, twitterUrl: true, portfolioUrl: true,
        availabilityHours: true, createdAt: true,
      }}),
      prisma.project.count({ where: { ownerId: userId } }),
      prisma.projectMember.count({ where: { userId, role: "CONTRIBUTOR" } }),
      prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.projectComment.count({ where: { userId } }),
      prisma.projectLike.count({ where: { project: { ownerId: userId } } }),
      prisma.userStreak.findUnique({ where: { userId } }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { awardedAt: "desc" } }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { project: { select: { id: true, title: true } } },
      }),
    ]);

    const reputationScore = calcReputation({
      projects, contributions, connections, comments, likesReceived,
      currentStreak: streak?.currentStreak ?? 0,
      badges: badges.length,
    });
    const levelInfo = getLevel(reputationScore);

    // Enrich badges with display info
    const enrichedBadges = badges.map(b => {
      const def = BADGE_DEFS.find(d => d.key === b.badgeKey);
      return { ...b, ...(def ?? { label: b.badgeKey, desc: "", icon: "🏅", color: "from-gray-600 to-gray-700" }) };
    });

    res.status(200).json({
      user,
      stats: { projects, contributions, connections, comments, likesReceived },
      streak: streak ?? { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, activityGrid: {} },
      badges: enrichedBadges,
      allBadgeDefs: BADGE_DEFS,
      reputation: { score: reputationScore, ...levelInfo },
      recentActivity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ── GET /profile/:userId — public profile view ────────────────────────────────
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const [
      user, projects, contributions, connections, comments,
      likesReceived, streak, badges,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: {
        id: true, username: true, email: true, avatarUrl: true,
        githubUsername: true, githubProfileUrl: true,
        bio: true, location: true, website: true, skills: true,
        linkedinUrl: true, twitterUrl: true, portfolioUrl: true,
        availabilityHours: true, createdAt: true, profileVisibility: true,
      }}),
      prisma.project.count({ where: { ownerId: userId } }),
      prisma.projectMember.count({ where: { userId, role: "CONTRIBUTOR" } }),
      prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.projectComment.count({ where: { userId } }),
      prisma.projectLike.count({ where: { project: { ownerId: userId } } }),
      prisma.userStreak.findUnique({ where: { userId } }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { awardedAt: "desc" } }),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const reputationScore = calcReputation({
      projects, contributions, connections, comments, likesReceived,
      currentStreak: streak?.currentStreak ?? 0,
      badges: badges.length,
    });
    const levelInfo = getLevel(reputationScore);

    const enrichedBadges = badges.map(b => {
      const def = BADGE_DEFS.find(d => d.key === b.badgeKey);
      return { ...b, ...(def ?? { label: b.badgeKey, desc: "", icon: "🏅", color: "from-gray-600 to-gray-700" }) };
    });

    res.status(200).json({
      user,
      stats: { projects, contributions, connections, comments, likesReceived },
      streak: streak ?? { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, activityGrid: {} },
      badges: enrichedBadges,
      reputation: { score: reputationScore, ...levelInfo },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

module.exports = { getMyFullProfile, getPublicProfile, recordDailyActivity, awardBadges };
