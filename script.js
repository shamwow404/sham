// script.js - Add any future interactivity here!

console.log("✨ Welcome to my digital world! ✨");

// Example: Simple hover effect for content boxes (optional)
/*
document.querySelectorAll('.content-box').forEach(box => {
    box.addEventListener('mouseover', () => {
        box.style.transform = 'scale(1.02)';
        box.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
    box.addEventListener('mouseout', () => {
        box.style.transform = 'scale(1)';
        box.style.boxShadow = 'none';
    });
});
*/

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.expand-btn');
    const content = document.querySelector('.expand-content');

    if (btn && content) {
        btn.addEventListener('click', () => {
            const isVisible = content.style.display === 'block';
            content.style.display = isVisible ? 'none' : 'block';
            btn.textContent = isVisible ? '➕ What is æ-sham?' : '➖ What is æ-sham?';
        });
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const snippetContainer = document.getElementById("blog-snippet");

    fetch("blog.html")
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const latestPost = doc.querySelector(".blog-post");

            if (latestPost) {
                const title = latestPost.querySelector("h3")?.textContent || "Untitled";
                const date = latestPost.querySelector(".post-date")?.textContent || "";

                // Find first <p> that does NOT have class "post-date"
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
});

document.addEventListener("DOMContentLoaded", () => {
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
    
        generateThreeJSArm(types, lengths); // this is your actual rendering function
    });
    

    // Show builder + hide other projects
    document.querySelector(".expand-project-btn")?.addEventListener("click", () => {
        document.getElementById("arm-builder-ui").style.display = "block";
        document.querySelector("#arm-preview-card").style.display = "none";
        document.querySelectorAll(".other-projects").forEach(el => el.style.display = "none");
    });

    // Collapse builder UI
    document.getElementById("collapse-builder")?.addEventListener("click", () => {
        document.getElementById("arm-builder-ui").style.display = "none";
        document.querySelector("#arm-preview-card").style.display = "block";
        document.querySelectorAll(".other-projects").forEach(el => el.style.display = "block");
    });
});

function generateThreeJSArm(jointTypes, linkLengths) {
    const container = document.getElementById("three-arm-container");
    container.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const totalHeight = linkLengths.reduce((sum, len) => sum + len, 0);
    const midHeight = totalHeight / 2;

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
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

        const color = jointType === "Prismatic" ? 0x6ECFF6 : 0xFF69B4;

        const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
        const material = new THREE.MeshPhongMaterial({ color });
        const link = new THREE.Mesh(geometry, material);
        link.position.y = length / 2;
        joint.add(link);

        // Optional visual cue for prismatic
        if (jointType === "Prismatic") {
            const axisMarker = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, length, 0.03),
                new THREE.MeshPhongMaterial({ color: 0x00bfff })
            );
            axisMarker.position.y = length / 2;
            joint.add(axisMarker);
        }

        scene.add(jointGroup);
        jointMeshes.push({ group: jointGroup, joint, type: jointType, length });

        currentY += length;
    }

    // Add end effector to last joint
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

function setupJointSliders(jointMeshes) {
    const slidersContainer = document.getElementById("joint-angle-sliders");
    slidersContainer.innerHTML = "";

    jointMeshes.forEach((jointData, index) => {
        const label = document.createElement("label");
        label.textContent = `Joint ${index + 1} ${jointData.type === "Prismatic" ? "Extension" : "Angle"}:`;

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
