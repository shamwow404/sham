document.addEventListener("DOMContentLoaded", () => {
    loadPage("home.html");
  
    // Initial nav link setup
    bindNavLinks();
  
    // Back/forward button handling
    window.addEventListener("popstate", e => {
      const page = e.state?.page || "home.html";
      loadPage(page);
      const link = document.querySelector(`.nav-link[data-page="${page}"]`);
      if (link) updateActiveNav(link);
    });
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
        window.scrollTo(0, 0); // 👈 scrolls to top
        rebindScripts();
      })
      .catch(err => {
        document.getElementById("page-content").innerHTML = `<p>Error loading ${pageUrl}.</p>`;
        console.error(err);
      });
  }
  
  
  function rebindScripts() {
    bindNavLinks(); // Rebind any new .nav-link buttons (like the blog snippet one)
  
    // Expandable section (æ-sham)
    const expandBtn = document.querySelector(".expand-btn");
    const expandContent = document.querySelector(".expand-content");
    if (expandBtn && expandContent) {
      expandBtn.addEventListener("click", () => {
        const isVisible = expandContent.style.display === "block";
        expandContent.style.display = isVisible ? "none" : "block";
        expandBtn.textContent = isVisible ? "➕ What is æ-sham?" : "➖ What is æ-sham?";
      });
    }
  
    // Blog Snippet for Home
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
            bindNavLinks(); // Rebind after injecting the Read more link
          }
        });
    }
  
    // Project toggles (Tech page)
    document.querySelectorAll(".expand-project-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const target = document.getElementById(targetId);
        if (!target) return;
  
        document.querySelectorAll(".project-full, .project-preview").forEach(el => {
          if (el !== target && el !== btn.closest(".content-box")) {
            el.style.display = "none";
          }
        });
  
        const currentPreview = btn.closest(".content-box") || target.closest(".project-preview");
        target.style.display = "block";
        currentPreview.style.display = "none";
      });
    });
  
    document.getElementById("collapse-builder")?.addEventListener("click", () => {
      document.getElementById("arm-builder-ui")?.style.setProperty("display", "none");
      document.getElementById("arm-preview-card")?.style.setProperty("display", "block");
      document.getElementById("gesture-preview-card")?.style.setProperty("display", "block");
    });
  
    document.getElementById("collapse-gesture")?.addEventListener("click", () => {
      document.getElementById("gesture-ui")?.style.setProperty("display", "none");
      document.getElementById("gesture-preview-card")?.style.setProperty("display", "block");
      document.getElementById("arm-preview-card")?.style.setProperty("display", "block");
    });
  
    // Arm builder config
    const jointCountInput = document.getElementById("joint-count");
    const jointConfigsDiv = document.getElementById("joint-configs");
  
    const updateJointInputs = () => {
      const count = parseInt(jointCountInput.value);
      jointConfigsDiv.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const row = document.createElement("div");
        row.innerHTML = `
          <label>Joint ${i + 1}:</label>
          <select class="joint-type">
            <option value="revolute">Revolute</option>
            <option value="prismatic">Prismatic</option>
          </select>
          <input type="number" class="link-length" placeholder="Link length (m)" min="0.1" step="0.1" value="0.5">
        `;
        jointConfigsDiv.appendChild(row);
      }
    };
  
    jointCountInput?.addEventListener("change", updateJointInputs);
    if (jointCountInput) updateJointInputs();
  
    document.getElementById("generate-arm")?.addEventListener("click", () => {
      const types = [...document.querySelectorAll(".joint-type")].map(el => el.value);
      const lengths = [...document.querySelectorAll(".link-length")].map(el => parseFloat(el.value));
      generateThreeJSArm(types, lengths);
    });
  }
  
  // 3D Arm Renderer
  function generateThreeJSArm(jointTypes, linkLengths) {
    const container = document.getElementById("three-arm-container");
    container.innerHTML = "";
  
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
  
    const totalHeight = linkLengths.reduce((sum, len) => sum + len, 0);
    const midHeight = totalHeight / 2;
  
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, midHeight, totalHeight * 1.5);
    camera.lookAt(0, midHeight, 0);
  
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
  
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
  
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    base.position.set(0, 0.1, 0);
    scene.add(base);
  
    let currentY = 0.2;
    const jointMeshes = [];
  
    for (let i = 0; i < jointTypes.length; i++) {
      const jointGroup = new THREE.Group();
      jointGroup.position.y = currentY;
  
      const joint = new THREE.Object3D();
      jointGroup.add(joint);
  
      const length = linkLengths[i];
      const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
      const material = new THREE.MeshPhongMaterial({
        color: jointTypes[i] === "revolute" ? 0xFF69B4 : 0x6ECFF6
      });
      const link = new THREE.Mesh(geometry, material);
      link.position.y = length / 2;
      joint.add(link);
  
      scene.add(jointGroup);
      jointMeshes.push({ group: jointGroup, joint, type: jointTypes[i], length });
      currentY += length;
    }
  
    const effector = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xffd700 })
    );
    const lastJoint = jointMeshes[jointMeshes.length - 1];
    effector.position.y = lastJoint.length;
    lastJoint.joint.add(effector);
  
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  
    setupJointSliders(jointMeshes);
  }
  
  function setupJointSliders(jointMeshes) {
    const slidersContainer = document.getElementById("joint-angle-sliders");
    slidersContainer.innerHTML = "";
  
    jointMeshes.forEach((jointData, index) => {
      const label = document.createElement("label");
      label.textContent = `Joint ${index + 1} ${jointData.type === "prismatic" ? "Extension" : "Angle"}`;
  
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = jointData.type === "prismatic" ? "0" : "-180";
      slider.max = jointData.type === "prismatic" ? "2" : "180";
      slider.step = "0.01";
      slider.value = "0";
      slider.style.width = "150px";
      slider.style.accentColor = jointData.type === "prismatic" ? "#6ECFF6" : "#FF69B4";
  
      slider.addEventListener("input", () => {
        if (jointData.type === "revolute") {
          jointData.group.rotation.z = THREE.MathUtils.degToRad(parseFloat(slider.value));
        } else {
          jointData.joint.position.y = parseFloat(slider.value);
        }
      });
  
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "0.5rem";
  
      wrapper.appendChild(label);
      wrapper.appendChild(slider);
      slidersContainer.appendChild(wrapper);
    });
  }
  