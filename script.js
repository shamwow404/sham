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
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    scene.add(base);

    let current = new THREE.Object3D();
    current.position.y = 0.1;
    scene.add(current);

    const jointObjects = [];

    const sliderArea = document.getElementById("joint-angle-sliders");
    if (sliderArea) {
        sliderArea.innerHTML = "";
        sliderArea.style.display = "flex";
        sliderArea.style.flexWrap = "wrap";
        sliderArea.style.gap = "10px";
    }

    for (let i = 0; i < jointTypes.length; i++) {
        const joint = new THREE.Object3D();
        const len = linkLengths[i];

        const link = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, len, 0.1),
            new THREE.MeshStandardMaterial({
                color: jointTypes[i] === "revolute" ? 0xff69b4 : 0x87ceeb
            })
        );
        link.position.y = len / 2;
        joint.add(link);

        // Add end effector
        if (i === jointTypes.length - 1) {
            const effector = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xffff00 })
            );
            effector.position.y = len;
            joint.add(effector);
        }

        joint.position.y = linkLengths[i - 1] || 0;
        current.add(joint);
        current = joint;

        jointObjects.push(joint);

        if (sliderArea) {
            const sliderWrapper = document.createElement("div");
            sliderWrapper.style.display = "flex";
            sliderWrapper.style.alignItems = "center";
            sliderWrapper.style.gap = "5px";
            sliderWrapper.style.minWidth = "230px";

            const sliderLabel = document.createElement("label");
            sliderLabel.textContent =
                jointTypes[i] === "revolute"
                    ? `Joint ${i + 1} Angle:`
                    : `Joint ${i + 1} Extension:`;

            const slider = document.createElement("input");
            slider.type = "range";

            if (jointTypes[i] === "revolute") {
                slider.min = -180;
                slider.max = 180;
                slider.step = 1;
                slider.value = 0;
                slider.style.accentColor = "#ff69b4"; // pink
                slider.addEventListener("input", () => {
                    joint.rotation.z = THREE.MathUtils.degToRad(parseFloat(slider.value));
                    renderer.render(scene, camera);
                });
            } else {
                slider.min = -0.5;
                slider.max = 0.5;
                slider.step = 0.01;
                slider.value = 0;
                slider.style.accentColor = "#87ceeb"; // sky blue
                slider.addEventListener("input", () => {
                    joint.position.y = (linkLengths[i - 1] || 0) + parseFloat(slider.value);
                    renderer.render(scene, camera);
                });
            }

            sliderWrapper.appendChild(sliderLabel);
            sliderWrapper.appendChild(slider);
            sliderArea.appendChild(sliderWrapper);
        }
    }

    renderer.render(scene, camera);

    window.addEventListener("resize", () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.render(scene, camera);
    });
}

