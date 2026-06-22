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

// ── Helpers: week/month keys ──────────────────────────────────────────────────
function getWeekKey(date) {
  // ISO week: "YYYY-WW"
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-${String(weekNum).padStart(2, "0")}`;
}
function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Record daily activity & update streak ─────────────────────────────────────
async function recordDailyActivity(userId) {
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const today = new Date(todayStr);
  const thisWeek  = getWeekKey(today);
  const thisMonth = getMonthKey(today);

  let streak = await prisma.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        weeklyStreak: 1,
        monthlyStreak: 1,
        lastActiveDate: today,
        lastActiveWeek: thisWeek,
        lastActiveMonth: thisMonth,
        totalActiveDays: 1,
        activityGrid: { [todayStr]: 1 },
      },
    });
    return streak;
  }

  const grid     = (streak.activityGrid || {});
  const lastDate = streak.lastActiveDate  ? new Date(streak.lastActiveDate).toISOString().slice(0, 10) : null;
  const lastWeek = streak.lastActiveWeek  ?? null;
  const lastMon  = streak.lastActiveMonth ?? null;

  // Increment count for today
  grid[todayStr] = (grid[todayStr] || 0) + 1;

  // ── Daily streak ──────────────────────────────────────────────────────────
  let newCurrent = streak.currentStreak;
  let newTotal   = streak.totalActiveDays;

  if (lastDate !== todayStr) {
    newTotal += 1;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    newCurrent = lastDate === yesterdayStr ? newCurrent + 1 : 1;
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent);

  // ── Weekly streak ─────────────────────────────────────────────────────────
  let newWeekly = streak.weeklyStreak;
  if (lastWeek !== thisWeek) {
    // Was last active week exactly 1 iso-week before?
    const [ly, lw] = lastWeek ? lastWeek.split("-").map(Number) : [0, 0];
    const [ty, tw] = thisWeek.split("-").map(Number);
    const prevWeek = tw === 1 ? `${ty - 1}-52` : `${ty}-${String(tw - 1).padStart(2, "0")}`;
    newWeekly = lastWeek === prevWeek ? newWeekly + 1 : 1;
  }

  // ── Monthly streak ────────────────────────────────────────────────────────
  let newMonthly = streak.monthlyStreak;
  if (lastMon !== thisMonth) {
    const [ly2, lm2] = lastMon ? lastMon.split("-").map(Number) : [0, 0];
    const [ty2, tm2] = thisMonth.split("-").map(Number);
    const prevMonth = tm2 === 1 ? `${ty2 - 1}-12` : `${ty2}-${String(tm2 - 1).padStart(2, "0")}`;
    newMonthly = lastMon === prevMonth ? newMonthly + 1 : 1;
  }

  return prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak:  newCurrent,
      longestStreak:  newLongest,
      weeklyStreak:   newWeekly,
      monthlyStreak:  newMonthly,
      lastActiveDate: today,
      lastActiveWeek: thisWeek,
      lastActiveMonth: thisMonth,
      totalActiveDays: newTotal,
      activityGrid:   grid,
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

    // Only award badges passively — DO NOT record daily activity on page load.
    // Activity is recorded when real contribution events happen (PRs, comments, joins, etc.)
    await awardBadges(userId);

    const [
      user, projects, contributions, connections, comments,
      likesReceived, streak, badges, activityLogs,
      prsSubmitted, ratingsReceived, avgRating,
      recentPRs, recentBadges, recentMemberships,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: {
        id: true, username: true, email: true, avatarUrl: true,
        githubUsername: true, githubProfileUrl: true,
        bio: true, location: true, website: true, skills: true,
        linkedinUrl: true, twitterUrl: true, portfolioUrl: true,
        availabilityHours: true, createdAt: true,
        contributorTier: true, isPaidContributor: true,
        pricePerBug: true, pricePerFeature: true, hourlyRate: true,
        openForPaidWork: true, totalEarnings: true,
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
      prisma.pullRequest.count({ where: { authorId: userId } }),
      prisma.contributorRating.findMany({ where: { receiverId: userId }, select: { overall: true } }),
      prisma.contributorRating.aggregate({ where: { receiverId: userId }, _avg: { overall: true, codeQuality: true, communication: true, timeliness: true } }),
      // Rich activity sources
      prisma.pullRequest.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, take: 5, include: { project: { select: { id: true, title: true } } } }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { awardedAt: "desc" }, take: 3 }),
      prisma.projectMember.findMany({ where: { userId, role: "CONTRIBUTOR" }, orderBy: { joinedAt: "desc" }, take: 3, include: { project: { select: { id: true, title: true } } } }),
    ]);

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

    // ── Build rich recent activity feed ───────────────────────────────────────
    const richActivity = [];

    // PRs
    for (const pr of recentPRs) {
      const emoji = pr.status === "MERGED" ? "🔀" : pr.status === "CLOSED" ? "❌" : "📬";
      const label = pr.status === "MERGED" ? "PR merged" : pr.status === "CLOSED" ? "PR closed" : "PR submitted";
      richActivity.push({
        id: `pr-${pr.id}`, type: "PR", emoji, description: `${label}: "${pr.title}"`,
        project: pr.project, createdAt: pr.createdAt,
      });
    }

    // Recently earned badges
    for (const b of recentBadges) {
      const def = BADGE_DEFS.find(d => d.key === b.badgeKey);
      if (def) {
        richActivity.push({
          id: `badge-${b.id}`, type: "BADGE", emoji: def.icon,
          description: `Earned badge: ${def.label} — ${def.desc}`,
          project: null, createdAt: b.awardedAt,
        });
      }
    }

    // Joined projects
    for (const m of recentMemberships) {
      richActivity.push({
        id: `member-${m.id}`, type: "CONTRIBUTION", emoji: "🤝",
        description: `Joined "${m.project.title}" as contributor`,
        project: m.project, createdAt: m.joinedAt,
      });
    }

    // Activity logs (filtered to interesting actions)
    const INTERESTING = ["PROJECT_CREATED", "MEMBER_JOINED", "ACCESS_REQUEST_APPROVED"];
    for (const act of activityLogs) {
      if (INTERESTING.includes(act.action)) {
        richActivity.push({
          id: `log-${act.id}`, type: "LOG", emoji: act.action === "PROJECT_CREATED" ? "🚀" : act.action === "MEMBER_JOINED" ? "👥" : "✅",
          description: act.description, project: act.project, createdAt: act.createdAt,
        });
      }
    }

    // Earnings (if any)
    if (user && user.totalEarnings > 0) {
      richActivity.push({
        id: "earnings", type: "EARNINGS", emoji: "💰",
        description: `Total earnings: $${user.totalEarnings.toFixed(2)}`,
        project: null, createdAt: new Date().toISOString(),
      });
    }

    // Sort by date desc, take top 10
    richActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      user,
      stats: { projects, contributions, connections, comments, likesReceived, prsSubmitted },
      streak: streak ?? { currentStreak: 0, longestStreak: 0, weeklyStreak: 0, monthlyStreak: 0, totalActiveDays: 0, activityGrid: {} },
      badges: enrichedBadges,
      allBadgeDefs: BADGE_DEFS,
      reputation: { score: reputationScore, ...levelInfo },
      recentActivity: richActivity.slice(0, 10),
      ratings: {
        count: ratingsReceived.length,
        avgOverall: avgRating._avg.overall ? +avgRating._avg.overall.toFixed(1) : null,
        avgCodeQuality: avgRating._avg.codeQuality ? +avgRating._avg.codeQuality.toFixed(1) : null,
        avgCommunication: avgRating._avg.communication ? +avgRating._avg.communication.toFixed(1) : null,
        avgTimeliness: avgRating._avg.timeliness ? +avgRating._avg.timeliness.toFixed(1) : null,
      },
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
      likesReceived, streak, badges, recentActivity,
      prsSubmitted, avgRating,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: {
        id: true, username: true, email: true, avatarUrl: true,
        githubUsername: true, githubProfileUrl: true,
        bio: true, location: true, website: true, skills: true,
        linkedinUrl: true, twitterUrl: true, portfolioUrl: true,
        availabilityHours: true, createdAt: true, profileVisibility: true,
        contributorTier: true, isPaidContributor: true,
        pricePerBug: true, pricePerFeature: true, hourlyRate: true,
        openForPaidWork: true,
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
      prisma.pullRequest.count({ where: { authorId: userId } }),
      prisma.contributorRating.aggregate({ where: { receiverId: userId }, _avg: { overall: true, codeQuality: true, communication: true, timeliness: true } }),
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
      stats: { projects, contributions, connections, comments, likesReceived, prsSubmitted },
      streak: streak ?? { currentStreak: 0, longestStreak: 0, weeklyStreak: 0, monthlyStreak: 0, totalActiveDays: 0, activityGrid: {} },
      badges: enrichedBadges,
      allBadgeDefs: BADGE_DEFS,
      reputation: { score: reputationScore, ...levelInfo },
      recentActivity,
      ratings: {
        avgOverall: avgRating._avg.overall ? +avgRating._avg.overall.toFixed(1) : null,
        avgCodeQuality: avgRating._avg.codeQuality ? +avgRating._avg.codeQuality.toFixed(1) : null,
        avgCommunication: avgRating._avg.communication ? +avgRating._avg.communication.toFixed(1) : null,
        avgTimeliness: avgRating._avg.timeliness ? +avgRating._avg.timeliness.toFixed(1) : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

module.exports = { getMyFullProfile, getPublicProfile, recordDailyActivity, awardBadges };

// ── Record login (counts toward totalActiveDays only, not streak) ─────────────
async function recordLoginDay(userId) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr);
  let streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) {
    await prisma.userStreak.create({
      data: { userId, currentStreak: 0, longestStreak: 0, weeklyStreak: 0, monthlyStreak: 0, lastActiveDate: today, totalActiveDays: 1, activityGrid: {} },
    });
    return;
  }
  const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate).toISOString().slice(0, 10) : null;
  if (lastDate !== todayStr) {
    await prisma.userStreak.update({ where: { userId }, data: { totalActiveDays: streak.totalActiveDays + 1, lastActiveDate: today } });
  }
}

// Re-export so auth controller can call it
module.exports.recordLoginDay = recordLoginDay;
