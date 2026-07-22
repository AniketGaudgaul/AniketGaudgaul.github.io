/* =========================================================================
   EDIT YOUR LINKS HERE  ↓↓↓
   Replace the placeholder URLs below with your real ones, then save.
   This is the ONLY place you need to change links.
   ========================================================================= */
const CONFIG = {
  resumeUrl:   "https://drive.google.com/file/d/1FLaC5WCRyrO2Wa4ppScTya4XZVycgbAJ/view?usp=sharing",
  githubUrl:   "https://github.com/AniketGaudgaul",
  linkedinUrl: "https://www.linkedin.com/in/aniket-gaudgaul-689542213/",
  paperUrl:    "https://arxiv.org/abs/2401.01596",
  paperCode:   "#",
  // The deployed RAG agent (FastAPI on Cloud Run, asia-south1). Empty string →
  // widget stays in its built-in demo/mock mode (no network calls).
  agentApi:    "https://ai-avatar-674777075083.asia-south1.run.app",
};
/* ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduced  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP  = !!(window.gsap && window.ScrollTrigger && window.SplitText);

  /* =====================================================
     Basics — always run, no dependencies
     ===================================================== */

  // Configurable links
  const applyLink = (selector, url, newTab = true) => {
    $$(selector).forEach((el) => {
      el.setAttribute("href", url);
      if (newTab && url !== "#") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    });
  };
  applyLink("[data-resume]", CONFIG.resumeUrl);
  applyLink("[data-github]", CONFIG.githubUrl);
  applyLink("[data-linkedin]", CONFIG.linkedinUrl);
  applyLink("[data-paper]", CONFIG.paperUrl);
  applyLink("[data-paper-code]", CONFIG.paperCode);

  const ghHandle = CONFIG.githubUrl.replace(/\/$/, "").split("/").pop();
  const liHandle = CONFIG.linkedinUrl.replace(/\/$/, "").split("/in/").pop();
  $$("[data-github] span:last-child").forEach((el) => {
    el.innerHTML = `<strong>GitHub</strong>@${ghHandle}`;
  });
  $$("[data-linkedin] span:last-child").forEach((el) => {
    el.innerHTML = `<strong>LinkedIn</strong>/in/${liHandle}`;
  });

  // Mobile nav
  const navToggle = $(".nav-toggle");
  const navLinks = $(".nav-links");
  navToggle?.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );

  // Footer year + IST clock
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const clockEl = $("#clock");
  const tickClock = () => {
    if (!clockEl) return;
    try {
      clockEl.textContent = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit",
      });
    } catch { clockEl.textContent = ""; }
  };
  tickClock();
  setInterval(tickClock, 30000);

  // Copy email + toast
  const toast = $(".toast");
  let toastTimer;
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        if (toast) {
          toast.classList.add("show");
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
        }
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });

  // Count-up helper
  const setCountersInstant = () => {
    $$("[data-count]").forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  };
  const animateCounters = () => {
    $$("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      if (!Number.isFinite(target) || reduced || !hasGSAP) {
        el.textContent = target + suffix;
        return;
      }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.2, ease: "power3.out",
        onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
      });
    });
  };

  // Typewriter — cycles hero roles (independent of GSAP)
  const typewriter = () => {
    const typed = $("#typed");
    if (!typed || reduced) return;
    const phrases = ["AI Engineer", "LLM & RAG Specialist", "Multi-Agent Builder", "GenAI Problem Solver"];
    let phrase = 0, chars = phrases[0].length, deleting = true;
    const tick = () => {
      if (deleting) {
        chars--;
        typed.textContent = phrases[phrase].slice(0, chars);
        if (chars === 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          setTimeout(tick, 400);
        } else setTimeout(tick, 38);
      } else {
        chars++;
        typed.textContent = phrases[phrase].slice(0, chars);
        if (chars === phrases[phrase].length) {
          deleting = true;
          setTimeout(tick, 2600);
        } else setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 3400);
  };

  // Card spotlight — track mouse for the radial wash
  if (canHover) {
    $$(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }

  /* =====================================================
     "Ask My AI" — digital twin chat widget
     Wired to the deployed RAG agent via CONFIG.agentApi. The API returns
     Markdown + [n]/[imgN] markers; `adaptReply` maps that to the bubble's
     { text, images, citations } shape. Clear CONFIG.agentApi to fall back to
     the built-in demo answers.
     ===================================================== */
  const initChat = () => {
    const chatBody = $("#chatBody");
    const chatForm = $("#chatForm");
    const chatInput = $("#chatInput");
    const chatSend = $("#chatSend");
    const suggestWrap = $("#chatSuggests");
    if (!chatBody || !chatForm || !chatInput) return;

    const GREETING =
      "Hey, I'm Aniket's digital twin 👋 I'm grounded in a knowledge base covering his career, tech stack and research — ask me anything, or pick a question below.";

    // Demo architecture diagram (inline SVG) — replace with real diagrams served
    // by your backend (any https or data: URL works).
    const DEMO_DIAGRAM = "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='760' height='320' viewBox='0 0 760 320' font-family='ui-monospace,Consolas,monospace'>
        <rect width='760' height='320' fill='#faf7ef'/>
        <text x='24' y='44' font-size='12' letter-spacing='4' fill='#948c7d'>RAG PIPELINE — OVERVIEW</text>
        <defs><marker id='ar' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto-start-reverse'><path d='M0,0 L10,5 L0,10 z' fill='#d6452c'/></marker></defs>
        <g fill='#f1ece1' stroke='#cdc3ad'>
          <rect x='24' y='130' width='110' height='58' rx='10'/>
          <rect x='178' y='130' width='158' height='58' rx='10'/>
          <rect x='380' y='130' width='120' height='58' rx='10'/>
          <rect x='544' y='130' width='140' height='58' rx='10'/>
        </g>
        <rect x='193' y='240' width='128' height='44' rx='12' fill='#f7e4dd' stroke='#e6bdb1'/>
        <rect x='554' y='240' width='120' height='44' rx='12' fill='#d6452c'/>
        <g font-size='13' fill='#211d18' text-anchor='middle'>
          <text x='79' y='164'>User Query</text>
          <text x='257' y='164'>Hybrid Retriever</text>
          <text x='440' y='164'>Re-ranker</text>
          <text x='614' y='164'>LLM + Agents</text>
          <text x='257' y='267' font-size='12' fill='#b8371f'>Knowledge Base</text>
          <text x='614' y='267' font-size='12' fill='#ffffff'>Answer</text>
        </g>
        <g stroke='#d6452c' stroke-width='2' marker-end='url(#ar)'>
          <line x1='134' y1='159' x2='172' y2='159'/>
          <line x1='336' y1='159' x2='374' y2='159'/>
          <line x1='500' y1='159' x2='538' y2='159'/>
          <line x1='257' y1='240' x2='257' y2='194'/>
          <line x1='614' y1='188' x2='614' y2='234'/>
        </g>
      </svg>`
    );

    const SUGGESTIONS = [
      {
        q: "What's his experience with RAG?",
        match: /\brag\b|retriev/i,
        a: {
          text: "Quite deep! At <strong>Yarnit</strong> he built production RAG architectures with hybrid retrieval, vector databases and complex document processing. At <strong>AlgoAnalytics</strong> he evaluated RAG pipelines with the <strong>RAGAS</strong> framework, and at <strong>EDMO</strong> he's wiring knowledge-base retrieval into real-time voice agents.",
          citations: [
            { label: "resume.pdf · Experience", snippet: "Built scalable RAG architectures using hybrid retrieval, vector databases, and complex document processing." },
            { label: "kb/yarnit-projects.md", snippet: "Designed and deployed multi-agent pipelines integrating LLMs with retrieval systems, structured data, and external tools." },
          ],
        },
      },
      {
        q: "Tell me about the MedSumm paper",
        match: /medsumm|paper|research|ecir|publication/i,
        a: {
          text: "<strong>MedSumm</strong> (published at <strong>ECIR 2024</strong>) is a multimodal framework for summarizing code-mixed Hindi-English clinical queries. Aniket co-built the <strong>MMCQS dataset</strong> (3,000+ data points) and applied QLoRA fine-tuning — integrating visual cues improved summarization quality by 15–20%.",
          citations: [
            { label: "arXiv:2401.01596", url: "https://arxiv.org/abs/2401.01596", snippet: "MedSumm: A Multimodal Approach to Summarizing Code-Mixed Hindi-English Clinical Queries — ECIR 2024." },
          ],
        },
      },
      {
        q: "Which agent frameworks does he use?",
        match: /agent|framework|langgraph|autogen|crewai|langchain|\bmcp\b/i,
        a: {
          text: "His daily drivers are <strong>LangGraph</strong> and <strong>AutoGen</strong> for multi-agent orchestration, alongside LangChain, LlamaIndex and CrewAI. He works extensively with tool / function calling and <strong>MCP</strong> to connect agents to real systems. Here's a typical architecture from his docs:",
          images: [
            { src: DEMO_DIAGRAM, alt: "Multi-agent RAG architecture diagram", caption: "kb/architecture.md — RAG pipeline overview" },
          ],
          citations: [
            { label: "kb/architecture.md", snippet: "Standard pipeline: hybrid retrieval over the knowledge base, re-ranking, then an LLM agent layer with tool calling." },
          ],
        },
      },
      {
        q: "How did he built this chat agent?",
        match: /role|open|hire|hiring|job|available|contact|reach/i,
        a: {
          text: "Yes — he's open to <strong>AI Engineer roles</strong>, collaborations and interesting problems. The fastest way to reach the human is <a href='mailto:aniketgaudgaul@gmail.com'>aniketgaudgaul@gmail.com</a>.",
        },
      },
    ];

    const FALLBACK =
      "Good question! My full brain — the RAG pipeline over Aniket's knowledge base — isn't plugged in yet; this is a preview build. Try one of the suggested questions, or reach the human directly at <a href='mailto:aniketgaudgaul@gmail.com'>aniketgaudgaul@gmail.com</a>.";

    /* ---------------------------------------------------------------------
       Markdown → HTML for agent answers. The API returns Markdown; the bubble
       renders HTML. LLM output is untrusted, so escape first, then translate
       only a known-safe subset (bold, italic, inline code, links, lists).
       --------------------------------------------------------------------- */
    const escapeHtml = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const inlineMd = (s) => {
      // Pull code spans out first so emphasis never touches their contents —
      // otherwise snake_case like `parent_section_id` gets mangled into italics.
      const codes = [];
      let t = escapeHtml(s).replace(/`([^`]+)`/g, (_, c) => {
        codes.push(c);
        return `\u0000${codes.length - 1}\u0000`;
      });
      t = t.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
        (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`
      );
      t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); // bold before italic
      t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, "$1<em>$2</em>");
      // Underscore emphasis only at word boundaries, so bare_snake_case is left
      // alone. Lookahead (not lookbehind) for cross-browser safety.
      t = t.replace(/(^|[^A-Za-z0-9_])_([^_\s][^_]*)_(?![A-Za-z0-9_])/g, "$1<em>$2</em>");
      return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
    };

    const mdToHtml = (src) => {
      const lines = String(src || "").replace(/\r\n/g, "\n").split("\n");
      const out = [];
      let list = null; // 'ul' | 'ol'
      let code = null; // { lang, buf } while inside a ``` fenced block
      const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
      const flushCode = () => {
        if (!code) return;
        const body = escapeHtml(code.buf.join("\n"));
        if (/^mermaid$/i.test(code.lang)) {
          // Left as source here; upgraded to an SVG diagram after the reply
          // finishes streaming — see renderMermaid().
          out.push(`<pre class="mermaid" data-mermaid="1">${body}</pre>`);
        } else {
          const cls = code.lang ? ` class="lang-${code.lang.toLowerCase()}"` : "";
          out.push(`<pre class="code-block"><code${cls}>${body}</code></pre>`);
        }
        code = null;
      };
      for (const raw of lines) {
        // Fenced code blocks (```lang … ```). Opening captures the language;
        // any line inside is kept verbatim so diagrams/code aren't mangled.
        const fence = raw.match(/^\s*```+\s*([\w+-]*)\s*$/);
        if (fence) {
          if (code) flushCode();                                   // closing fence
          else { closeList(); code = { lang: fence[1] || "", buf: [] }; } // opening fence
          continue;
        }
        if (code) { code.buf.push(raw); continue; }
        const line = raw.trimEnd();
        if (!line.trim()) { closeList(); continue; }
        let m;
        if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
          if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
          out.push(`<li>${inlineMd(m[1])}</li>`);
        } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
          if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
          out.push(`<li>${inlineMd(m[1])}</li>`);
        } else if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) {
          closeList();
          out.push(`<p class="msg-h"><strong>${inlineMd(m[1])}</strong></p>`);
        } else {
          closeList();
          out.push(`<p>${inlineMd(line)}</p>`);
        }
      }
      closeList();
      flushCode(); // emit an unterminated fence rather than dropping it
      return out.join("");
    };

    /* ---------------------------------------------------------------------
       Map the API's { answer, citations, images } onto the widget's reply
       shape { text, images:[{src,alt,caption}], citations:[{label,snippet}] }.
       --------------------------------------------------------------------- */
    const CITE_RE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
    const adaptReply = (data) => {
      let text = String(data.answer || "");

      // Strip [imgN] figure markers — figures render as blocks below the prose;
      // the API's `images` list is already the ones the answer chose to show.
      text = text
        .replace(/[ \t]*\[img\d+\][ \t]*/gi, " ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Renumber [n] citation markers to a contiguous 1..k matching the returned
      // citations (chips are numbered by array index) — otherwise the prose could
      // read "[5]" while its chip reads "[2]".
      const seen = [];
      text.replace(CITE_RE, (_, grp) => {
        grp.split(",").forEach((n) => {
          const v = parseInt(n, 10);
          if (!seen.includes(v)) seen.push(v);
        });
        return _;
      });
      seen.sort((a, b) => a - b);
      const renum = new Map(seen.map((v, i) => [v, i + 1]));
      text = text.replace(CITE_RE, (_, grp) => {
        const mapped = grp
          .split(",")
          .map((n) => renum.get(parseInt(n, 10)))
          .filter(Boolean);
        return mapped.length ? `[${mapped.join(", ")}]` : "";
      });

      return {
        text: mdToHtml(text),
        images: (data.images || []).map((im) => ({
          src: im.url,
          alt: im.label || im.caption || "figure",
          caption: im.caption || im.label || "",
        })),
        citations: (data.citations || []).map((c) => ({
          label: c.label,
          snippet: c.snippet || c.label,
        })),
        _history: text, // plain-ish answer kept for follow-up context
      };
    };

    // One session id per page load groups the conversation in tracing; `history`
    // gives the router the context it needs to resolve follow-ups.
    const session =
      (self.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      String(Date.now()) + Math.random().toString(16).slice(2);
    const history = [];

    const askAgent = async (message) => {
      // No backend configured → keep the built-in demo behaviour.
      if (!CONFIG.agentApi) {
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
        const hit = SUGGESTIONS.find((s) => s.match.test(message));
        return hit ? hit.a : FALLBACK;
      }
      // Fail fast instead of hanging: on networks that can't reach the API the
      // browser can stall for a long time, so cap it and surface a clean message.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      let res;
      try {
        res = await fetch(CONFIG.agentApi.replace(/\/+$/, "") + "/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: message,
            history: history.slice(-8),
            session_id: session,
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) throw new Error("agent unavailable (" + res.status + ")");
      return adaptReply(await res.json());
    };
    const normalizeReply = (r) => (typeof r === "string" ? { text: r } : r || { text: FALLBACK });

    const scrollToEnd = () =>
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: reduced ? "auto" : "smooth" });

    const addMsg = (role, content) => {
      const msg = document.createElement("div");
      msg.className = `msg msg-${role}`;
      if (role === "agent") {
        const av = document.createElement("span");
        av.className = "msg-avatar";
        av.textContent = "AG";
        msg.appendChild(av);
      }
      const bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      if (role === "user") bubble.textContent = content; // user input is never injected as HTML
      else bubble.innerHTML = content;
      msg.appendChild(bubble);
      chatBody.appendChild(msg);
      scrollToEnd();
      return bubble;
    };

    const showTyping = () =>
      addMsg("agent", '<span class="typing-dots"><span></span><span></span><span></span></span>');

    // Word-by-word "streaming" render for agent replies
    const streamInto = (bubble, html) =>
      new Promise((resolve) => {
        if (reduced) { bubble.innerHTML = html; scrollToEnd(); resolve(); return; }
        const caret = '<span class="stream-caret"></span>';
        const words = html.split(" ");
        let i = 0;
        const step = () => {
          i++;
          bubble.innerHTML = words.slice(0, i).join(" ") + (i < words.length ? caret : "");
          scrollToEnd();
          if (i < words.length) setTimeout(step, 26 + Math.random() * 42);
          else resolve();
        };
        step();
      });

    // Lightbox (built once, shared by all reply images)
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML =
      '<figure><img alt="" /><figcaption></figcaption></figure><button type="button" class="lb-close" aria-label="Close image">✕</button>';
    document.body.appendChild(lightbox);
    const lbImg = lightbox.querySelector("img");
    const lbCap = lightbox.querySelector("figcaption");
    const openLightbox = (src, alt, caption) => {
      lbImg.src = src;
      lbImg.alt = alt || "";
      lbCap.textContent = caption || alt || "";
      lightbox.classList.add("open");
    };
    const closeLightbox = () => lightbox.classList.remove("open");
    lightbox.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });

    // Images + citations appended under a streamed reply
    const renderExtras = (bubble, reply) => {
      (reply.images || []).forEach((im) => {
        const fig = document.createElement("figure");
        fig.className = "msg-figure";
        const img = document.createElement("img");
        img.src = im.src;
        img.alt = im.alt || "";
        img.loading = "lazy";
        img.addEventListener("load", scrollToEnd);
        fig.appendChild(img);
        if (im.caption) {
          const cap = document.createElement("figcaption");
          cap.textContent = im.caption;
          fig.appendChild(cap);
        }
        fig.addEventListener("click", () => openLightbox(im.src, im.alt, im.caption));
        bubble.appendChild(fig);
      });

      const cites = reply.citations || [];
      if (cites.length) {
        const wrap = document.createElement("div");
        wrap.className = "msg-cites";
        const label = document.createElement("span");
        label.className = "cites-label";
        label.textContent = "Sources";
        wrap.appendChild(label);
        const chips = document.createElement("div");
        chips.className = "cite-chips";
        wrap.appendChild(chips);
        const panel = document.createElement("div");
        panel.className = "cite-panel";
        wrap.appendChild(panel);

        let openIdx = -1;
        cites.forEach((cite, i) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "cite-chip";
          const n = document.createElement("span");
          n.className = "n";
          n.textContent = `[${i + 1}]`;
          chip.appendChild(n);
          chip.appendChild(document.createTextNode(cite.label || "source"));
          chip.addEventListener("click", () => {
            if (openIdx === i) {
              openIdx = -1;
              panel.classList.remove("open");
              chip.classList.remove("active");
              return;
            }
            openIdx = i;
            chips.querySelectorAll(".cite-chip").forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            panel.innerHTML = "";
            panel.appendChild(document.createTextNode(`“${cite.snippet || cite.label}”`));
            if (cite.url) {
              const link = document.createElement("a");
              link.className = "cite-src-link";
              link.href = cite.url;
              link.target = "_blank";
              link.rel = "noopener";
              link.textContent = "Open source ↗";
              panel.appendChild(document.createElement("br"));
              panel.appendChild(link);
            }
            panel.classList.add("open");
            scrollToEnd();
          });
          chips.appendChild(chip);
        });
        bubble.appendChild(wrap);
      }
      if (reply.images?.length || cites.length) scrollToEnd();
    };

    // Mermaid diagrams: the library is large, so it's loaded lazily the first
    // time a reply actually contains a ```mermaid block. Rendered with the
    // strict security level since the source comes from the (untrusted) LLM.
    let mermaidReady = null;
    const loadMermaid = () => {
      if (!mermaidReady) {
        mermaidReady = import(
          "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
        ).then((m) => {
          const mermaid = m.default;
          mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
          return mermaid;
        });
      }
      return mermaidReady;
    };
    const renderMermaid = async (bubble) => {
      const blocks = bubble.querySelectorAll("pre.mermaid[data-mermaid]");
      if (!blocks.length) return;
      let mermaid;
      try {
        mermaid = await loadMermaid();
      } catch {
        return; // library failed to load — leave the source blocks as-is
      }
      let i = 0;
      for (const pre of blocks) {
        const src = pre.textContent; // entities decode back to real -->, [ ], | etc.
        const id = "mmd-" + Date.now().toString(36) + "-" + i++;
        try {
          const { svg } = await mermaid.render(id, src);
          const fig = document.createElement("figure");
          fig.className = "msg-figure msg-diagram";
          fig.innerHTML = svg;
          pre.replaceWith(fig);
          scrollToEnd();
        } catch {
          pre.removeAttribute("data-mermaid"); // keep the source as a plain code block
        }
      }
    };

    let busy = false;
    const send = async (text) => {
      const message = (text || "").trim();
      if (!message || busy) return;
      busy = true;
      chatInput.value = "";
      if (chatSend) chatSend.disabled = true;
      addMsg("user", message);
      const typingBubble = showTyping();
      let reply;
      try {
        reply = normalizeReply(await askAgent(message));
      } catch {
        reply = {
          text: "This assistant is still under development and isn't fully live yet. In the meantime, reach me directly at <a href='mailto:aniketgaudgaul@gmail.com'>aniketgaudgaul@gmail.com</a>.",
        };
      }
      typingBubble.innerHTML = "";
      await streamInto(typingBubble, reply.text);
      renderExtras(typingBubble, reply);
      renderMermaid(typingBubble); // upgrade any ```mermaid blocks to SVG diagrams
      // Record the turn so the router can resolve follow-ups ("yes, go deeper").
      if (reply._history !== undefined) {
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: reply._history });
      }
      busy = false;
      if (chatSend) chatSend.disabled = false;
      chatInput.focus({ preventScroll: true });
    };

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      send(chatInput.value);
    });

    // Suggestion chips (NBA-style starters)
    SUGGESTIONS.forEach((s, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "suggest-chip";
      chip.textContent = s.q;
      chip.style.setProperty("--i", i);
      chip.addEventListener("click", () => send(s.q));
      suggestWrap?.appendChild(chip);
    });

    // Greeting streams in the first time the chat scrolls into view
    let greeted = false;
    const greet = async () => {
      if (greeted) return;
      greeted = true;
      const bubble = showTyping();
      await new Promise((r) => setTimeout(r, reduced ? 0 : 850));
      bubble.innerHTML = "";
      await streamInto(bubble, GREETING);
      suggestWrap?.classList.add("is-in");
    };
    const greetIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          greet();
          greetIO.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    greetIO.observe(chatBody);
  };
  initChat();

  /* =====================================================
     Custom cursor
     ===================================================== */
  const initCursor = () => {
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    if (!dot || !ring) return;
    document.body.classList.add("cursor-on");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
    addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = 1; ring.style.opacity = 1; rx = x; ry = y; }
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }, { passive: true });
    const follow = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
    const HOVERABLE = "a, button, .card, .tag";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(HOVERABLE)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(HOVERABLE)) ring.classList.remove("is-hover");
    });
    document.documentElement.addEventListener("mouseleave", () => {
      dot.style.opacity = 0; ring.style.opacity = 0;
    });
    document.documentElement.addEventListener("mouseenter", () => {
      dot.style.opacity = 1; ring.style.opacity = 1;
    });
  };
  if (canHover && !reduced) initCursor();

  /* =====================================================
     Ink flow field — drifting ink filaments on canvas
     ===================================================== */
  const initInk = () => {
    const canvas = $("#ink");
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    let w, h;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    const colors = [
      "rgba(214,69,44,0.50)",
      "rgba(43,38,32,0.32)",
      "rgba(148,140,125,0.40)",
      "rgba(184,55,31,0.40)",
    ];
    const COUNT = Math.max(40, Math.min(130, Math.round((innerWidth * innerHeight) / 16000)));
    const spawn = (p) => {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.life = 140 + Math.random() * 200;
      p.hist = [];
      p.c = colors[(Math.random() * colors.length) | 0];
      p.sp = 0.4 + Math.random() * 0.8;
      return p;
    };
    const parts = [];
    for (let i = 0; i < COUNT; i++) {
      parts.push(spawn({}));
      parts[i].life = Math.random() * 340;
    }
    const mouse = { x: -9999, y: -9999 };
    addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

    let running = true;
    document.addEventListener("visibilitychange", () => { running = !document.hidden; });

    const angleAt = (x, y, t) =>
      (Math.sin(x * 0.0016 + t * 0.00025) +
       Math.cos(y * 0.0014 - t * 0.0002) +
       Math.sin((x + y) * 0.0008 + t * 0.00015)) * 1.8;

    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const a = angleAt(p.x, p.y, now);
        let vx = Math.cos(a) * p.sp;
        let vy = Math.sin(a) * p.sp;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 19600) { // within 140px of cursor — push away
          const d = Math.sqrt(d2) || 1;
          const f = ((140 - d) / 140) * 1.6;
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }
        p.x += vx; p.y += vy; p.life--;
        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          spawn(p);
          continue;
        }
        p.hist.push(p.x, p.y);
        if (p.hist.length > 16) p.hist.splice(0, 2);
        if (p.hist.length < 4) continue;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(p.hist[0], p.hist[1]);
        for (let i = 2; i < p.hist.length; i += 2) ctx.lineTo(p.hist[i], p.hist[i + 1]);
        ctx.stroke();
      }
    };
    requestAnimationFrame(frame);
  };
  if (!reduced) initInk();

  /* =====================================================
     Fallback path — no GSAP or reduced motion
     ===================================================== */
  const navAnchors = $$('.nav-links a[href^="#"]').filter((a) => a.getAttribute("href").length > 1);

  if (!hasGSAP || reduced) {
    document.documentElement.classList.add("no-anim");
    $(".preloader")?.remove();
    setCountersInstant();
    $$(".m-row").forEach((r) => { r.innerHTML += r.innerHTML; });
    typewriter();

    // Plain scroll UI
    const progressBar = $(".scroll-progress span");
    const navWrap = $(".nav-wrap");
    const backTop = $(".back-to-top");
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      navWrap?.classList.toggle("scrolled", y > 40);
      navWrap?.classList.toggle("nav-hidden", y > lastY && y > 320);
      backTop?.classList.toggle("show", y > 600);
      lastY = y;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    backTop?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
    );

    // Simple scrollspy
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    navAnchors.forEach((a) => {
      const t = $(a.getAttribute("href"));
      if (t) spy.observe(t);
    });
    return;
  }

  /* =====================================================
     Full experience — GSAP + ScrollTrigger + Lenis
     ===================================================== */
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Lenis smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // locked until the preloader curtain lifts
  }

  // Scroll-linked UI (progress, nav hide, back-to-top)
  const progressBar = $(".scroll-progress span");
  const navWrap = $(".nav-wrap");
  const backTop = $(".back-to-top");
  let lastY = 0;
  const scrollUI = (y, progress) => {
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    navWrap?.classList.toggle("scrolled", y > 40);
    navWrap?.classList.toggle("nav-hidden", y > lastY + 2 && y > 320);
    backTop?.classList.toggle("show", y > 600);
    lastY = y;
  };
  if (lenis) {
    lenis.on("scroll", (e) => scrollUI(e.scroll, e.progress || 0));
  } else {
    addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollUI(window.scrollY, max > 0 ? window.scrollY / max : 0);
    }, { passive: true });
  }

  const smoothTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -80, duration: 1.4 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  };
  backTop?.addEventListener("click", () => smoothTo(0));
  $$('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (href.length <= 1) return;
    a.addEventListener("click", (e) => {
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      smoothTo(target);
    });
  });

  // Scrollspy via ScrollTrigger
  $$("main section[id]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (!self.isActive) return;
        navAnchors.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === `#${sec.id}`)
        );
      },
    });
  });

  // Velocity-reactive marquee rows
  const initMarquee = () => {
    const rows = $$(".m-row");
    if (!rows.length) return;
    rows.forEach((r) => { r.innerHTML += r.innerHTML; });
    const dirs = rows.map((_, i) => (i % 2 === 0 ? -1 : 1));
    const pos = rows.map(() => 0);
    let factor = 1, targetFactor = 1;
    gsap.ticker.add((time, delta) => {
      factor += (targetFactor - factor) * 0.06;
      rows.forEach((row, i) => {
        pos[i] += dirs[i] * 0.0022 * delta * factor;
        pos[i] = ((pos[i] % 50) + 50) % 50 - 50; // wrap into [-50, 0)
        gsap.set(row, { xPercent: pos[i] });
      });
    });
    lenis?.on("scroll", (e) => {
      const v = e.velocity || 0;
      const boost = 1 + Math.min(Math.abs(v) / 6, 4);
      targetFactor = v < -0.5 ? -boost : boost;
    });
  };
  initMarquee();

  // Magnetic pull on buttons and pills
  if (canHover) {
    $$(".btn, .contact-link, .back-to-top").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      });
    });
  }

  // 3D tilt on stack cards
  if (canHover) {
    $$(".stack-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        gsap.to(card, {
          rotateX: rx, rotateY: ry, y: -4,
          transformPerspective: 700,
          duration: 0.5, ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ---------- Preloader counter, then build everything ---------- */
  const preNum = $("#preNum");
  const preBar = $(".pre-bar span");
  const counter = { v: 0 };
  const counterTween = gsap.to(counter, {
    v: 100,
    duration: 1.4,
    ease: "power2.inOut",
    onUpdate: () => {
      if (preNum) preNum.textContent = String(Math.round(counter.v)).padStart(2, "0");
      if (preBar) preBar.style.transform = `scaleX(${counter.v / 100})`;
    },
  });

  const fontsReady = Promise.race([
    (document.fonts && document.fonts.ready) || Promise.resolve(),
    new Promise((r) => setTimeout(r, 1600)),
  ]);

  const failsafe = () => {
    if (document.documentElement.classList.contains("is-ready")) return;
    document.documentElement.classList.add("is-ready", "no-anim");
    try {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.set("main *, .nav, .hero-ghost", { clearProps: "transform,opacity,visibility" });
    } catch { /* best effort */ }
    $(".preloader")?.remove();
    setCountersInstant();
    lenis?.start();
  };
  setTimeout(failsafe, 6500);

  Promise.all([counterTween.then(() => {}), fontsReady]).then(() => {
    try {
      build();
    } catch (err) {
      console.error("Animation build failed:", err);
      failsafe();
    }
  });

  function build() {
    document.documentElement.classList.add("is-ready");

    /* --- Hero intro --- */
    const heroSplit = new SplitText(".hero-title .line", { type: "chars" });
    gsap.set(heroSplit.chars, { yPercent: 115 });
    gsap.set([".hero-eyebrow", ".hero-subtitle", ".hero-tagline", ".hero-cta", ".hero-stats", ".scroll-hint"], { autoAlpha: 0, y: 24 });
    gsap.set(".nav", { autoAlpha: 0, y: -24 });
    gsap.set(".hero-badge", { autoAlpha: 0, scale: 0.6 });
    gsap.set(".hero-ghost", { autoAlpha: 0 });

    const intro = gsap.timeline({ defaults: { ease: "power4.out", duration: 0.8 } });
    intro
      .to(".preloader", { yPercent: -100, duration: 0.85, ease: "power4.inOut" })
      .add(() => lenis?.start())
      .set(".preloader", { display: "none" })
      .to(".nav", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.4")
      .to(heroSplit.chars, { yPercent: 0, duration: 1.05, stagger: 0.04 }, "-=0.55")
      .to(".hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.8")
      .to(".hero-subtitle", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.55")
      .to(".hero-tagline", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.45")
      .to(".hero-cta", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.45")
      .to(".hero-stats", { autoAlpha: 1, y: 0, duration: 0.6, onStart: animateCounters }, "-=0.45")
      .to(".hero-badge", { autoAlpha: 1, scale: 1, duration: 0.9, ease: "back.out(1.6)" }, "-=0.5")
      .to([".hero-ghost", ".scroll-hint"], { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.6");

    typewriter();

    /* --- Hero ghost parallax --- */
    gsap.to(".hero-ghost", {
      yPercent: 30, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* --- Section titles: char rise + underline draw --- */
    $$(".section-title").forEach((title) => {
      const split = new SplitText(title, { type: "chars" });
      gsap.from(split.chars, {
        yPercent: 120,
        duration: 0.7,
        stagger: 0.025,
        ease: "power4.out",
        scrollTrigger: {
          trigger: title,
          start: "top 88%",
          once: true,
          onEnter: () => {
            title.classList.add("is-in");
            title.closest(".section-head")?.classList.add("is-in");
          },
        },
      });
    });

    /* --- Section ghost numbers drift --- */
    $$(".section-ghost").forEach((ghost) => {
      gsap.fromTo(ghost, { yPercent: 22 }, {
        yPercent: -22, ease: "none",
        scrollTrigger: {
          trigger: ghost.closest(".section"),
          start: "top bottom", end: "bottom top", scrub: true,
        },
      });
    });

    /* --- About: words ink in as you scroll --- */
    const ledeSplit = new SplitText(".about-lede", { type: "words" });
    gsap.fromTo(ledeSplit.words, { opacity: 0.13 }, {
      opacity: 1, ease: "none", stagger: 0.05,
      scrollTrigger: { trigger: ".about-ledes", start: "top 80%", end: "bottom 55%", scrub: true },
    });
    gsap.from(".mini-card", {
      y: 36, autoAlpha: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".about-side", start: "top 88%", once: true },
    });

    /* --- Stack: pinned horizontal scroll on desktop --- */
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const track = $(".stack-track");
      if (!track) return;
      const amount = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: "#stack",
          start: "top top",
          end: () => `+=${amount()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const bar = $(".stack-progress span");
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      gsap.from(".stack-card", {
        y: 60, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: "#stack", start: "top 75%", once: true },
      });
    });
    mm.add("(max-width: 899px)", () => {
      gsap.from(".stack-card", {
        y: 40, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: ".stack-track", start: "top 88%", once: true },
      });
    });

    /* --- Experience: line draws, items rise --- */
    gsap.fromTo(".timeline-line", { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 65%", scrub: true },
    });
    $$(".timeline-item").forEach((item) => {
      gsap.from(item, {
        y: 48, autoAlpha: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 85%", once: true },
      });
      const dot = item.querySelector(".timeline-dot");
      if (dot) {
        gsap.from(dot, {
          scale: 0, duration: 0.5, ease: "back.out(2.5)",
          scrollTrigger: { trigger: item, start: "top 85%", once: true },
        });
      }
    });

    /* --- Research: clip-path reveal --- */
    gsap.fromTo(".research-card",
      { clipPath: "inset(0% 0% 100% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "power4.inOut",
        clearProps: "clipPath",
        scrollTrigger: { trigger: ".research-card", start: "top 82%", once: true },
      }
    );

    /* --- Ask My AI --- */
    gsap.from(".agent-intro", {
      y: 30, autoAlpha: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".agent-intro", start: "top 88%", once: true },
    });
    gsap.from(".chat-card", {
      y: 50, autoAlpha: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: ".chat-card", start: "top 85%", once: true },
    });

    /* --- Contact: masked lines + details --- */
    gsap.from(".contact-mega .cm-line", {
      yPercent: 115, duration: 1, stagger: 0.14, ease: "power4.out",
      scrollTrigger: { trigger: ".contact-mega", start: "top 85%", once: true },
    });
    gsap.from([".contact-note", ".mega-email", ".contact-links"], {
      y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".contact-note", start: "top 90%", once: true },
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  console.log(
    "%c✦ Aniket Gaudgaul — AI Engineer",
    "font-family:monospace;font-size:14px;color:#d6452c;font-weight:bold;",
  );
  console.log(
    "%cLLMs · RAG · Agents — let's build something intelligent → aniketgaudgaul@gmail.com",
    "font-family:monospace;font-size:11px;color:#5c554a;",
  );
});
