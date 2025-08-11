let chart;
const chartData = {};
let selectedTrackers = {}; 
let activeTrackerLabels = new Set();
let selectedDate = new Date();
let loadedTrackerData = {};

const API_BASE = "http://localhost:5000/api";

const trackerCounts = {
  Aasanurme: 19,
  Augusta: 25,
  Augustenberg: 24,
  Bavendorf: 18,
  DeepTrack: 9,
  Evapore: 8,
  Geisenheim: 12,
  Greenberry: 40,
  Grong_Grong: 38,
  Hajdusamson: 20,
  Innoagri: 20,
  Pacentro: 32,
  Paterno: 33,
  Riva_Presso_Chieri: 35,
  Salice: 31,
  San_Benigno: 27,
  San_Constanzo: 26,
  Thiva: 32,
  Tricerro: 26,
  Veringenstadt: 34
};

const SITE_OPTIONS = [
  "Aasanurme",
  "Augusta",
  "Augustenberg",
  "Bavendorf",
  "DeepTrack",
  "Evapore",
  "Geisenheim",
  "Greenberry",
  "Grong Grong",
  "Hajdusamson",
  "Innoagri",
  "Pacentro",
  "Paterno",
  "Riva Presso Chieri",
  "Salice",
  "San_Benigno",
  "San Constanzo",
  "Thiva",
  "Tricerro",
  "Veringenstadt"
];

const CHANNEL_OPTIONS = [
  "Angle","Angle_Diff","Chip_Temp","Device_Type","Emergency_Stop","Emergency_Switch",
  "Error_Flags","Firmware","Health_Errors","Health_Missed","Last_Angle","Meta_Cleaning",
  "Meta_Monitoring","Meta_Serial","Motor_Current","Motor_Current_Max","Restarted",
  "Rf_Errors","Rf_Hops","Rf_Latency","Rf_Retries","Rf_RSSI_dBm","Rf_Time_Ack",
  "Rf_Time_Answer","Set_Angle","Set_Mode","Set_Motor_Control","Stuck","Supply_Voltage","Uptime"
];

const sidebarState = {};

function createEl(tag, attrs = {}, html = "") {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => (k === "class") ? el.className = v : el.setAttribute(k, v));
  if (html) el.innerHTML = html;
  return el;
}

// Sidebar neu rendern
function renderSidebar() {
  const container = document.getElementById("anlagen-container");
  container.innerHTML = "";

  const sites = Object.keys(sidebarState).sort((a,b)=>a.localeCompare(b));
  if (sites.length === 0) {
    container.innerHTML = `<div style="color:#777; padding:6px 8px;">Noch keine Anlagen hinzugefügt.</div>`;
    return;
  }

  sites.forEach(site => {
    const channels = Array.from(sidebarState[site] || []).sort((a,b)=>a.localeCompare(b));

    const box = createEl("div", { class: "anlage" });

    const header = createEl("div", { class: "anlage-header" }, `${site} <span class="toggle-icon">+</span>`);
    header.addEventListener("click", () => {
      list.classList.toggle("hidden");
      header.querySelector(".toggle-icon").textContent = list.classList.contains("hidden") ? "+" : "-";
    });

    // Channel-Liste
    const list = createEl("div", { class: "channel-list hidden" });
    channels.forEach(channel => {
      const row = createEl("div", { class: "channel", "data-id": `${site}-${channel}` }, 
        `${channel}${getUnit(channel) ? " " + getUnit(channel) : ""} <span class="tracker-toggle">&gt;</span>`
      );

      row.addEventListener("mousedown", e => e.preventDefault()); 
      row.addEventListener("click", e => {
        e.stopPropagation();
        openTrackerPopup(row, site, channel);
      });

      list.appendChild(row);
    });

    box.appendChild(header);
    box.appendChild(list);
    container.appendChild(box);
  });
}

const addModal = document.getElementById("addSelectionModal");
const addSitesBox = document.getElementById("addModalSites");
const addChannelsBox = document.getElementById("addModalChannels");

function populateAddModal() {
  addSitesBox.innerHTML = SITE_OPTIONS.map(s => 
    `<label><input type="checkbox" value="${s}"> ${s}</label><br/>`
  ).join("");

  addChannelsBox.innerHTML = CHANNEL_OPTIONS.map(c => 
    `<label><input type="checkbox" value="${c}"> ${c}</label><br/>`
  ).join("");
}

document.getElementById("btn-add-site").addEventListener("click", () => {
  populateAddModal();
  addModal.classList.remove("hidden");
});

document.getElementById("addSelectionClose").addEventListener("click", () => {
  addModal.classList.add("hidden");
});

document.querySelectorAll('#addSelectionModal .modal-search').forEach(inp => {
  inp.addEventListener("input", () => {
    const target = inp.dataset.target === "anlagen" ? addSitesBox : addChannelsBox;
    const q = inp.value.toLowerCase();
    target.querySelectorAll("label").forEach(lbl => {
      const text = lbl.textContent.toLowerCase();
      lbl.style.display = text.includes(q) ? "" : "none";
    });
  });
});

document.getElementById("addSelectionConfirm").addEventListener("click", () => {
  const selectedSites = Array.from(addSitesBox.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  const selectedChannels = Array.from(addChannelsBox.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  if (!selectedSites.length || !selectedChannels.length) {
    alert("Bitte mindestens eine Anlage und einen Channel auswählen!");
    return;
  }

  selectedSites.forEach(site => {
    if (!sidebarState[site]) sidebarState[site] = new Set();
    selectedChannels.forEach(ch => sidebarState[site].add(ch));
  });

  renderSidebar();
  addModal.classList.add("hidden");
});

// Sidebar Löschen-Button
document.getElementById("btn-clear-sites").addEventListener("click", () => {
  for (const k in sidebarState) delete sidebarState[k];
  removeAll();        
  renderSidebar();   
});

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
});

// feste Farbdefinition
const trackerColors = {};
const predefinedColors = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
  "#5254a3", "#9c9ede", "#cedb9c", "#e7ba52"
];

for (let i = 1; i <= 19; i++) {
  const num = i.toString().padStart(3, "0");

  trackerColors[`Angle-${num}`] = predefinedColors[i - 1];
  trackerColors[`Angle_Diff-${num}`] = predefinedColors[i - 1];
  trackerColors[`Chip_Temp-${num}`] = predefinedColors[i - 1];
  trackerColors[`Device_Type-${num}`] = predefinedColors[i - 1];
  trackerColors[`Emergency_Stop-${num}`] = predefinedColors[i - 1];
  trackerColors[`Emergency_Switch-${num}`] = predefinedColors[i - 1];
  trackerColors[`Error_Flags-${num}`] = predefinedColors[i - 1];
  trackerColors[`Firmware-${num}`] = predefinedColors[i - 1];
  trackerColors[`Health_Errors-${num}`] = predefinedColors[i - 1];
  trackerColors[`Health_Missed-${num}`] = predefinedColors[i - 1];
  trackerColors[`Last_Angle-${num}`] = predefinedColors[i - 1];
  trackerColors[`Meta_Cleaning-${num}`] = predefinedColors[i - 1];
  trackerColors[`Meta_Monitoring-${num}`] = predefinedColors[i - 1];
  trackerColors[`Meta_Serial-${num}`] = predefinedColors[i - 1];
  trackerColors[`Motor_Current-${num}`] = predefinedColors[i - 1];
  trackerColors[`Motor_Current_Max-${num}`] = predefinedColors[i - 1];
  trackerColors[`Restarted-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Errors-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Hops-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Latency-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Retries-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_RSSI_dBm-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Time_Ack-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Time_Answer-${num}`] = predefinedColors[i - 1];
  trackerColors[`Set_Angle-${num}`] = predefinedColors[i - 1];
  trackerColors[`Set_Mode-${num}`] = predefinedColors[i - 1];
  trackerColors[`Set_Motor_Control-${num}`] = predefinedColors[i - 1];
  trackerColors[`Stuck-${num}`] = predefinedColors[i - 1];
  trackerColors[`Supply_Voltage-${num}`] = predefinedColors[i - 1];
  trackerColors[`Uptime-${num}`] = predefinedColors[i - 1];
}

function hexToRgba(hex, alpha = 1) {
  if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) return hex; 
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getUnit(label) {
  if (label.includes("Motor_Current_Max")) return " [A]";
  if (label.includes("Motor_Current")) return " [A]";
  if (label.includes("Chip_Temp")) return " [°C]";
  if (label.includes("Rf_RSSI_dBm")) return " [dBm]";
  if (label.includes("Rf_Hops")) return " [Hops]";
  if (label.includes("Error_Flag")) return " [%]";
  if (label.includes("Emergency_Stop")) return "";
  if (label.includes("Emergency_Switch")) return "";
  if (label.includes("Device_Type")) return "";
  if (label.includes("Angle_Diff")) return " [°]";
  if (label.includes("Last_Angle")) return " [°]";
  if (label.includes("Set_Angle")) return " [°]";
  if (label.includes("Angle")) return " [°]";
  if (label.includes("Firmware")) return "";
  if (label.includes("Health_Errors")) return "";
  if (label.includes("Health_Missed")) return "";
  if (label.includes("Meta_Cleaning")) return "";
  if (label.includes("Meta_Monitoring")) return "";
  if (label.includes("Meta_Serial")) return "";
  if (label.includes("Restarted")) return "";
  if (label.includes("Rf_Errors")) return "";
  if (label.includes("Rf_Latency")) return "";
  if (label.includes("Rf_Retries")) return "";
  if (label.includes("Rf_Time_Ack")) return " [ms]";
  if (label.includes("Rf_Time_Answer")) return " [ms]";
  if (label.includes("Set_Mode")) return "";
  if (label.includes("Set_Motor_Control")) return "";
  if (label.includes("Stuck")) return "";
  if (label.includes("Supply_Voltage")) return " [V]";
  if (label.includes("Uptime")) return " [s]";
  return "";
}

function seriesToPoints(series, param) {
  if (!Array.isArray(series)) return [];
  const scaled = 
    param === "Chip_Temp"      ? series.map(v => v!=null ? v/8 : null) :
    param === "Angle"          ? series.map(v => v!=null ? (v+60)/24 : null) :
    param === "Last_Angle"     ? series.map(v => v!=null ? (v+60)/24 : null) :
    param === "Device_Type"    ? series.map(v => v===3001 ? 1 : v===3012 ? 2 : null) :
    param === "Firmware"       ? series.map(v => v!=null ? v/2500 : null) :
    param === "Health_Errors"  ? series.map(v => v!=null ? v/2000 : null) :
    param === "Health_Missed"  ? series.map(v => v!=null ? v/2000 : null) :
    param === "Meta_Serial"    ? series.map(v => v!=null ? v/50 : null) :
    param === "Restarted"      ? series.map(v => v!=null ? v*10 : null) :
    param === "Rf_Hops"        ? series.map(v => v!=null ? v/2 : null) :
    param === "Rf_Latency"     ? series.map(v => v!=null ? v/10000 : null) :
    param === "Rf_Retries"     ? series.map(v => v!=null ? v*10 : null) :
    param === "Rf_Time_Ack"    ? series.map(v => v!=null ? v/1000 : null) :
    param === "Rf_Time_Answer" ? series.map(v => v!=null ? v/1000 : null) :
    param === "Set_Angle"      ? series.map(v => v!=null ? (v+60)/24 : null) :
    param === "Set_Motor_Control" ? series.map(v => v!=null ? v/100 : null) :
    param === "Supply_Voltage" ? series.map(v => v!=null ? v/12 : null) :
    param === "Uptime"         ? series.map(v => v!=null ? v/15000 : null) :
    param === "Rf_RSSI_dBm"    ? series.map(v => v!=null ? (v+110)/15 : null) :
    param === "Error_Flags"    ? series.map(v => v!=null && v>0 ? 3 : 0) :
    param === "Angle_Diff"     ? series.map(v => v!=null ? ((v-2.5)/2)+3 : null) :
                                 series;

  return Array.from({length: 24}, (_, i) => ({
    x: `${i.toString().padStart(2,"0")}:00`,
    y: scaled[i] ?? null,
    original: series[i] ?? null
  }));
}

function toggleChannels(element) {
  const list = element.nextElementSibling;
  list.classList.toggle("hidden");
  const icon = element.querySelector(".toggle-icon");
  icon.textContent = list.classList.contains("hidden") ? "+" : "-";
}

function randomData() {
  const data = [];
  for (let i = 0; i <= 24; i++) {
    data.push({ x: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), y: Math.random() * 4 });
  }
  return data;
}

// Chart aufbauen
function setupChart() {
  const ctx = document.getElementById("lineChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: "easeInOutQuad" },
      layout: { padding: { top: 25, bottom: 50 } },
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index", intersect: false },
      elements: {
        point: { radius: 4, hoverRadius: 6, backgroundColor: "#fff", borderWidth: 2 },
        line: { tension: 0.1 }
      },
      scales: {
        x: {
          type: "category",
          title: { display: true, text: "Uhrzeit" },
          labels: Array.from({ length: 25 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
          ticks: { maxTicksLimit: 25, autoSkip: false }
        },
        y: { min: 0, max: 5, title: { display: true, text: "Wert" } }
      },
      plugins: {
        legend: {
          position: "bottom",
          onClick: (e, legendItem) => {
            const index = legendItem.datasetIndex;
            const meta = chart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            chart.update();
            updateInfoOutput();
          }
        },
        tooltip: {
          enabled: false, 
          external: (ctx) => {
            let el = document.getElementById("ext-tooltip");
            if (!el) {
              el = document.createElement("div");
              el.id = "ext-tooltip";
              el.style.position = "absolute";
              el.style.pointerEvents = "none";
              el.style.background = "rgba(30,30,30,0.9)";
              el.style.color = "#fff";
              el.style.border = "1px solid #aaa";
              el.style.borderRadius = "8px";
              el.style.padding = "12px";
              el.style.font = "13px Arial, sans-serif";
              el.style.zIndex = 1000;
              el.style.opacity = 0;
              document.body.appendChild(el);
              el._x = 0; el._y = 0; el._tx = 0; el._ty = 0;
              const lerp = (a, b, t) => a + (b - a) * t;
              const tick = () => {
                el._x = lerp(el._x, el._tx, 0.2);
                el._y = lerp(el._y, el._ty, 0.2);
                el.style.left = `${Math.round(el._x)}px`;
                el.style.top  = `${Math.round(el._y)}px`;
                requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            }

            const t = ctx.tooltip;
            if (!t || t.opacity === 0 || !t.dataPoints || !t.dataPoints.length) {
              el.style.opacity = 0;
              return;
            }

            const canvasRect = ctx.chart.canvas.getBoundingClientRect();
            const rawX = canvasRect.left + window.scrollX + t.caretX + 12;
            const rawY = canvasRect.top  + window.scrollY + t.caretY + 12;

            const dataIndex = t.dataPoints[0].dataIndex;
            const xLabels = ctx.chart.options.scales?.x?.labels || [];
            const timeLabel = xLabels[dataIndex] || "";

            const lines = [];
            lines.push(`<div style="font-weight:bold;margin-bottom:6px;">Zeit: ${timeLabel}</div>`);

            ctx.chart.data.datasets.forEach((ds, i) => {
              const meta = ctx.chart.getDatasetMeta(i);
              if (meta.hidden) return;

              const p = ds.data?.[dataIndex];
              const raw = (p && (p.original ?? p.y)) ?? null;

              let valueTxt = "null";
              if (raw !== null && raw !== undefined && raw !== "null" && !Number.isNaN(raw)) {
                if (ds.label.includes("Restarted")) {
                  valueTxt = parseFloat(raw).toFixed(3);
                } else {
                  const hasUnitInLabel = /\[.*?\]$/.test(ds.label);
                  let v = raw;
                  if (!isNaN(v)) v = parseFloat(v).toFixed(3);
                  valueTxt = hasUnitInLabel ? `${v}` : `${v}${getUnit(ds.label)}`;
                }
              }

              const color = ds.borderColor || ds.backgroundColor || "#999";
              lines.push(`
                <div style="display:flex;align-items:center;gap:8px;margin:2px 0;">
                  <span style="display:inline-block;width:10px;height:10px;background:${color};border:1px solid #ccc;"></span>
                  <span>${ds.label}: ${valueTxt}</span>
                </div>
              `);
            });

            el.innerHTML = lines.join("");

            const maxLeft = window.scrollX + document.documentElement.clientWidth  - el.offsetWidth  - 8;
            const maxTop  = window.scrollY + document.documentElement.clientHeight - el.offsetHeight - 8;

            const wantTop = rawY + el.offsetHeight > window.scrollY + window.innerHeight - 8;
            const targetY = wantTop ? (canvasRect.top + window.scrollY + t.caretY - el.offsetHeight - 12) : rawY;

            el._tx = Math.min(Math.max(8 + window.scrollX, rawX), maxLeft);
            el._ty = Math.min(Math.max(8 + window.scrollY, targetY), maxTop);

            el.style.opacity = 1;
          }
        }
      }
    }
  });
}

function addGraph(label, color) {
  if (chartData[label]) {
    removeGraph(label);
    return;
  }

  const newDataset = {
    label: label,
    data: randomData(),
    borderColor: color,
    borderWidth: 2,
    fill: false
  };

  chart.data.datasets.push(newDataset);
  chartData[label] = newDataset;
  chart.update();

  setTimeout(() => {
    chart.update();
  }, 50);

  updateInfoOutput();
}

function removeGraph(label) {
  chart.data.datasets = chart.data.datasets.filter(ds => ds.label !== label);
  delete chartData[label];
  chart.update();
  updateInfoOutput();

  document.querySelectorAll(".channel").forEach(el => {
    if (el.textContent.trim() === label) {
      el.classList.remove("active");
    }
  });
}

function removeAll() {
  chart.data.datasets = [];
  for (let key in chartData) delete chartData[key];
  activeTrackerLabels.clear();
  selectedTrackers = {};
  chart.update();
  updateInfoOutput();
  document.querySelectorAll(".channel").forEach(el => el.classList.remove("active"));
}

function openDownloadModal() {
  document.getElementById("downloadModal").classList.remove("hidden");
}

function closeDownloadModal() {
  document.getElementById("downloadModal").classList.add("hidden");
}

document.getElementById("confirmDownloadBtn").addEventListener("click", () => {
  const format = document.querySelector('input[name="download-type"]:checked').value;

  if (format === "png") {
    downloadChartAsPNG();
  } else if (format === "csv") {
    downloadChartAsCSV();
  }

  closeDownloadModal();
});

function downloadChartAsPNG() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("lineChart").toDataURL();
  link.click();
}

// Download als CSV
function downloadChartAsCSV() {
  const headers = ["Uhrzeit", ...Object.keys(chartData)];
  const rows = [];

  for (let i = 0; i < 24; i++) {
    const time = `${i.toString().padStart(2, "0")}:00`;
    const values = Object.keys(chartData).map(label => {
      const point = chartData[label].data[i];
      const raw = point?.original ?? point?.y ?? "";
      return typeof raw === "number" ? raw.toString().replace(".", ",") : "";
    });
    rows.push([time, ...values]);
  }

  const csvContent = headers.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `chart_${selectedDate.toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateInfoOutput() {
  const container = document.querySelector(".info-output");

  if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) {
    container.innerHTML = "";
    return;
  }

  const groups = new Map(); 
  chart.data.datasets.forEach((ds, i) => {
    const meta = chart.getDatasetMeta(i);
    if (meta && meta.hidden) return; 

    const base = (ds.label || "").split(" ")[0] || "";
    const dot = base.lastIndexOf(".");
    if (dot === -1) return;
    const param = base.slice(dot + 1); 

    if (!groups.has(param)) {
      groups.set(param, []);
    }
    groups.get(param).push(ds);
  });

  if (groups.size === 0) {
    container.innerHTML = "<div>Keine gültigen Daten</div>";
    return;
  }

  const fmtVal = (param, val) => {
    if (!Number.isFinite(val)) return "null";
    const decimals = (param === "Restarted") ? 3 : 2;
    const unit = getUnit(param) || "";
    return `${val.toFixed(decimals)}${unit}`;
  };

  let html = '<div style="display:flex; flex-wrap:wrap; gap:12px; align-items:stretch;">';

  Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([param, datasets]) => {
      let globalMax = { value: -Infinity, label: "" };
      let globalMin = { value: +Infinity, label: "" };

      datasets.forEach(ds => {
        (ds.data || []).forEach(p => {
          const raw = (p && (p.original ?? p.y));
          if (typeof raw === "number" && !Number.isNaN(raw)) {
            if (raw > globalMax.value) {
              globalMax.value = raw;
              globalMax.label = ds.label;
            }
            if (raw < globalMin.value) {
              globalMin.value = raw;
              globalMin.label = ds.label;
            }
          }
        });
      });

      if (!Number.isFinite(globalMax.value) || !Number.isFinite(globalMin.value)) return;

      html += `
        <div style="
          flex: 1 1 calc(33.333% - 12px);
          min-width: 280px;
          background: #f9f9f9;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 8px 10px;
          box-sizing: border-box;
        ">
          <div style="font-weight:600; margin-bottom:4px;">${param}</div>
          <div>Höchster Wert: ${fmtVal(param, globalMax.value)} - ${globalMax.label}</div>
          <div>Niedrigster Wert: ${fmtVal(param, globalMin.value)} - ${globalMin.label}</div>
        </div>
      `;
    });

  html += "</div>";
  container.innerHTML = html;
}

document.querySelectorAll(".channel").forEach(el => {
  el.addEventListener("mousedown", e => {
    e.preventDefault(); 
  });

  el.addEventListener("click", e => {
    e.stopPropagation(); 

    const container = e.currentTarget;
    const label = container.dataset.id;

    if (!label) return;

    const anlage = label.split("-")[0];
    const channel = label.substring(anlage.length + 1);

    console.log("Anlage:", anlage);
    console.log("Channel:", channel);

    openTrackerPopup(container, anlage, channel);
  });
});

document.querySelectorAll(".resolution-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".resolution-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    loadDataForDate(selectedDate);
  });
});

function updateDateDisplay() {
  const display = document.querySelector(".left-controls input");
  const day = selectedDate.getDate().toString().padStart(2, "0");
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = selectedDate.getFullYear();
  display.value = `${day}.${month}.${year}`;
}

// Daten für den Tag laden
async function loadDataForDate(dateObj) {
  const dateStr = dateObj.toISOString().slice(0,10);
  updateDateDisplay();
  populateDateSelectors();

  const labelsToLoad = Array.from(activeTrackerLabels || []);
  if (labelsToLoad.length === 0) { hideLoader?.(); return; }

  const groupMap = new Map(); 
  for (const label of labelsToLoad) {
    const site = getSiteFromLabel(label);            
    const param = getParamFromLabel(label);         
    const key = `${site}|${param}`;
    if (!groupMap.has(key)) groupMap.set(key, {site, param, labels: []});
    groupMap.get(key).labels.push(label);
  }

  try {
    const results = await Promise.all(
      Array.from(groupMap.values()).map(({site, param, labels}) => {
    
        const trackersCsv = encodeURIComponent(labels.join(","));
        const url =
          `${API_BASE}/${encodeURIComponent(param.toLowerCase())}` +
          `?date=${encodeURIComponent(dateStr)}` +
          `&site=${encodeURIComponent(site)}` +
          `&trackers=${trackersCsv}`;
      
        return fetch(url)
          .then(r => {
            if (!r.ok) throw new Error(`GET ${param} ${r.status} ${r.statusText}`);
            return r.json();
          })
          .then(data => ({ site, param, data }));
      })
    );

    for (const {site, param, data} of results) {
      const keyBase = `${site}|${param}`;
      const {labels} = groupMap.get(keyBase);

      for (const label of labels) {
        const idx = label.split("-")[1].split(".")[0];    
        const backendKey = `${param}-${idx}`;            
        const series = data?.[backendKey];
        if (!Array.isArray(series) || series.length === 0) continue;

        const points = seriesToPoints(series, param);
        const colorKey = `${param}-${idx}`;
        const color = trackerColors[colorKey] || "#000000";
        const ds = ensureDataset(label, color, getUnit(param));
        ds.data = points;
      }
    }

    chart.update();
    updateInfoOutput();
  } catch (e) {
    console.error("Fehler bei loadDataForDate:", e);
  } finally {
    hideLoader?.();
  }
}

function populateDateSelectors() {
  const daySelect = document.getElementById("day-select");
  const monthSelect = document.getElementById("month-select");
  const yearSelect = document.getElementById("year-select");

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

  daySelect.innerHTML = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const option = document.createElement("option");
    option.value = d;
    option.text = d.toString().padStart(2, "0");
    if (d === selectedDate.getDate()) option.selected = true;
    daySelect.appendChild(option);
  }

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  monthSelect.innerHTML = "";
  for (let m = 0; m < 12; m++) {
    const option = document.createElement("option");
    option.value = m;
    option.text = monthNames[m];
    if (m === selectedDate.getMonth()) option.selected = true;
    monthSelect.appendChild(option);
  }

  yearSelect.innerHTML = "";
  for (let y = 2020; y <= 2030; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.text = y;
    if (y === selectedDate.getFullYear()) option.selected = true;
    yearSelect.appendChild(option);
  }
}

["day-select", "month-select", "year-select"].forEach(id => {
  document.getElementById(id).addEventListener("change", () => {
    const day = parseInt(document.getElementById("day-select").value);
    const month = parseInt(document.getElementById("month-select").value);
    const year = parseInt(document.getElementById("year-select").value);

    selectedDate = new Date(year, month, day, 12); 

    showLoader();

    loadDataForDate(selectedDate);
  });
});

// Pfeiltasten 
document.querySelector(".left-controls button:nth-child(1)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  showLoader(); 
  loadDataForDate(selectedDate);
});

document.querySelector(".left-controls button:nth-child(3)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  showLoader(); 
  loadDataForDate(selectedDate);
});

document.addEventListener("DOMContentLoaded", () => {
  setupChart();
  populateDateSelectors();
  updateDateDisplay();
  loadDataForDate(selectedDate);
  renderSidebar();
});

// Heute-Button
document.getElementById("today-button").addEventListener("click", () => {
  selectedDate = new Date();
  loadDataForDate(selectedDate);
});

function isAtOrAfterRestarted(elem) {
  const list = elem.closest(".channel-list");
  if (!list) return false;
  const channels = Array.from(list.querySelectorAll(".channel"));
  const restartedEl = channels.find(c => c.dataset.id && c.dataset.id.endsWith("-Restarted"));
  if (!restartedEl) return false;
  const idx = channels.indexOf(elem);
  const idxRestarted = channels.indexOf(restartedEl);
  return idx >= idxRestarted; 
}

function openTrackerPopup(elem, anlage, channel) {
  const popup = document.querySelector(".tracker-popup");

  const alreadyOpen = !popup.classList.contains("hidden");
  const rect = elem.getBoundingClientRect();
  const placeAbove = isAtOrAfterRestarted(elem);

  const list = popup.querySelector(".tracker-list");
  list.innerHTML = "";
  const count = trackerCounts[anlage] || 40;
  const trackers = Array.from({ length: count }, (_, i) =>
    `${anlage}-${(i + 1).toString().padStart(3, "0")}.${channel}`
  );
  trackers.forEach(name => {
    const row = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedTrackers[name] || false;
    checkbox.dataset.tracker = name;
    checkbox.onclick = e => {
      selectedTrackers[name] = e.target.checked;
    };
    const label = document.createElement("label");
    label.textContent = ` ${name}`;
    row.appendChild(checkbox);
    row.appendChild(label);
    list.appendChild(row);
  });

  const prevVis = popup.style.visibility;
  const prevDisplayHidden = popup.classList.contains("hidden");
  popup.style.visibility = "hidden";
  popup.classList.remove("hidden");

  const popupWidth  = popup.offsetWidth || 300;
  const popupHeight = popup.offsetHeight || 350;

  let targetLeft = Math.round(rect.left + window.scrollX);
  const maxLeft = window.scrollX + document.documentElement.clientWidth - popupWidth - 10;
  targetLeft = Math.min(targetLeft, maxLeft);
  targetLeft = Math.max(targetLeft, 10);

  let targetTop = placeAbove
    ? Math.round(rect.top + window.scrollY) - popupHeight
    : Math.round(rect.bottom + window.scrollY);

  targetTop = Math.max(targetTop, 10);

  const currentLeft = parseInt(popup.style.left, 10);
  const currentTop  = parseInt(popup.style.top, 10);
  if (
    alreadyOpen &&
    currentLeft === targetLeft &&
    currentTop === targetTop
  ) {
    popup.classList.add("hidden");
    popup.style.visibility = prevVis || "";
    const toggleIcon = elem.querySelector(".tracker-toggle");
    if (toggleIcon) toggleIcon.textContent = ">";
    return;
  }

  popup.style.left = `${targetLeft}px`;
  popup.style.top  = `${targetTop}px`;
  popup.style.visibility = ""; 

  const toggleIcon = elem.querySelector(".tracker-toggle");
  if (toggleIcon) toggleIcon.textContent = "<";
}

function closeAllPopups() {
  document.querySelectorAll(".tracker-popup").forEach(p => p.classList.add("hidden"));
  document.querySelectorAll(".tracker-toggle").forEach(t => t.textContent = ">");
}

document.addEventListener("click", e => {
  const popup = document.querySelector(".tracker-popup");
  const clickedInsidePopup = popup.contains(e.target);
  const clickedToggle = e.target.classList.contains("tracker-toggle");

  if (!clickedInsidePopup && !clickedToggle) {
    closeAllPopups();
  }

});

function selectAllTrackers(btn) {
  const checkboxes = btn.closest(".tracker-popup").querySelectorAll("input[type=checkbox]");
  checkboxes.forEach(cb => {
    cb.checked = true;
    selectedTrackers[cb.dataset.tracker] = true;
  });
}

function deselectAllTrackers(btn) {
  const checkboxes = btn.closest(".tracker-popup").querySelectorAll("input[type=checkbox]");
  checkboxes.forEach(cb => {
    cb.checked = false;
    selectedTrackers[cb.dataset.tracker] = false;
  });
}

// Tracker adden
function addSelectedTrackers(btn) {
  const popup = btn.closest(".tracker-popup");
  const checkboxes = popup.querySelectorAll("input[type=checkbox]");

  const trackersToFetch = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      trackersToFetch.push(cb.dataset.tracker);
    }
  });

  if (trackersToFetch.length === 0) return;

  const dateStr = selectedDate.toISOString().slice(0, 10);

  const site = trackersToFetch[0].split("-")[0];

  fetch("http://localhost:5000/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackers: trackersToFetch,
      date: dateStr,
      site: site
    })
  })
    .then(res => res.json())
    .then(backendData => {
      trackersToFetch.forEach(label => {
        const backendKey = label;
        const data = backendData[backendKey];

        if (!data || !Array.isArray(data)) {
          console.warn("⚠️ Keine oder ungültige Daten für", backendKey);
          return;
        }

        loadedTrackerData[label] = data;

        const [anlage, paramRaw] = label.split("-");
        const [index, param] = paramRaw.split(".");
        const key = `${param}-${index}`;
        const unit = getUnit(param);
        const originalData = data;

        const scaledData =
          param === "Chip_Temp"
            ? data.map(v => (v !== null ? v / 8 : null))
            : param === "Angle"
            ? data.map(v => (v !== null ? (v + 60) / 24 : null))
            : param === "Last_Angle"  
            ? data.map(v => (v !== null ? (v + 60) / 24 : null))
            : param === "Device_Type"
            ? data.map(v => (v === 3001 ? 1 : v === 3012 ? 2 : null))
            : param === "Firmware"
            ? data.map(v => (v !== null ? v / 2500 : null))
            : param === "Health_Errors"
            ? data.map(v => (v !== null ? v / 2000 : null))
            : param === "Health_Missed"
            ? data.map(v => (v !== null ? v / 2000 : null))
            : param === "Meta_Serial"
            ? data.map(v => (v !== null ? v / 50 : null))
            : param === "Restarted"
            ? data.map(v => (v !== null ? v * 10 : null))
            : param === "Rf_Hops"
            ? data.map(v => (v !== null ? v / 2 : null))
            : param === "Rf_Latency"
            ? data.map(v => (v !== null ? v / 10000 : null))
            : param === "Rf_Retries"
            ? data.map(v => (v !== null ? v * 10 : null))
            : param === "Rf_Time_Ack"
            ? data.map(v => (v !== null ? v / 1000 : null))
            : param === "Rf_Time_Answer"
            ? data.map(v => (v !== null ? v / 1000 : null))
            : param === "Set_Angle"
            ? data.map(v => (v !== null ? (v + 60) / 24 : null))
            : param === "Set_Motor_Control"
            ? data.map(v => (v !== null ? v / 100 : null))
            : param === "Supply_Voltage"
            ? data.map(v => (v !== null ? v / 12 : null))
            : param === "Uptime"
            ? data.map(v => (v !== null ? v / 15000 : null))
            : param === "Rf_RSSI_dBm"
            ? data.map(v => (v !== null ? (v + 110) / 15 : null))
            : param === "Error_Flags"
            ? data.map(v => (v !== null && v > 0 ? 3 : 0))
            : param === "Angle_Diff"
            ? data.map(v => (v !== null ? ((v - 2.5) / 2) + 3 : null))
            : data;

        const cleanedData = Array.from({ length: 24 }, (_, i) => ({
          x: `${i.toString().padStart(2, "0")}:00`,
          y: scaledData[i] ?? null,
          original: originalData[i] ?? null
        }));

        const hasValidY = cleanedData.some(point => point.y !== null);
        const color = trackerColors[key] || "#000000";

        if (chartData[label]) {
          console.warn(`⚠️ Tracker ${label} ist bereits im Chart – wird übersprungen.`);
          return;
        }

        chartData[label] = {
          label: `${label} ${unit}`.trim(),
          data: [],
          borderColor: color,
          backgroundColor: color,
          pointBorderColor: color,
          pointBackgroundColor: color,
          borderWidth: 2,
          tension: 0.2,
          fill: false
        };
        chart.data.datasets.push(chartData[label]);

        chartData[label].borderColor = color;
        chartData[label].backgroundColor = color;
        chartData[label].pointBorderColor = color;
        chartData[label].pointBackgroundColor = color;

        chartData[label].data = hasValidY ? cleanedData : [];
        activeTrackerLabels.add(label);
      });

      chart.update();
      updateInfoOutput();

      document.querySelectorAll(".tracker-toggle").forEach(t => t.textContent = ">");
      checkboxes.forEach(cb => {
        cb.checked = false;
        selectedTrackers[cb.dataset.tracker] = false;
      });
      closeAllPopups();
    })
    .catch(err => {
      console.error("❌ Fehler beim Abrufen der Tracker-Daten:", err);
    });
}

async function reloadActiveTrackers() {
  if (!activeTrackerLabels || activeTrackerLabels.size === 0) {
    console.warn("Keine aktiven Tracker – nichts zu reloaden.");
    return;
  }
  showLoader?.();

  const groupMap = new Map();
  for (const label of activeTrackerLabels) {
    const site = getSiteFromLabel(label);
    const param = getParamFromLabel(label);
    const key = `${site}|${param}`;
    if (!groupMap.has(key)) groupMap.set(key, { site, param, labels: [] });
    groupMap.get(key).labels.push(label);
  }

  const dateStr = selectedDate.toISOString().slice(0,10);

  try {
    const results = await Promise.all(
      Array.from(groupMap.values()).map(({site, param, labels}) => {
        const trackersCsv = encodeURIComponent(labels.join(","));
        const url =
          `${API_BASE}/${encodeURIComponent(param.toLowerCase())}` +
          `?date=${encodeURIComponent(dateStr)}` +
          `&site=${encodeURIComponent(site)}` +
          `&trackers=${trackersCsv}` +
          `&force=1`; 
      
        return fetch(url)
          .then(r => {
            if (!r.ok) throw new Error(`GET ${param} ${r.status} ${r.statusText}`);
            return r.json();
          })
          .then(data => ({ site, param, data }));
      })
    );

    for (const {site, param, data} of results) {
      const labels = groupMap.get(`${site}|${param}`).labels;
      for (const label of labels) {
        const idx = label.split("-")[1].split(".")[0];
        const backendKey = `${param}-${idx}`;
        const series = data?.[backendKey];
        if (!Array.isArray(series) || series.length === 0) continue;

        const points = seriesToPoints(series, param);
        const color = trackerColors[`${param}-${idx}`] || "#000000";
        const ds = ensureDataset(label, color, getUnit(param));
        ds.data = points;
      }
    }

    chart.update();
    updateInfoOutput();
  } catch (e) {
    console.error("Reload-Fehler:", e);
  } finally {
    hideLoader?.();
  }
}

function closeMultiDownload() {
  document.getElementById("multiDownloadModal").classList.add("hidden");

  document.querySelectorAll("#multiDownloadModal input[type='checkbox']").forEach(cb => {
    cb.checked = false;
  });

  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  document.getElementById("endDate").removeAttribute("min");
  document.getElementById("endDate").removeAttribute("max");
}

document.getElementById("startDate").addEventListener("change", () => {
  const start = new Date(document.getElementById("startDate").value);
  if (isNaN(start)) return;

  const minDate = start.toISOString().split("T")[0];

  const maxDateObj = new Date(start);
  maxDateObj.setDate(maxDateObj.getDate() + 1);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const endInput = document.getElementById("endDate");
  endInput.min = minDate;
  endInput.max = maxDate;

  if (new Date(endInput.value) < start || new Date(endInput.value) > maxDateObj) {
    endInput.value = "";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("multiDownloadBtn");
  const modal = document.getElementById("multiDownloadModal");

  if (btn && modal) {
    btn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
  }
});

document.getElementById("confirmDownload").addEventListener("click", function () {
    const selectedSites = Array.from(document.querySelectorAll('#multiDownloadModal .modal-section:nth-child(1) input[type="checkbox"]:checked'))
        .map(cb => cb.nextSibling.textContent.trim());
    
    const selectedChannels = Array.from(document.querySelectorAll('#multiDownloadModal .modal-section:nth-child(2) input[type="checkbox"]:checked'))
        .map(cb => cb.nextSibling.textContent.trim().split(" ")[0]);

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!selectedSites.length || !selectedChannels.length || !startDate || !endDate) {
        alert("Bitte mindestens eine Anlage, einen Channel und beide Daten auswählen!");
        return;
    }

    fetch("http://127.0.0.1:5000/multiple_download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sites: selectedSites,
            channels: selectedChannels,
            start_date: startDate,
            end_date: endDate
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Download-Fehler: " + response.status);
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `multiple_download_${startDate}_bis_${endDate}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        closeMultiDownload();
    })
    .catch(err => {
        console.error(err);
        alert("Fehler beim Download. Siehe Konsole.");
    });
});

function animateChartRefresh() {
  const container = document.getElementById("chart-container");
  container.classList.add("fade");
  setTimeout(() => {
    container.classList.remove("fade");
  }, 400);
}

function showLoader() {
  document.getElementById("chart-loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("chart-loader").classList.add("hidden");
}

function getSiteFromLabel(label) {
  return label.split("-", 1)[0]; 
}
function getParamFromLabel(label) {
  return label.split(".").slice(1).join("."); 
}
function ensureDataset(label, color, unit) {
  if (!chartData[label]) {
    chartData[label] = {
      label: `${label}${unit ? " " + unit : ""}`,
      data: [],
      borderWidth: 2,
      tension: 0.2,
      fill: false,
      borderColor: color || "#000000",
      backgroundColor: color || "#000000",
      pointBorderColor: color || "#000000",
      pointBackgroundColor: color || "#000000",
    };
    chart.data.datasets.push(chartData[label]);
  }
  return chartData[label];
}
function cleanPoints(series) {
  if (!Array.isArray(series)) return [];
  return series.filter(p => p && p.x != null && p.y != null && !Number.isNaN(p.y));
}
