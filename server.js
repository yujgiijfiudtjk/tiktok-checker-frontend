const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// TikTok User Info — No API Key needed!
app.get("/tiktok/:username", async (req, res) => {
  const { username } = req.params;

  // TikTok unofficial endpoint — same method socialagechecker.net uses
  const urls = [
    `https://www.tiktok.com/api/user/detail/?uniqueId=${username}&aid=1988&app_name=tiktok_web`,
    `https://www.tiktok.com/node/share/user/@${username}`,
  ];

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.tiktok.com/",
    Origin: "https://www.tiktok.com",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
  };

  for (const url of urls) {
    try {
      const response = await axios.get(url, { headers, timeout: 10000 });
      const data = response.data;

      // Try to extract user info from different response structures
      const userInfo =
        data?.userInfo?.user ||
        data?.UserModule?.users?.[username] ||
        data?.user;

      if (!userInfo) continue;

      const createTime = userInfo.createTime;
      if (!createTime) continue;

      const creationDate = new Date(createTime * 1000);
      const now = new Date();
      const diffMs = now - creationDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffYears = Math.floor(diffDays / 365);
      const diffMonths = Math.floor((diffDays % 365) / 30);

      return res.json({
        success: true,
        username: userInfo.uniqueId || username,
        nickname: userInfo.nickname || username,
        followers: userInfo.followerCount || 0,
        following: userInfo.followingCount || 0,
        likes: userInfo.heartCount || 0,
        videos: userInfo.videoCount || 0,
        verified: userInfo.verified || false,
        avatar: userInfo.avatarMedium || userInfo.avatarThumb || null,
        bio: userInfo.signature || "",
        creationDate: creationDate.toDateString(),
        creationTimestamp: createTime,
        accountAge: `${diffYears} years, ${diffMonths} months`,
        accountAgeDays: diffDays,
      });
    } catch (err) {
      console.log(`URL failed: ${url} — ${err.message}`);
      continue;
    }
  }

  // If all URLs fail
  return res.status(404).json({
    success: false,
    error:
      "Could not fetch TikTok data. Account may be private or TikTok blocked the request.",
  });
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "✅ TikTok Age Checker API running — No API Key needed!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
