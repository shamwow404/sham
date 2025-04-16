// === DOMContentLoaded + Navigation ===
document.addEventListener("DOMContentLoaded", () => {
  loadPage("home.html");
  bindNavLinks();

  window.addEventListener("popstate", e => {
    const page = e.state?.page || "home.html";
    loadPage(page);
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) updateActiveNav(link);
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
  bindNavLinks();

  // Expandable section (single button)
  const expandBtn = document.querySelector(".expand-btn");
  const expandContent = document.querySelector(".expand-content");
  if (expandBtn && expandContent) {
    expandBtn.addEventListener("click", () => {
      const isVisible = expandContent.style.display === "block";
      expandContent.style.display = isVisible ? "none" : "block";
      expandBtn.textContent = isVisible ? "➕ What is æ-sham?" : "➖ What is æ-sham?";
    });
  }

//  Expand/collapse logic for tech project cards
document.querySelectorAll(".expand-project-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;

    // Hide ALL other project previews and UIs EXCEPT the one clicked
    document.querySelectorAll(".project-preview").forEach(card => {
      if (!btn.closest(".project-preview")?.isSameNode(card)) {
        card.style.display = "none";
      }
    });
    document.querySelectorAll(".project-full").forEach(full => {
      if (!target.isSameNode(full)) {
        full.style.display = "none";
      }
    });

    // Show selected project, hide its preview
    btn.closest(".project-preview").style.display = "none";
    target.style.display = "block";

    // Launch setup if needed
    if (targetId === "gesture-ui") {
      setupHandGestureApp?.(document.getElementById("gesture-app-container"));
    }
  });
});

//  Collapse logic: restore previews when a full card is collapsed
document.querySelectorAll("#collapse-builder, #collapse-gesture").forEach(btn => {
  btn.addEventListener("click", () => {
    const full = btn.closest(".project-full");
    if (full) full.style.display = "none";

    // Show ALL preview cards again
    document.querySelectorAll(".project-preview").forEach(preview => {
      preview.style.display = "block";
    });
  });
});


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
          bindNavLinks();
        }
      });
  }
}

// === Music player ===
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

// === æ-PET LOGIC ===
let hunger = 0;
let boredom = 0;
let currentMood = "normal";
let petInterval;
let currentFrame = 1;
let lastUserActivity = Date.now();

const petSprite = document.getElementById("pet-sprite");
const petStatus = document.getElementById("pet-status");

function playPetAnimation(emotion) {
  clearInterval(petInterval);
  currentFrame = 1;
  currentMood = emotion;
  petStatus.innerText = {
    normal: "Mood: Normal",
    curious: "Mood: Curious",
    sad: "Mood: Sad",
    annoyed: "Mood: Annoyed"
  }[emotion] || `Mood: ${emotion}`;

  petInterval = setInterval(() => {
    const path = `assets/pet/${emotion}/${currentFrame}.png`;
    petSprite.src = path;
    currentFrame++;
    const testImg = new Image();
    testImg.src = `assets/pet/${emotion}/${currentFrame}.png`;
    testImg.onerror = () => currentFrame = 1;
  }, 600);
}

function updateBars() {
  const hungerBar = document.getElementById("hunger-bar");
  const boredomBar = document.getElementById("boredom-bar");
  hungerBar.style.width = `${100 - hunger * 10}%`;
  boredomBar.style.width = `${100 - boredom * 10}%`;
}

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

function checkMood() {
  if (hunger >= 7 || boredom >= 7) {
    playPetAnimation("sad");
  } else if (currentMood !== "curious") {
    playPetAnimation("normal");
  }
}

setInterval(() => {
  const minutesSinceActivity = (Date.now() - lastUserActivity) / 60000;
  if (minutesSinceActivity >= 2) {
    boredom = Math.min(10, boredom + 1);
    updateBars();
    checkMood();
  }
}, 15000);

setInterval(() => {
  hunger = Math.min(10, hunger + 1);
  updateBars();
  checkMood();
}, 180000);

document.addEventListener("click", () => {
  lastUserActivity = Date.now();
  if (currentMood !== "annoyed") {
    boredom = Math.max(0, boredom - 2);
    if (currentMood !== "normal") playPetAnimation("curious");
    updateBars();
  }
});

// === ROBOT ARM LOGIC ===
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
  for (let i = 0; i < jointTypes.length; i++) {
    const length = linkLengths[i];
    const geometry = new THREE.BoxGeometry(0.1, length, 0.1);
    const color = jointTypes[i] === "R" ? 0xff70aa : 0x70aaff;
    const material = new THREE.MeshStandardMaterial({ color });
    const link = new THREE.Mesh(geometry, material);
    link.position.y = currentY + length / 2;
    scene.add(link);
    currentY += length;
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

// 🦾 ARM BUILDER: dynamically generate joint inputs
const jointCountInput = document.getElementById("joint-count");
const jointConfigContainer = document.getElementById("joint-configs");
const generateButton = document.getElementById("generate-arm");

if (jointCountInput && jointConfigContainer && generateButton) {
  function renderJointInputs() {
    const count = parseInt(jointCountInput.value, 10);
    jointConfigContainer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "6px";

      wrapper.innerHTML = `
        <label>Joint ${i + 1}:
          <select id="joint-type-${i}">
            <option value="R">Revolute</option>
            <option value="P">Prismatic</option>
          </select>
          <input type="number" id="link-length-${i}" value="1" step="0.1" min="0.1" max="5" />
        </label>
      `;

      jointConfigContainer.appendChild(wrapper);
    }
  }

  jointCountInput.addEventListener("input", renderJointInputs);
  renderJointInputs();

  generateButton.addEventListener("click", () => {
    const jointTypes = [];
    const linkLengths = [];

    const count = parseInt(jointCountInput.value, 10);
    for (let i = 0; i < count; i++) {
      const jointType = document.getElementById(`joint-type-${i}`)?.value;
      const length = parseFloat(document.getElementById(`link-length-${i}`)?.value);
      if (!jointType || isNaN(length)) continue;

      jointTypes.push(jointType);
      linkLengths.push(length);
    }

    generateThreeJSArm(jointTypes, linkLengths);
  });
}

