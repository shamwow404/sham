document.addEventListener("DOMContentLoaded", () => {
    // Expand/Collapse for index and tech pages
    const expandButtons = document.querySelectorAll(".expand-btn, .expand-project-btn");

    expandButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const parentCard = btn.closest(".content-box");
            const targetId = btn.dataset.target || (parentCard?.id === "arm-preview-card" ? "arm-builder-ui" : null);
            const target = document.getElementById(targetId);

            if (target) {
                // Collapse any previously expanded sections
                document.querySelectorAll(".project-full").forEach(el => {
                    if (el !== target) {
                        el.style.display = "none";
                        el.previousElementSibling.style.display = "block";
                    }
                });

                // Toggle current section visibility
                const currentPreview = parentCard || target.closest(".project-preview");
                if (target.style.display === "none" || !target.style.display) {
                    target.style.display = "block";
                    currentPreview.style.display = "none";
                } else {
                    target.style.display = "none";
                    currentPreview.style.display = "block";
                }
            }
        });
    });

    // Collapse functionality for specific UI elements
    document.getElementById("collapse-builder")?.addEventListener("click", () => {
        document.getElementById("arm-builder-ui").style.display = "none";
        document.getElementById("arm-preview-card").style.display = "block";
    });

    document.getElementById("collapse-gesture")?.addEventListener("click", () => {
        document.getElementById("gesture-ui").style.display = "none";
        document.getElementById("gesture-preview-card").style.display = "block";
    });

    // Blog Snippet Loading
    const snippetContainer = document.getElementById("blog-snippet");
    fetch("blog.html")
        .then(res => res.text())
        .then(html => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const latestPost = doc.querySelector(".blog-post");
            if (latestPost) {
                const title = latestPost.querySelector("h3")?.textContent || "Untitled";
                const date = latestPost.querySelector(".post-date")?.textContent || "";
                const paragraphs = latestPost.querySelectorAll("p");
                let preview = "";
                for (let p of paragraphs) {
                    if (!p.classList.contains("post-date")) {
                        preview = p.textContent;
                        break;
                    }
                }
                snippetContainer.innerHTML = `
                    <h3>From the Blog...</h3>
                    <h4>${title}</h4>
                    <p><em>${date}</em></p>
                    <p>${preview}</p>
                    <a href="blog.html">Read more...</a>
                `;
            } else {
                snippetContainer.innerHTML = "<p>No blog posts found.</p>";
            }
        })
        .catch(err => {
            snippetContainer.innerHTML = "<p>Error loading blog preview.</p>";
            console.error(err);
        });
    
    // Arm Builder Inputs
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
    updateJointInputs();

    document.getElementById("generate-arm")?.addEventListener("click", () => {
        const types = [...document.querySelectorAll(".joint-type")].map(el => el.value);
        const lengths = [...document.querySelectorAll(".link-length")].map(el => parseFloat(el.value));
        generateThreeJSArm(types, lengths);
    });
});

// Three.js Arm Simulation
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

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.1, 0);
    scene.add(base);

    let currentY = 0.2;
    const jointMeshes = [];

    for (let i = 0; i < jointTypes.length; i++) {
        const jointType = jointTypes[i];
        const length = linkLengths[i];

        const jointGroup = new THREE.Group();
        jointGroup.position.y = currentY;

        const joint = new THREE.Object3D();
        jointGroup.add(joint);

        if (jointType === "Revolute") {
            const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
            const material = new THREE.MeshPhongMaterial({ color: 0xFF69B4 });
            const link = new THREE.Mesh(geometry, material);
            link.position.y = length / 2;
            joint.add(link);
        } else {
            const shellGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
            const shellMaterial = new THREE.MeshPhongMaterial({ color: 0xFFB6C1 });
            const shell = new THREE.Mesh(shellGeometry, shellMaterial);
            shell.position.y = length / 2;
            joint.add(shell);

            const innerLength = length * 0.8;
            const innerGeometry = new THREE.CylinderGeometry(0.04, 0.04, innerLength, 16);
            const innerMaterial = new THREE.MeshPhongMaterial({ color: 0x6ECFF6 });
            const innerLink = new THREE.Mesh(innerGeometry, innerMaterial);
            innerLink.position.y = innerLength / 2;
            innerLink.name = "prismaticInner";
            joint.add(innerLink);
        }

        scene.add(jointGroup);
        jointMeshes.push({ group: jointGroup, joint, type: jointType, length });

        currentY += length;
    }

    const effectorGeometry = new THREE.SphereGeometry(0.07, 32, 32);
    const effectorMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    const effector = new THREE.Mesh(effectorGeometry, effectorMaterial);
    const lastJoint = jointMeshes[jointMeshes.length - 1];
    effector.position.y = lastJoint.length;
    lastJoint.joint.add(effector);
    lastJoint.effector = effector;

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
    setupJointSliders(jointMeshes);
}

// Joint Sliders
function setupJointSliders(jointMeshes) {
    const slidersContainer = document.getElementById("joint-angle-sliders");
    slidersContainer.innerHTML = "";

    jointMeshes.forEach((jointData, index) => {
        const label = document.createElement("label");
        label.textContent = `Joint ${index + 1} ${jointData.type === "Prismatic" ? "Extension" : "Angle"}`;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = jointData.type === "Prismatic" ? "0" : "-180";
        slider.max = jointData.type === "Prismatic" ? "2" : "180";
        slider.step = "0.01";
        slider.value = "0";
        slider.style.width = "150px";
        slider.style.accentColor = jointData.type === "Prismatic" ? "#6ECFF6" : "#FF69B4";

        slider.addEventListener("input", () => {
            if (jointData.type === "Revolute") {
                jointData.group.rotation.z = THREE.MathUtils.degToRad(parseFloat(slider.value));
            } else {
                const offset = parseFloat(slider.value);
                jointData.joint.position.y = offset;
                const inner = jointData.joint.getObjectByName("prismaticInner");
                if (inner) inner.position.y = offset + jointData.length * 0.4;
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
