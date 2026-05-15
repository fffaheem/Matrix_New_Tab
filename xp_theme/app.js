/**
 * Windows XP New Tab - app.js
 */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  shortcuts: [],
  cpuHistory: new Array(50).fill(0),
  memHistory: new Array(50).fill(0),
  lastCpuInfo: null,
  notepadStorageKey: "xp-notepad-document",
  notepadSaveTimer: null,

  init() {
    this.initClock();
    this.initStartButton();
    this.initStartMenuInteraction();
    this.initSearch();
    this.initShortcuts();
    this.initNotepad();
    this.initTaskManager();
    this.initRunDialog();
  },

  initClock() {
    const trayClock = document.getElementById("tray-clock");
    if (!trayClock) return;

    const update = () => {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      trayClock.textContent = `${h}:${m} ${ampm}`;
    };

    update();
    setInterval(update, 1000);
  },

  initStartButton() {
    const btn = document.getElementById("start-btn");
    const menu = document.getElementById("start-menu");
    if (!btn || !menu) return;

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    };

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.classList.add("hidden");
      }
    });
  },

  initStartMenuInteraction() {
    const navigateTo = (url) => {
      if (window.chrome && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.location.href = url;
      }
    };

    const links = {
      "start-ie": "https://www.google.com",
      "start-mail": "https://mail.google.com",
      "start-my-docs": "chrome://downloads",
      "start-my-recent": "chrome://history",
      "start-my-pics": "https://photos.google.com",
      "start-my-music": "https://music.youtube.com",
      "start-my-computer": "chrome://settings",
      "start-control-panel": "chrome://settings",
    };

    for (const [id, url] of Object.entries(links)) {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = () => {
          navigateTo(url);
          document.getElementById("start-menu")?.classList.add("hidden");
        };
      }
    }

    const searchItem = document.getElementById("start-search");
    if (searchItem) {
      searchItem.onclick = () => {
        document.getElementById("search-input")?.focus();
        document.getElementById("start-menu")?.classList.add("hidden");
      };
    }
  },

  initSearch() {
    const input = document.getElementById("search-input");
    const btn = document.getElementById("search-btn");

    if (!input || !btn) return;

    const doSearch = () => {
      const query = input.value.trim();
      if (query) {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
    };

    btn.onclick = doSearch;
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        doSearch();
      }
    };
  },

  initShortcuts() {
    const addBtn = document.getElementById("add-shortcut-btn");
    const modal = document.getElementById("shortcut-modal");
    const cancelBtn = document.getElementById("shortcut-cancel");
    const okBtn = document.getElementById("shortcut-ok");

    const urlInput = document.getElementById("shortcut-url");
    const nameInput = document.getElementById("shortcut-name");
    if (!addBtn || !modal || !cancelBtn || !okBtn || !urlInput || !nameInput) {
      return;
    }

    const closeBtn = modal.querySelector(".btn-close");
    if (!closeBtn) return;

    const stored = localStorage.getItem("xp-shortcuts");
    if (stored) {
      try {
        this.shortcuts = JSON.parse(stored);
        this.renderShortcuts();
      } catch (e) {
        this.shortcuts = [];
      }
    }

    addBtn.onclick = () => {
      modal.classList.remove("hidden");
      modal.style.left = "50%";
      modal.style.top = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      urlInput.focus();
    };

    const closeModal = () => {
      modal.classList.add("hidden");
      urlInput.value = "";
      nameInput.value = "";
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    okBtn.onclick = () => {
      let url = urlInput.value.trim();
      const name = nameInput.value.trim();

      if (!url || !name) {
        alert("Please fill in both fields.");
        return;
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      try {
        const urlObj = new URL(url);
        const id = Date.now();
        const icon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        this.shortcuts.push({ id, url, name, icon });
        this.saveShortcuts();
        this.renderShortcuts();
        closeModal();
      } catch (e) {
        alert("Please enter a valid URL.");
      }
    };
  },

  saveShortcuts() {
    localStorage.setItem("xp-shortcuts", JSON.stringify(this.shortcuts));
  },

  renderShortcuts() {
    const grid = document.getElementById("shortcut-grid");
    if (!grid) return;
    grid.innerHTML = "";

    this.shortcuts.forEach((s) => {
      const el = document.createElement("div");
      el.className = "shortcut";
      el.title = s.url;
      el.innerHTML = `
                <img src="${s.icon}" onerror="this.src='https://cdn.jsdelivr.net/gh/trapd00r/win95-winxp_icons@master/Windows%20XP/Internet%20Explorer.png'">
                <span>${s.name}</span>
            `;
      el.onclick = () => (window.location.href = s.url);
      el.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm(`Delete shortcut for "${s.name}"?`)) {
          this.shortcuts = this.shortcuts.filter((x) => x.id !== s.id);
          this.saveShortcuts();
          this.renderShortcuts();
        }
      };
      grid.appendChild(el);
    });
  },

  initNotepad() {
    const startItem = document.getElementById("start-notepad");
    const taskBtn = document.getElementById("notepad-task-btn");
    const windowEl = document.getElementById("notepad-window");
    const closeBtn = document.getElementById("notepad-close");
    const resizeHandle = document.getElementById("notepad-resize-handle");
    const textarea = document.getElementById("notepad-textarea");
    const saveStatus = document.getElementById("notepad-save-status");
    const caretStatus = document.getElementById("notepad-caret-status");
    const fileBtn = document.getElementById("notepad-file");
    const fileMenu = document.getElementById("notepad-file-menu");
    const newBtn = document.getElementById("notepad-new");
    const saveBtn = document.getElementById("notepad-save");
    const editBtn = document.getElementById("notepad-edit");
    const wordWrapBtn = document.getElementById("notepad-word-wrap");
    const viewBtn = document.getElementById("notepad-view");
    const helpBtn = document.getElementById("notepad-help");

    if (!windowEl || !textarea || !closeBtn || !taskBtn) return;

    textarea.value = localStorage.getItem(this.notepadStorageKey) || "";

    const updateCaret = () => {
      const beforeCaret = textarea.value.slice(0, textarea.selectionStart);
      const lines = beforeCaret.split("\n");
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;
      if (caretStatus) caretStatus.textContent = `Ln ${line}, Col ${col}`;
    };

    const saveNow = () => {
      localStorage.setItem(this.notepadStorageKey, textarea.value);
      if (saveStatus) saveStatus.textContent = "Saved locally";
    };

    const queueSave = () => {
      if (saveStatus) saveStatus.textContent = "Saving...";
      clearTimeout(this.notepadSaveTimer);
      this.notepadSaveTimer = setTimeout(saveNow, 250);
    };

    const open = () => {
      windowEl.classList.remove("hidden");
      taskBtn.classList.remove("hidden");
      taskBtn.classList.add("active");
      windowEl.style.left = "90px";
      windowEl.style.top = "70px";
      windowEl.style.transform = "none";
      document.getElementById("start-menu")?.classList.add("hidden");
      textarea.focus();
      updateCaret();
    };

    const close = () => {
      saveNow();
      windowEl.classList.add("hidden");
      taskBtn.classList.remove("active");
      taskBtn.classList.add("hidden");
    };

    startItem?.addEventListener("click", open);
    taskBtn.addEventListener("click", () => {
      if (windowEl.classList.contains("hidden")) {
        open();
      } else {
        windowEl.classList.add("hidden");
        taskBtn.classList.remove("active");
      }
    });
    closeBtn.addEventListener("click", close);
    fileBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      fileMenu?.classList.toggle("hidden");
    });

    textarea.addEventListener("input", () => {
      queueSave();
      updateCaret();
    });
    textarea.addEventListener("keyup", updateCaret);
    textarea.addEventListener("click", updateCaret);
    textarea.addEventListener("select", updateCaret);

    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
      }
    });

    newBtn?.addEventListener("click", () => {
      if (textarea.value && !confirm("Clear this Notepad document?")) return;
      textarea.value = "";
      saveNow();
      updateCaret();
      fileMenu?.classList.add("hidden");
      textarea.focus();
    });

    saveBtn?.addEventListener("click", () => {
      saveNow();
      fileMenu?.classList.add("hidden");
      textarea.focus();
    });

    editBtn?.addEventListener("click", () => {
      textarea.select();
      textarea.focus();
    });

    wordWrapBtn?.addEventListener("click", () => {
      textarea.classList.toggle("no-wrap");
      textarea.focus();
    });

    viewBtn?.addEventListener("click", updateCaret);
    helpBtn?.addEventListener("click", () => {
      alert("Windows XP Notepad\n\nYour text is saved locally in this browser.");
    });

    document.addEventListener("click", (e) => {
      if (!fileMenu?.contains(e.target) && e.target !== fileBtn) {
        fileMenu?.classList.add("hidden");
      }
    });

    this.makeWindowDraggable(windowEl);
    if (resizeHandle) this.makeWindowResizable(windowEl, resizeHandle);
    saveNow();
    updateCaret();
  },

  makeWindowDraggable(windowEl) {
    const titlebar = windowEl.querySelector(".win-titlebar");
    if (!titlebar) return;

    let isDragging = false;
    let offset = { x: 0, y: 0 };

    titlebar.onmousedown = (e) => {
      isDragging = true;
      offset = {
        x: e.clientX - windowEl.offsetLeft,
        y: e.clientY - windowEl.offsetTop,
      };
    };

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      windowEl.style.left = e.clientX - offset.x + "px";
      windowEl.style.top = e.clientY - offset.y + "px";
      windowEl.style.transform = "none";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  },

  makeWindowResizable(windowEl, handle) {
    let isResizing = false;
    let start = { x: 0, y: 0, width: 0, height: 0 };

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      start = {
        x: e.clientX,
        y: e.clientY,
        width: windowEl.offsetWidth,
        height: windowEl.offsetHeight,
      };
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;

      const maxWidth = window.innerWidth - windowEl.offsetLeft - 12;
      const maxHeight = window.innerHeight - windowEl.offsetTop - 38;
      const nextWidth = Math.min(
        Math.max(360, start.width + e.clientX - start.x),
        maxWidth,
      );
      const nextHeight = Math.min(
        Math.max(240, start.height + e.clientY - start.y),
        maxHeight,
      );

      windowEl.style.width = nextWidth + "px";
      windowEl.style.height = nextHeight + "px";
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
    });
  },

  initTaskManager() {
    const startBtn = document.getElementById("start-task-manager");
    const taskBtn = document.getElementById("taskmgr-task-btn");
    const windowEl = document.getElementById("taskmgr-window");
    const close = document.getElementById("taskmgr-close");
    if (!startBtn || !taskBtn || !windowEl || !close) return;

    startBtn.onclick = () => {
      this.openTaskManager();
      document.getElementById("start-menu")?.classList.add("hidden");
    };

    taskBtn.onclick = () => {
      if (windowEl.classList.contains("hidden")) {
        this.openTaskManager();
      } else {
        windowEl.classList.add("hidden");
        taskBtn.classList.remove("active");
      }
    };

    close.onclick = () => this.closeTaskManager();

    this.makeWindowDraggable(windowEl);
  },

  openTaskManager() {
    const windowEl = document.getElementById("taskmgr-window");
    const taskBtn = document.getElementById("taskmgr-task-btn");
    if (!windowEl || !taskBtn) return;

    windowEl.classList.remove("hidden");
    taskBtn.classList.remove("hidden");
    taskBtn.classList.add("active");

    const winWidth = 400;
    windowEl.style.width = winWidth + "px";
    windowEl.style.left = window.innerWidth - winWidth - 20 + "px";
    windowEl.style.top = window.innerHeight - 400 + "px";
    windowEl.style.transform = "none";

    this.startMonitoring();
  },

  closeTaskManager() {
    const windowEl = document.getElementById("taskmgr-window");
    const taskBtn = document.getElementById("taskmgr-task-btn");
    if (!windowEl || !taskBtn) return;
    windowEl.classList.add("hidden");
    taskBtn.classList.remove("active");
    taskBtn.classList.add("hidden");
  },

  startMonitoring() {
    if (this.monitorInterval) return;

    const update = () => {
      const taskManagerWindow = document.getElementById("taskmgr-window");
      if (!taskManagerWindow || taskManagerWindow.classList.contains("hidden")) {
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
        return;
      }

      if (window.chrome && chrome.system && chrome.system.cpu) {
        chrome.system.cpu.getInfo((info) => {
          let usage = 0;
          if (this.lastCpuInfo) {
            let totalDiff = 0;
            let kernelDiff = 0;
            let userDiff = 0;
            for (let i = 0; i < info.processors.length; i++) {
              const core = info.processors[i].usage;
              const lastCore = this.lastCpuInfo.processors[i].usage;
              totalDiff += core.total - lastCore.total;
              kernelDiff += core.kernel - lastCore.kernel;
              userDiff += core.user - lastCore.user;
            }
            usage =
              totalDiff > 0 ? ((kernelDiff + userDiff) / totalDiff) * 100 : 0;
          }
          this.lastCpuInfo = info;
          this.updatePerfData(usage, "cpu");
        });
      } else {
        this.updatePerfData(5 + Math.random() * 15, "cpu");
      }

      if (window.chrome && chrome.system && chrome.system.memory) {
        chrome.system.memory.getInfo((info) => {
          const usage =
            ((info.capacity - info.availableCapacity) / info.capacity) * 100;
          const usedMB = Math.round(
            (info.capacity - info.availableCapacity) / (1024 * 1024),
          );
          this.updatePerfData(usage, "mem", `${usedMB} MB`);
        });
      } else {
        const baseMem = 2048;
        const variance = Math.random() * 50;
        const memUsage = 40 + variance / 10;
        this.updatePerfData(
          memUsage,
          "mem",
          `${Math.round(baseMem + variance)} MB`,
        );
      }
    };

    update();
    this.monitorInterval = setInterval(update, 1000);
  },

  updatePerfData(val, type, labelOverride) {
    const history = type === "cpu" ? this.cpuHistory : this.memHistory;
    history.push(val);
    history.shift();

    const canvas = document.getElementById(`${type}-graph`);
    const label = document.getElementById(
      `${type === "cpu" ? "cpu-perc" : "mem-stat"}`,
    );

    if (!canvas || !label) return;

    if (labelOverride) {
      label.textContent = labelOverride;
    } else {
      label.textContent = Math.round(val) + "%";
    }

    this.drawGraph(canvas, history);
  },

  drawGraph(canvas, history) {
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#004400";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = w / (history.length - 1);
    for (let i = 0; i < history.length; i++) {
      const x = i * step;
      const y = h - (history[i] / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },

  initRunDialog() {
    const runBtn = document.getElementById("start-run");
    const dialog = document.getElementById("run-dialog");
    const closeBtn = document.getElementById("run-close");
    const okBtn = document.getElementById("run-ok");
    const input = document.getElementById("run-input");
    if (!runBtn || !dialog || !closeBtn || !okBtn || !input) return;

    runBtn.onclick = () => {
      dialog.classList.remove("hidden");
      dialog.style.left = "20px";
      dialog.style.bottom = "40px";
      dialog.style.top = "auto";
      dialog.style.transform = "none";
      input.focus();
      document.getElementById("start-menu")?.classList.add("hidden");
    };

    const close = () => {
      dialog.classList.add("hidden");
      input.value = "";
    };

    closeBtn.onclick = close;

    // Fix run-cancel button
    const runCancelBtn = document.getElementById("run-cancel");
    if (runCancelBtn) runCancelBtn.onclick = close;

    okBtn.onclick = () => {
      let val = input.value.trim();
      if (val) {
        if (!val.includes("://")) val = "https://" + val;
        window.location.href = val;
      }
      close();
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") okBtn.onclick();
    };
  },
};
