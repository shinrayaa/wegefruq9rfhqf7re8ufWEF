const startBtn = document.getElementById("startBtn");
const claimSection = document.getElementById("claim");
const userForm = document.getElementById("userForm");
const usernameInput = document.getElementById("usernameInput");
const fetchBtn = document.getElementById("fetchBtn");
const userFeedback = document.getElementById("userFeedback");
const giftFeedback = document.getElementById("giftFeedback");
const giftItems = document.querySelectorAll(".gift-item");
const progressCount = document.getElementById("progressCount");
const progressStep1 = document.getElementById("progressStep1");
const progressStep2 = document.getElementById("progressStep2");
const progressStep3 = document.getElementById("progressStep3");
const revealItems = document.querySelectorAll(".reveal");
const staticAssetBases = ["./", "./pics/", "./pics/pics/"];
const ASSET_VERSION = "v=112";

let isStep1Done = false;
let isStep2Done = false;

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

function showMessage(message, isOk = false) {
  userFeedback.textContent = message;
  userFeedback.classList.toggle("ok", isOk);
}

userForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  if (!username) {
    isStep1Done = false;
    updateProgressUI();
    showMessage("Please enter your Roblox username.");
    return;
  }

  const isValidUsername = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  fetchBtn.disabled = true;
  showMessage("Checking username format...");

  setTimeout(() => {
    if (isValidUsername) {
      showMessage(`Username accepted: @${username}`, true);
      isStep1Done = true;
    } else {
      showMessage("Invalid username format. Use 3-20 letters, numbers, or underscore.");
      isStep1Done = false;
    }
    updateProgressUI();
    fetchBtn.disabled = false;
  }, 250);
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
