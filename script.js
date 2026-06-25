/* =========================================================================
   EDIT YOUR LINKS HERE  ↓↓↓
   Replace the placeholder URLs below with your real ones, then save.
   This is the ONLY place you need to change links.
   ========================================================================= */
const CONFIG = {
  resumeUrl:   "https://drive.google.com/file/d/1FLaC5WCRyrO2Wa4ppScTya4XZVycgbAJ/view?usp=sharing",                                        // ← your Google Drive resume share link
  githubUrl:   "https://github.com/AniketGaudgaul",         // ← your GitHub profile
  linkedinUrl: "https://www.linkedin.com/in/aniket-gaudgaul-689542213/",      // ← your LinkedIn profile
  paperUrl:    "https://arxiv.org/abs/2401.01596",                                        // ← link to your research paper (arXiv / DOI / PDF)
  paperCode:   "#",                                        // ← repo/code for the paper (or remove the button)
};
/* ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // --- Wire up configurable links ---
  const apply = (selector, url, { newTab = false } = {}) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.setAttribute("href", url);
      if (newTab && url !== "#") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    });
  };

  apply("[data-resume]", CONFIG.resumeUrl, { newTab: true });
  apply("[data-github]", CONFIG.githubUrl, { newTab: true });
  apply("[data-linkedin]", CONFIG.linkedinUrl, { newTab: true });
  apply("[data-paper]", CONFIG.paperUrl, { newTab: true });
  apply("[data-paper-code]", CONFIG.paperCode, { newTab: true });

  // Update visible GitHub/LinkedIn handles from the URLs
  const ghHandle = CONFIG.githubUrl.replace(/\/$/, "").split("/").pop();
  const liHandle = CONFIG.linkedinUrl.replace(/\/$/, "").split("/in/").pop();
  document.querySelectorAll("[data-github] span:last-child").forEach((el) => {
    el.innerHTML = `<strong>GitHub</strong>@${ghHandle}`;
  });
  document.querySelectorAll("[data-linkedin] span:last-child").forEach((el) => {
    el.innerHTML = `<strong>LinkedIn</strong>/in/${liHandle}`;
  });

  // --- Mobile nav toggle ---
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  toggle?.addEventListener("click", () => links.classList.toggle("open"));
  links?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );

  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll(".section");
  revealEls.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  // --- Footer year ---
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
