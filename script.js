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

    btn.addEventListener('click', () => {
        const isVisible = content.style.display === 'block';
        content.style.display = isVisible ? 'none' : 'block';
        btn.textContent = isVisible ? '➕ What is æ-sham?' : '➖ What is æ-sham?';
    });
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
