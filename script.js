document.addEventListener("DOMContentLoaded", () => {
  let nodes = [];
  let edges = [];
  let logs = [];

  const canvas = document.getElementById("networkCanvas");
  const ctx = canvas.getContext("2d");

  const nodeSelect = document.getElementById("nodeSelect");
  const deleteBtn = document.getElementById("deleteBtn");
  const topologySelect = document.getElementById("topology");
  const buildBtn = document.getElementById("buildBtn");
  const resetBtn = document.getElementById("resetBtn");
  const algorithmSelect = document.getElementById("algorithm");
  const runAlgoBtn = document.getElementById("runAlgoBtn");

  const addEdgeBtn = document.getElementById("addEdgeBtn");
  const selectSenderBtn = document.getElementById("selectSenderBtn");
  const selectReceiverBtn = document.getElementById("selectReceiverBtn");
  const clearSelectionBtn = document.getElementById("clearSelectionBtn");
  const senderLabel = document.getElementById("senderLabel");
  const receiverLabel = document.getElementById("receiverLabel");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatLog = document.getElementById("chatLog");

  let sender = null, receiver = null;
  let selectingSender = false, selectingReceiver = false;
  let lastNode = null;
  let customMode = false;
  let firstCustomNode = null;

  // Add Edge state
  let addingEdge = false;
  let firstEdgeNode = null;

  // 🕒 Timestamp + Log helper
  function timestamp() {
    return new Date().toLocaleTimeString();
  }
  function logAction(text) {
    const line = `[${timestamp()}] ${text}`;
    logs.push(line);
    chatLog.innerHTML += `<div>${line}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // 🟢 Find node by position
  function findNode(x, y) {
    return nodes.find(n => Math.hypot(n.x - x, n.y - y) < 25);
  }

  // 🟢 Draw everything
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(e => drawEdge(e.from, e.to, e.directed));
    nodes.forEach(drawNode);
  }

  function drawNode(n) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#00ffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.label, n.x, n.y);
  }

  function drawEdge(a, b, directed) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = "#00ffff66";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (directed) {
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - 10 * Math.cos(ang - 0.3), b.y - 10 * Math.sin(ang - 0.3));
      ctx.lineTo(b.x - 10 * Math.cos(ang + 0.3), b.y - 10 * Math.sin(ang + 0.3));
      ctx.closePath();
      ctx.fillStyle = "#00ffff";
      ctx.fill();
    }
  }

  // 🟢 Update dropdown
  function updateDropdown() {
    nodeSelect.innerHTML = '<option value="">— Choose Node —</option>';
    nodes.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n.label;
      opt.textContent = n.label;
      nodeSelect.appendChild(opt);
    });
  }

  // 🟢 Canvas click handler
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Priority: Add Edge mode (explicit)
    if (addingEdge) {
      const clicked = findNode(x, y);
      if (!clicked) return;
      if (!firstEdgeNode) {
        firstEdgeNode = clicked;
        logAction(`Selected ${clicked.label} as first node`);
      } else {
        edges.push({ from: firstEdgeNode, to: clicked, directed: true });
        logAction(`Edge added: ${firstEdgeNode.label} → ${clicked.label}`);
        firstEdgeNode = null;
        addingEdge = false;
        redraw();
        logAction("Add Edge mode OFF — click 'Add Edge' to create another connection.");
      }
      return;
    }

    // Sender selection
    if (selectingSender) {
      const node = findNode(x, y);
      if (!node) return;
      sender = node;
      senderLabel.textContent = node.label;
      selectingSender = false;
      logAction(`Sender selected: ${node.label}`);
      return;
    }
    // Receiver selection
    if (selectingReceiver) {
      const node = findNode(x, y);
      if (!node) return;
      receiver = node;
      receiverLabel.textContent = node.label;
      selectingReceiver = false;
      logAction(`Receiver selected: ${node.label}`);
      return;
    }

    // 🧩 Custom DAG linking (legacy / optional)
    if (customMode) {
      const clicked = findNode(x, y);
      if (!clicked) return;
      if (!firstCustomNode) {
        firstCustomNode = clicked;
        logAction(`Selected ${clicked.label} as first node to link`);
      } else {
        edges.push({ from: firstCustomNode, to: clicked, directed: true });
        logAction(`Linked ${firstCustomNode.label} → ${clicked.label}`);
        firstCustomNode = null;
        redraw();
      }
      return;
    }

    // Node creation
    const label = `N${nodes.length + 1}`;
    nodes.push({ x, y, label });
    updateDropdown();
    redraw();
    logAction(`Node ${label} created at (${Math.round(x)}, ${Math.round(y)})`);
  });

  // 🔵 Edge linking on double click (for non-custom quick links)
  canvas.addEventListener("dblclick", (e) => {
    // if addingEdge or customMode, ignore double-click behaviour
    if (addingEdge || customMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clicked = findNode(x, y);
    if (!clicked) return;
    if (!lastNode) {
      lastNode = clicked;
    } else {
      edges.push({ from: lastNode, to: clicked, directed: true });
      logAction(`Edge created: ${lastNode.label} → ${clicked.label}`);
      lastNode = null;
    }
    redraw();
  });

  // 🗑 Delete node
  deleteBtn.addEventListener("click", () => {
    const val = nodeSelect.value;
    if (!val) return;
    const target = nodes.find(n => n.label === val);
    if (!target) return;
    nodes = nodes.filter(n => n !== target);
    edges = edges.filter(e => e.from !== target && e.to !== target);
    redraw();
    updateDropdown();
    logAction(`Node ${val} deleted`);
  });

  // 🧩 Build topology
  buildBtn.addEventListener("click", () => {
    const t = topologySelect.value;
    edges = [];
    customMode = (t === "custom");

    if (customMode) {
      logAction("Custom mode active — use 'Add Edge' to create directed connections.");
      redraw();
      return;
    }

    const N = nodes.length;
    if (t === "bus") {
      for (let i = 0; i < N - 1; i++)
        edges.push({ from: nodes[i], to: nodes[i + 1], directed: false });
    } else if (t === "star") {
      for (let i = 1; i < N; i++)
        edges.push({ from: nodes[0], to: nodes[i], directed: false });
    } else if (t === "ring") {
      for (let i = 0; i < N; i++)
        edges.push({ from: nodes[i], to: nodes[(i + 1) % N], directed: false });
    } else if (t === "mesh") {
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          edges.push({ from: nodes[i], to: nodes[j], directed: false });
          edges.push({ from: nodes[j], to: nodes[i], directed: false });
        }
    } else if (t === "tree") {
      for (let i = 0; i < N; i++) {
        const left = 2 * i + 1, right = 2 * i + 2;
        if (left < N) edges.push({ from: nodes[i], to: nodes[left], directed: true });
        if (right < N) edges.push({ from: nodes[i], to: nodes[right], directed: true });
      }
    }

    redraw();
    logAction(`Topology "${t}" built with ${N} nodes`);
  });

  // ♻ Reset everything
  resetBtn.addEventListener("click", () => {
    nodes = [];
    edges = [];
    sender = receiver = null;
    firstCustomNode = null;
    customMode = false;
    addingEdge = false;
    firstEdgeNode = null;
    redraw();
    updateDropdown();
    senderLabel.textContent = receiverLabel.textContent = "—";
    logAction("Canvas reset — all nodes and edges cleared");
  });

  // 🟢 Add Edge button logic
  addEdgeBtn.addEventListener("click", () => {
    if (nodes.length < 2) {
      logAction("⚠ Need at least two nodes to add an edge.");
      return;
    }
    addingEdge = true;
    firstEdgeNode = null;
    logAction("Add Edge mode ON — click Node A then Node B to create A → B.");
  });

  // 🧑‍💻 Sender/Receiver buttons
  selectSenderBtn.onclick = () => {
    selectingSender = true;
    logAction("Click a node to select as sender");
  };
  selectReceiverBtn.onclick = () => {
    selectingReceiver = true;
    logAction("Click a node to select as receiver");
  };
  clearSelectionBtn.onclick = () => {
    sender = receiver = null;
    senderLabel.textContent = receiverLabel.textContent = "—";
    logAction("Sender/Receiver selections cleared");
  };

  // 🔍 BFS path
  function bfsPath(s, t) {
    const adj = {};
    nodes.forEach(n => adj[n.label] = []);
    edges.forEach(e => {
      adj[e.from.label].push(e.to.label);
      if (!e.directed) adj[e.to.label].push(e.from.label);
    });
    const q = [s.label];
    const par = {};
    par[s.label] = null;
    logAction(`BFS started from ${s.label}`);
    while (q.length) {
      const u = q.shift();
      logAction(`Visiting: ${u}`);
      if (u === t.label) break;
      for (const v of adj[u])
        if (!(v in par)) {
          par[v] = u;
          q.push(v);
          logAction(`Discovered: ${v} from ${u}`);
        }
    }
    if (!(t.label in par)) return null;
    const path = [];
    let cur = t.label;
    while (cur) {
      path.unshift(cur);
      cur = par[cur];
    }
    logAction(`BFS Path: ${path.join(" → ")}`);
    return path;
  }

  // 💬 Message animation
  sendBtn.onclick = () => {
    if (!sender || !receiver) {
      logAction("⚠ Select both sender & receiver before sending a message.");
      return;
    }
    const msg = chatInput.value.trim();
    if (!msg) return;
    logAction(`Message sent: "${msg}"`);
    animateMessage(sender, receiver, msg);
    chatInput.value = "";
  };

  function animateMessage(s, t, msg) {
    const path = bfsPath(s, t);
    if (!path) {
      logAction("❌ No path found between sender and receiver");
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      redraw();
      if (i < path.length - 1) {
        const a = nodes.find(n => n.label === path[i]);
        const b = nodes.find(n => n.label === path[i + 1]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 4;
        ctx.stroke();
        logAction(`Message moved from ${a.label} → ${b.label}`);
        i++;
      } else {
        clearInterval(interval);
        redraw();
        logAction(`✅ Message delivered to ${t.label}: "${msg}"`);
      }
    }, 800);
  }

  // 🧠 Run algorithm
  runAlgoBtn.addEventListener("click", () => {
    const algo = algorithmSelect.value;
    if (algo === "topo") runKahnsAlgorithm();
    else if (algo === "bfs") logAction("Use chat to visualize BFS automatically!");
  });

  // 🧩 Kahn's Algorithm
  function runKahnsAlgorithm() {
    if (edges.length === 0) {
      logAction("No edges found — cannot perform topological sort");
      return;
    }
    const adj = {};
    const indeg = {};
    nodes.forEach(n => {
      adj[n.label] = [];
      indeg[n.label] = 0;
    });
    edges.forEach(e => {
      adj[e.from.label].push(e.to.label);
      indeg[e.to.label]++;
    });

    const q = [];
    for (const [n, d] of Object.entries(indeg)) if (d === 0) q.push(n);

    const order = [];
    logAction("Kahn’s Algorithm started");

    const animate = setInterval(() => {
      if (q.length === 0) {
        clearInterval(animate);
        if (order.length !== nodes.length) {
          logAction("⚠ Cycle detected — topological sort not possible");
        } else {
          logAction("✅ Topological Order: " + order.join(" → "));
        }
        return;
      }
      const u = q.shift();
      order.push(u);
      logAction(`Processing node: ${u}`);
      const node = nodes.find(n => n.label === u);
      redraw();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const v of adj[u]) {
        indeg[v]--;
        if (indeg[v] === 0) q.push(v);
      }
    }, 800);
  }

  // 📄 Header Download Button — Word Export + Canvas Snapshot (Fixed)
document.getElementById("downloadHeaderBtn").onclick = async () => {
  try {
    logAction("Preparing Word document export...");

    // Capture canvas as Base64 PNG
    const imageData = canvas.toDataURL("image/png");

    // Convert Base64 → Blob safely
    function base64ToBlob(base64, type = "image/png") {
      const byteCharacters = atob(base64.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type });
    }

    const imageBlob = base64ToBlob(imageData);

    // Pull from docx library
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = window.docx;

    // Convert log entries
    const logParagraphs = logs.map(line =>
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 100 },
      })
    );

    // Build document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "Network Log Report",
              heading: HeadingLevel.TITLE,
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Topology: ${topologySelect.value || "unknown"}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Algorithm: ${algorithmSelect.value || "none"}`,
                  bold: true,
                }),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: "Canvas Snapshot:",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBlob,
                  transformation: { width: 600, height: 350 },
                }),
              ],
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: "Action Log:",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200 },
            }),
            ...logParagraphs,
          ],
        },
      ],
    });

    // Generate and trigger download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "network_log.docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logAction("✅ Word document exported successfully!");
  } catch (err) {
    console.error(err);
    logAction("❌ Failed to export Word document.");
  }
};



  // 🪟 Modal logic
  const modals = document.querySelectorAll(".modal");
  const navBtns = document.querySelectorAll(".navBtn");
  const closes = document.querySelectorAll(".close");

  navBtns.forEach(btn => {
    btn.onclick = () => {
      modals.forEach(m => m.style.display = "none");
      const modalId = btn.dataset.modal;
      const modal = document.getElementById(modalId);
      if (modal) modal.style.display = "block";
    };
  });

  closes.forEach(close => {
    close.onclick = () => close.closest(".modal").style.display = "none";
  });

  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  };
});
