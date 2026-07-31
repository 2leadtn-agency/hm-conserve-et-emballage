(function () {
  "use strict";

  var SYSTEM_PROMPT =
    "Vous êtes l'assistant virtuel de HM Conserve et Emballage, spécialiste en mise en conserve et emballage de produits alimentaires faits maison (conserve métallique, bocaux en verre, sous vide). Répondez avec chaleur et professionnalisme aux questions sur les méthodes de conservation et les modalités de service.";
  var BUSINESS_NAME = "HM Conserve et Emballage";
  var WHATSAPP_NUMBER = "21622796037";
  var PRIMARY_COLOR = "#b23c25";
  var ACCENT_COLOR = "#d68f2e";

  // Endpoint for the hosted chatbot proxy. Wire this to the live
  // Lumerank chatbot-proxy function before going to production —
  // in this preview, a failed/absent call falls back to a WhatsApp prompt.
  var CHATBOT_ENDPOINT = "/api/chatbot-proxy";

  var WELCOME_MESSAGE =
    "Bonjour et bienvenue chez HM Conserve et Emballage \u{1F958} ! Je suis là pour répondre à vos questions sur la mise en conserve de vos préparations maison — confitures, harissa, légumes, olives. Comment puis-je vous aider aujourd'hui ?";

  var FALLBACK_MESSAGE =
    "Merci pour votre message ! Notre assistant n'est pas disponible pour le moment. Pour une réponse rapide, contactez-nous directement sur WhatsApp.";

  var STYLE = `
    .hm-chat-bubble {
      position: fixed;
      right: 20px;
      bottom: 90px;
      z-index: 950;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${PRIMARY_COLOR}, #8a2c1a);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 22px rgba(178, 60, 37, 0.4);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .hm-chat-bubble:hover { transform: scale(1.07); box-shadow: 0 10px 26px rgba(178, 60, 37, 0.5); }
    @keyframes hm-bubble-pulse {
      0%, 100% { box-shadow: 0 8px 22px rgba(178, 60, 37, 0.4), 0 0 0 0 rgba(178, 60, 37, 0.35); }
      50% { box-shadow: 0 8px 22px rgba(178, 60, 37, 0.4), 0 0 0 8px rgba(178, 60, 37, 0); }
    }
    .hm-chat-bubble.hm-idle { animation: hm-bubble-pulse 2.8s ease-in-out infinite; }
    .hm-chat-prompt {
      position: fixed;
      right: 86px;
      bottom: 104px;
      z-index: 940;
      background: #fffdf7;
      color: #2c2416;
      font-family: "Archivo", "Helvetica Neue", Arial, sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 100px;
      box-shadow: 0 8px 22px rgba(44, 36, 22, 0.18);
      cursor: pointer;
      opacity: 0;
      transform: translateY(8px) scale(0.96);
      transition: opacity 0.5s ease, transform 0.5s ease;
      pointer-events: none;
      white-space: nowrap;
    }
    .hm-chat-prompt.hm-shown { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    .hm-chat-prompt::after {
      content: "";
      position: absolute;
      right: -5px;
      top: 50%;
      width: 10px;
      height: 10px;
      background: #fffdf7;
      transform: translateY(-50%) rotate(45deg);
    }
    @media (max-width: 420px) {
      .hm-chat-prompt { right: 78px; bottom: 96px; font-size: 0.8rem; padding: 8px 14px; }
    }
    .hm-chat-bubble svg { width: 30px; height: 30px; }
    .hm-chat-panel {
      position: fixed;
      right: 20px;
      bottom: 160px;
      z-index: 950;
      width: min(360px, calc(100vw - 32px));
      height: min(500px, calc(100vh - 200px));
      background: #fffdf7;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(44, 36, 22, 0.25);
      display: none;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.35s ease, transform 0.35s ease;
      font-family: "Archivo", "Helvetica Neue", Arial, sans-serif;
    }
    .hm-chat-panel.hm-open { display: flex; }
    .hm-chat-panel.hm-visible { opacity: 1; transform: translateY(0); }
    .hm-chat-header {
      background: ${PRIMARY_COLOR};
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .hm-chat-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hm-chat-avatar svg { width: 22px; height: 22px; }
    .hm-chat-title { font-weight: 700; font-size: 0.95rem; line-height: 1.2; }
    .hm-chat-sub { font-size: 0.72rem; opacity: 0.85; }
    .hm-chat-close {
      margin-left: auto;
      background: none; border: none; cursor: pointer;
      color: #fff; opacity: 0.85; padding: 4px;
      display: flex;
    }
    .hm-chat-close:hover { opacity: 1; }
    .hm-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8efdc;
    }
    .hm-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 0.88rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .hm-msg-bot {
      background: #fff;
      color: #2c2416;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(44,36,22,0.08);
    }
    .hm-msg-user {
      background: ${ACCENT_COLOR};
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .hm-msg-typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
    .hm-msg-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: #b7a893;
      animation: hm-typing 1s infinite ease-in-out;
    }
    .hm-msg-typing span:nth-child(2) { animation-delay: 0.15s; }
    .hm-msg-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes hm-typing {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-3px); }
    }
    .hm-chat-input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid rgba(44,36,22,0.08);
      background: #fff;
      flex-shrink: 0;
    }
    .hm-chat-textarea {
      flex: 1;
      resize: none;
      max-height: 96px;
      overflow-y: auto;
      border: 1.5px solid rgba(44,36,22,0.14);
      border-radius: 12px;
      padding: 9px 12px;
      font-family: inherit;
      font-size: 0.88rem;
      line-height: 1.4;
      color: #2c2416;
    }
    .hm-chat-textarea:focus { outline: none; border-color: ${PRIMARY_COLOR}; }
    .hm-chat-send {
      width: 38px; height: 38px; border-radius: 50%;
      border: none; cursor: pointer; flex-shrink: 0;
      background: ${PRIMARY_COLOR}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.25s ease;
    }
    .hm-chat-send:hover { background: #8a2c1a; }
    .hm-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (max-width: 420px) {
      .hm-chat-panel { right: 16px; bottom: 148px; }
      .hm-chat-bubble { right: 16px; }
    }
  `;

  function injectStyle() {
    var s = document.createElement("style");
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // Custom avatar: a sealed jar with its lid, a faint steam curl rising above —
  // evoking a freshly sterilized jar rather than a generic round avatar.
  var AVATAR_SVG =
    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3h8v3.4h-8z"></path>' +
    '<path d="M11 6.4h10l1 3A5 5 0 0 1 22.3 11v13a2 2 0 0 1-2 2H11.7a2 2 0 0 1-2-2V11a5 5 0 0 1 .3-1.6z"></path>' +
    '<path d="M10.5 14.2h11"></path>' +
    '<path d="M14 1c-.9.9-.9 1.8 0 2.7M17.2 1c-.9.9-.9 1.8 0 2.7"></path>' +
    "</svg>";

  var BUBBLE_SVG = AVATAR_SVG.replace('stroke="currentColor"', 'stroke="#fff"');

  var SEND_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>';

  var CLOSE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>';

  function buildDOM() {
    var bubble = document.createElement("button");
    bubble.className = "hm-chat-bubble hm-idle";
    bubble.setAttribute("aria-label", "Ouvrir le chat " + BUSINESS_NAME);
    bubble.innerHTML = BUBBLE_SVG;

    var prompt = document.createElement("button");
    prompt.className = "hm-chat-prompt";
    prompt.type = "button";
    prompt.textContent = "Une question ?";

    var panel = document.createElement("div");
    panel.className = "hm-chat-panel";
    panel.innerHTML =
      '<div class="hm-chat-header">' +
      '<div class="hm-chat-avatar">' + AVATAR_SVG + "</div>" +
      '<div><div class="hm-chat-title">' + BUSINESS_NAME + "</div>" +
      '<div class="hm-chat-sub">Généralement en ligne</div></div>' +
      '<button class="hm-chat-close" aria-label="Fermer le chat">' + CLOSE_SVG + "</button>" +
      "</div>" +
      '<div class="hm-chat-messages" id="hm-chat-messages"></div>' +
      '<div class="hm-chat-input-row">' +
      '<textarea class="hm-chat-textarea" id="hm-chat-textarea" rows="1" placeholder="Écrivez votre message..."></textarea>' +
      '<button class="hm-chat-send" id="hm-chat-send" aria-label="Envoyer">' + SEND_SVG + "</button>" +
      "</div>";

    document.body.appendChild(panel);
    document.body.appendChild(bubble);
    document.body.appendChild(prompt);
    return { bubble: bubble, panel: panel, prompt: prompt };
  }

  function addMessage(container, text, who) {
    var el = document.createElement("div");
    el.className = "hm-msg " + (who === "user" ? "hm-msg-user" : "hm-msg-bot");
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function addTyping(container) {
    var el = document.createElement("div");
    el.className = "hm-msg hm-msg-bot hm-msg-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  async function requestReply(history) {
    try {
      var res = await fetch(CHATBOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          businessName: BUSINESS_NAME,
          messages: history,
        }),
      });
      if (!res.ok) throw new Error("bad response");
      var data = await res.json();
      if (data && typeof data.reply === "string") return data.reply;
      throw new Error("no reply");
    } catch (err) {
      return (
        FALLBACK_MESSAGE +
        "\n\n\u{1F449} wa.me/" +
        WHATSAPP_NUMBER
      );
    }
  }

  function init() {
    injectStyle();
    var dom = buildDOM();
    var messages = document.getElementById("hm-chat-messages");
    var textarea = document.getElementById("hm-chat-textarea");
    var sendBtn = document.getElementById("hm-chat-send");
    var closeBtn = dom.panel.querySelector(".hm-chat-close");
    var history = [];
    var hasOpenedOnce = false;
    var isSending = false;

    function dismissPrompt() {
      dom.prompt.classList.remove("hm-shown");
      dom.bubble.classList.remove("hm-idle");
    }

    function openPanel() {
      dom.panel.classList.add("hm-open");
      requestAnimationFrame(function () {
        dom.panel.classList.add("hm-visible");
      });
      dismissPrompt();
      if (!hasOpenedOnce) {
        hasOpenedOnce = true;
        addMessage(messages, WELCOME_MESSAGE, "bot");
        history.push({ role: "assistant", content: WELCOME_MESSAGE });
      }
      textarea.focus();
    }

    function closePanel() {
      dom.panel.classList.remove("hm-visible");
      setTimeout(function () {
        dom.panel.classList.remove("hm-open");
      }, 300);
    }

    dom.bubble.addEventListener("click", function () {
      if (dom.panel.classList.contains("hm-open")) {
        closePanel();
      } else {
        openPanel();
      }
    });
    dom.prompt.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);

    setTimeout(function () {
      if (!hasOpenedOnce) dom.prompt.classList.add("hm-shown");
    }, 1600);

    textarea.addEventListener("input", function () {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 96) + "px";
    });

    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    sendBtn.addEventListener("click", send);

    async function send() {
      var text = textarea.value.trim();
      if (!text || isSending) return;
      isSending = true;
      sendBtn.disabled = true;
      addMessage(messages, text, "user");
      history.push({ role: "user", content: text });
      textarea.value = "";
      textarea.style.height = "auto";

      var typingEl = addTyping(messages);
      var reply = await requestReply(history);
      typingEl.remove();
      addMessage(messages, reply, "bot");
      history.push({ role: "assistant", content: reply });

      isSending = false;
      sendBtn.disabled = false;
      textarea.focus();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
