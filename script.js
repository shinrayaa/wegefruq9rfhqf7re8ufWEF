const startBtn = document.getElementById("startBtn");
const claimSection = document.getElementById("claim");
const userForm = document.getElementById("userForm");
const usernameInput = document.getElementById("usernameInput");
const fetchBtn = document.getElementById("fetchBtn");
const userFeedback = document.getElementById("userFeedback");
const userResult = document.getElementById("userResult");
const avatarImg = document.getElementById("avatarImg");
const displayName = document.getElementById("displayName");
const giftFeedback = document.getElementById("giftFeedback");
const giftItems = document.querySelectorAll(".gift-item");
const progressCount = document.getElementById("progressCount");
const progressStep1 = document.getElementById("progressStep1");
const progressStep2 = document.getElementById("progressStep2");
const progressStep3 = document.getElementById("progressStep3");
const revealItems = document.querySelectorAll(".reveal");
const staticAssetBases = ["./", "./pics/", "./pics/pics/"];
const ASSET_VERSION = "v=3";

let isStep1Done = false;
let isStep2Done = false;

if (userResult) {
  userResult.hidden = true;
}
avatarImg?.removeAttribute("src");

startBtn?.addEventListener("click", () => {
  claimSection?.scrollIntoView({ behavior: "smooth", block: "start" });
});

const revealOnScroll = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => revealOnScroll.observe(item));

function fileNameFromPath(path) {
  const cleanPath = path.split("?")[0];
  return cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
}

function imageExists(path) {
  return new Promise((resolve) => {
    const testImage = new Image();
    testImage.onload = () => resolve(true);
    testImage.onerror = () => resolve(false);
    testImage.src = path;
  });
}

async function resolveStaticAsset(fileName) {
  for (const base of staticAssetBases) {
    const candidate = `${base}${fileName}?${ASSET_VERSION}`;
    if (await imageExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function setupStaticImagePaths() {
  const giftImages = document.querySelectorAll(".gift-item img");
  for (const image of giftImages) {
    const fileName = fileNameFromPath(image.getAttribute("src") || "");
    if (!fileName) continue;

    const resolvedPath = await resolveStaticAsset(fileName);
    if (resolvedPath) {
      image.src = resolvedPath;
    }
  }

  const siteBackground = document.querySelector(".site-bg");
  const tutorialSection = document.querySelector(".tutorial-bg");

  const heroPath = await resolveStaticAsset("New Project (9).png");
  if (heroPath && siteBackground) {
    siteBackground.style.backgroundImage =
      `linear-gradient(180deg, rgba(5, 9, 23, 0.3) 0%, rgba(5, 9, 23, 0.85) 55%, rgba(5, 9, 23, 1) 100%), ` +
      `url("${heroPath}")`;
  }

  const tutorialPath = await resolveStaticAsset("tutorail.png");
  if (tutorialPath && tutorialSection) {
    tutorialSection.style.setProperty("--tutorial-bg", `url("${tutorialPath}")`);
  }
}

function updateProgressUI() {
  const completed = Number(isStep1Done) + Number(isStep2Done);
  const shownCompleted = Math.min(completed, 2);

  if (progressCount) progressCount.textContent = String(shownCompleted);

  progressStep1?.classList.toggle("complete", isStep1Done);
  progressStep2?.classList.toggle("complete", isStep2Done);
  progressStep3?.classList.remove("complete");

  progressStep1?.classList.toggle("active", !isStep1Done);
  progressStep2?.classList.toggle("active", isStep1Done && !isStep2Done);
  progressStep3?.classList.toggle("active", isStep1Done && isStep2Done);
}

async function fetchRobloxUser(username) {
  const userLookupResponse = await fetch(
    "https://users.roblox.com/v1/usernames/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    }
  );

  if (!userLookupResponse.ok) {
    throw new Error("Unable to verify username right now.");
  }

  const userLookupData = await userLookupResponse.json();
  const userInfo = userLookupData?.data?.[0];

  if (!userInfo?.id) {
    throw new Error("Username not found. Check spelling and try again.");
  }

  const thumbResponse = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userInfo.id}&size=150x150&format=Png&isCircular=false`
  );

  if (!thumbResponse.ok) {
    throw new Error("Avatar fetch failed. Please retry.");
  }

  const thumbData = await thumbResponse.json();
  const imageUrl = thumbData?.data?.[0]?.imageUrl;

  if (!imageUrl) {
    throw new Error("Could not load avatar image yet. Try again.");
  }

  return {
    username: userInfo.name,
    displayName: userInfo.displayName || userInfo.name,
    imageUrl,
  };
}

function showMessage(message, isOk = false) {
  userFeedback.textContent = message;
  userFeedback.classList.toggle("ok", isOk);
}

userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  if (!username) {
    userResult.hidden = true;
    showMessage("Please enter your Roblox username.");
    return;
  }

  fetchBtn.disabled = true;
  showMessage("Checking username and fetching avatar...");
  userResult.hidden = true;

  try {
    const user = await fetchRobloxUser(username);
    avatarImg.src = user.imageUrl;
    avatarImg.alt = `${user.displayName} Roblox avatar`;
    displayName.textContent = `${user.displayName} (@${user.username})`;
    userResult.hidden = false;
    showMessage("User found successfully.", true);
    isStep1Done = true;
    updateProgressUI();
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
    isStep1Done = false;
    updateProgressUI();
  } finally {
    fetchBtn.disabled = false;
  }
});

giftItems.forEach((item) => {
  item.addEventListener("click", () => {
    item.classList.toggle("selected");
    const selectedCount = document.querySelectorAll(".gift-item.selected").length;
    isStep2Done = selectedCount > 0;

    if (giftFeedback) {
      if (isStep2Done) {
        giftFeedback.textContent = `${selectedCount} gift selected.`;
        giftFeedback.classList.add("ok");
      } else {
        giftFeedback.textContent = "Select at least one gift.";
        giftFeedback.classList.remove("ok");
      }
    }

    updateProgressUI();
  });
});

updateProgressUI();
setupStaticImagePaths();
