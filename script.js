document.addEventListener("DOMContentLoaded", () => {
    loadPage("home.html");
    bindNavLinks();
  
    window.addEventListener("popstate", e => {
      const page = e.state?.page || "home.html";
      loadPage(page);
      const link = document.querySelector(`.nav-link[data-page="${page}"]`);
      if (link) updateActiveNav(link);
    });
  
    // Sync collapse arrow icon if player starts collapsed
    const collapseBtn = document.getElementById("collapse-btn");
    const musicPlayer = document.getElementById("music-player");
    if (collapseBtn && musicPlayer?.classList.contains("collapsed")) {
      collapseBtn.textContent = "⬆";
    }
  
    // Sync mute icon on load
    const muteBtn = document.getElementById("mute-btn");
    const audio = document.getElementById("audio-player");
    if (muteBtn && audio) {
      muteBtn.textContent = audio.muted ? "🔇" : "🔊";
    }
  });
  
  function bindNavLinks() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) {
          loadPage(page);
          updateActiveNav(link);
          history.pushState({ page }, "", link.getAttribute("href"));
        }
      });
    });
  }
  
  function updateActiveNav(activeLink) {
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    activeLink.classList.add("active");
  }
  
  function loadPage(pageUrl) {
    fetch(pageUrl)
      .then(res => res.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newContent = doc.querySelector("main")?.innerHTML || doc.body.innerHTML;
        document.getElementById("page-content").innerHTML = newContent;
        window.scrollTo(0, 0);
        rebindScripts();
      })
      .catch(err => {
        document.getElementById("page-content").innerHTML = `<p>Error loading ${pageUrl}.</p>`;
        console.error(err);
      });
  }
  
  function rebindScripts() {
    bindNavLinks(); // rebind nav links added dynamically
  
    // Expandable section
    const expandBtn = document.querySelector(".expand-btn");
    const expandContent = document.querySelector(".expand-content");
    if (expandBtn && expandContent) {
      expandBtn.addEventListener("click", () => {
        const isVisible = expandContent.style.display === "block";
        expandContent.style.display = isVisible ? "none" : "block";
        expandBtn.textContent = isVisible ? "➕ What is æ-sham?" : "➖ What is æ-sham?";
      });
    }
  
    // Blog snippet
    const snippetContainer = document.getElementById("blog-snippet");
    if (snippetContainer) {
      fetch("blog.html")
        .then(res => res.text())
        .then(html => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const latestPost = doc.querySelector(".blog-post");
          if (latestPost) {
            const title = latestPost.querySelector("h3")?.textContent || "Untitled";
            const date = latestPost.querySelector(".post-date")?.textContent || "";
            const preview = [...latestPost.querySelectorAll("p")].find(p => !p.classList.contains("post-date"))?.textContent || "";
            snippetContainer.innerHTML = `
              <h3>From the Blog...</h3>
              <h4>${title}</h4>
              <p><em>${date}</em></p>
              <p>${preview}</p>
              <a href="blog.html" class="nav-link" data-page="blog.html">Read more...</a>
            `;
            bindNavLinks(); // Rebind link inside the snippet
          }
        });
    }
  }
  
  // Music player controlssss
  document.getElementById("load-track")?.addEventListener("click", () => {
    const mood = document.getElementById("mood-select")?.value || "chill";
  
    const trackCount = {
      chill: 3,
      hyperpop: 2,
      cyberpunk: 4,
      vaporwave: 3,
      funkdance: 2
    };
  
    const max = trackCount[mood] || 1;
    const randomIndex = Math.floor(Math.random() * max) + 1;
    const audioPath = `assets/music/${mood}/${randomIndex}.mp3`;
  
    const audio = document.getElementById("audio-player");
    audio.src = audioPath;
    audio.play();
  });
  
  document.getElementById("mute-btn")?.addEventListener("click", () => {
    const audio = document.getElementById("audio-player");
    if (!audio) return;
    audio.muted = !audio.muted;
    document.getElementById("mute-btn").textContent = audio.muted ? "🔇" : "🔊";
  });
  
  document.getElementById("collapse-btn")?.addEventListener("click", () => {
    const wrapper = document.getElementById("music-player");
    const collapsed = wrapper.classList.toggle("collapsed");
    document.getElementById("collapse-btn").textContent = collapsed ? "⬆" : "⬇";
  });
  
//// 🎮 æ-PET LOGIC ///////////////////////////////////////

// === ⬇ STATE VARIABLES ===
let hunger = 0;        // 0 = full, 10 = starving
let boredom = 0;       // 0 = engaged, 10 = bored
let currentMood = "normal";

let petInterval;
let currentFrame = 1;
let lastUserActivity = Date.now();  // used to detect boredom

// === ⬇ DOM ELEMENTS ===
const petSprite = document.getElementById("pet-sprite");
const petStatus = document.getElementById("pet-status");

// === ⬇ MAIN ANIMATION PLAYER ===
function playPetAnimation(emotion) {
  clearInterval(petInterval);
  currentFrame = 1;
  currentMood = emotion;

  // Mood label text
  const moodLabels = {
    normal: "Mood: Normal",
    curious: "Mood: Curious",
    sad: "Mood: Sad",
    annoyed: "Mood: Annoyed"
  };
  petStatus.innerText = moodLabels[emotion] || `Mood: ${emotion}`;

  petInterval = setInterval(() => {
    const path = `assets/pet/${emotion}/${currentFrame}.png`;
    petSprite.src = path;
    currentFrame++;

    const testImg = new Image();
    testImg.src = `assets/pet/${emotion}/${currentFrame}.png`;
    testImg.onerror = () => currentFrame = 1;
  }, 600); // animation speed
}

// === ⬇ MOOD BAR UI ===
function updateBars() {
  const hungerBar = document.getElementById("hunger-bar");
  const boredomBar = document.getElementById("boredom-bar");

  const hungerLevel = 100 - (hunger * 10);
  const boredomLevel = 100 - (boredom * 10);

  hungerBar.style.width = `${hungerLevel}%`;
  boredomBar.style.width = `${boredomLevel}%`;
}

// === ⬇ FEED & PLAY FUNCTIONS ===
function feedPet() {
  if (hunger > 3) {
    hunger = Math.max(0, hunger - 4);
    playPetAnimation("normal");
  } else {
    playPetAnimation("annoyed");
  }
  updateBars();
}

function playWithPet() {
  if (boredom > 3) {
    boredom = Math.max(0, boredom - 4);
    playPetAnimation("normal");
  } else {
    playPetAnimation("annoyed");
  }
  updateBars();
}

// === ⬇ MOOD LOGIC
function checkMood() {
  if (hunger >= 7 || boredom >= 7) {
    playPetAnimation("sad");
  } else if (currentMood !== "curious") {
    playPetAnimation("normal");
  }
}

// === ⬇ BOREDOM TIMER (idle-only)
setInterval(() => {
  const minutesSinceActivity = (Date.now() - lastUserActivity) / 60000;
  if (minutesSinceActivity >= 2) {
    boredom = Math.min(10, boredom + 1);
    updateBars();
    checkMood();
  }
}, 15000);

// === ⬇ HUNGER TIMER (every 3 mins atm)
setInterval(() => {
  hunger = Math.min(10, hunger + 1);
  updateBars();
  checkMood();
}, 180000);

// === ⬇ CURIOSITY TRIGGER
document.addEventListener("click", () => {
  lastUserActivity = Date.now();
  if (currentMood !== "annoyed") {
    boredom = Math.max(0, boredom - 2);
    if (currentMood !== "normal") playPetAnimation("curious");
    updateBars();
  }
});


//// ROBOT ARM LOGIC ////////////////////////////////////////////////

function generateThreeJSArm(jointTypes, linkLengths) {
  const container = document.getElementById("three-arm-container");
  container.innerHTML = "";

  const scene = new THREE.Scene();

  const totalHeight = linkLengths.reduce((acc, len) => acc + len, 0);
  container.style.height = `${Math.max(300, totalHeight * 200)}px`;
  const midHeight = totalHeight / 2;

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0.5, midHeight, totalHeight + 2);
  camera.lookAt(0, midHeight, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, totalHeight, 2);
  scene.add(light);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  base.position.y = 0.1;
  scene.add(base);

  let currentY = 0.2;
  let prev = base;

  const links = [];

  for (let i = 0; i < jointTypes.length; i++) {
    const length = linkLengths[i];
    const geometry = new THREE.BoxGeometry(0.1, length, 0.1);
    const color = jointTypes[i] === "R" ? 0xff70aa : 0x70aaff;

    const material = new THREE.MeshStandardMaterial({ color });
    const link = new THREE.Mesh(geometry, material);
    link.position.y = currentY + length / 2;

    scene.add(link);
    links.push(link);

    currentY += length;
    prev = link;
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}
