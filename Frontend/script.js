let chart;
const chartData = {};
let selectedTrackers = {}; // aktuelle Checkbox-Zustände
let activeTrackerLabels = new Set();
let selectedDate = new Date(); // nimmt immer das aktuelle Datum
let loadedTrackerData = {};

const trackerColors = {};
const predefinedColors = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
  "#5254a3", "#9c9ede", "#cedb9c", "#e7ba52"
];

for (let i = 1; i <= 19; i++) {
  const num = i.toString().padStart(3, "0");
  trackerColors[`Error_Flag-${num}`] = predefinedColors[i - 1];
  trackerColors[`Motor_Current_Max-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_Hops-${num}`] = predefinedColors[i - 1];
  trackerColors[`Chip_Temp-${num}`] = predefinedColors[i - 1];
  trackerColors[`Emergency_Stop-${num}`] = predefinedColors[i - 1];
  trackerColors[`Rf_RSSI_dBm-${num}`] = predefinedColors[i - 1];
  trackerColors[`Device_Type-${num}`] = predefinedColors[i - 1];
  trackerColors[`Angle-${num}`] = predefinedColors[i - 1];
}

function hexToRgba(hex, alpha = 1) {
  if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) return hex; // falls keine Hex-Farbe
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getUnit(label) {
  if (label.includes("Motor_Current_Max")) return " [A]";
  if (label.includes("Chip_Temp")) return " [°C]";
  if (label.includes("Rf_RSSI_dBm")) return " [dBm]";
  if (label.includes("Rf_Hops")) return " [Hops]";
  if (label.includes("Error_Flag")) return " [%]";
  if (label.includes("Emergency_Stop")) return "";
  if (label.includes("Device_Type")) return "";
  if (label.includes("Angle")) return " [°]";
  return "";
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

function setupChart() {
  const ctx = document.getElementById("lineChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: "easeInOutQuad"
      },
      layout: {
        padding: {
          top: 25,
          bottom: 50
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      hover: {
        mode: "index",
        intersect: false
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
          backgroundColor: "#fff",
          borderWidth: 2
        },
        line: {
          tension: 0.1
        }
      },
      scales: {
        x: {
          type: "category",
          title: {
            display: true,
            text: "Uhrzeit"
          },
          labels: Array.from({ length: 25 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
          ticks: {
            maxTicksLimit: 25,
            autoSkip: false
          }
        },
        y: {
          min: 0,
          max: 5,
          title: {
            display: true,
            text: "Wert"
          }
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          onClick: (e, legendItem) => {
            const index = legendItem.datasetIndex;
            const meta = chart.getDatasetMeta(index);
            meta.hidden = !meta.hidden;
            chart.update();
          }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(30,30,30,0.9)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#aaa",
          borderWidth: 1,
          cornerRadius: 6,
          padding: 12,
          titleFont: {
            size: 14,
            weight: "bold"
          },
          bodyFont: {
            size: 13
          },
          displayColors: true,
          callbacks: {
            title: function (tooltipItems) {
              return `Zeit: ${tooltipItems[0].label}`;
            },
            label: function (tooltipItem) {
              const label = tooltipItem.dataset.label;
              const point = tooltipItem.raw;
              const value = point?.original ?? tooltipItem.formattedValue;

              let displayValue = value;

              if (label.includes("Chip_Temp")) {
                displayValue = value.toFixed(1);  // ✅ NICHT mehr multiplizieren!
                return `${label}: ${displayValue}`;
              }
            
              const unit = getUnit(label);
            
              if (!isNaN(value)) {
                displayValue = parseFloat(value).toFixed(3);  // ⬅️ Runden auf 3 Nachkommastellen
              }
            
              return `${label}: ${displayValue}`;
            }
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
  chart.options.plugins.tooltip.enabled = false;
  chart.update();

  setTimeout(() => {
    chart.options.plugins.tooltip.enabled = true;
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

function downloadChartAsCSV() {
  const headers = ["Uhrzeit", ...Object.keys(chartData)];
  const rows = [];

  for (let i = 0; i < 24; i++) {
    const time = `${i.toString().padStart(2, "0")}:00`;
    const values = Object.keys(chartData).map(label => {
      const point = chartData[label].data[i];
      const raw = point?.original ?? point?.y ?? "";
      // Stelle sicher, dass es ein "echter" Zahlwert ist
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
  const allValues = Object.values(chartData).flatMap(ds =>
  ds.data.map(p => ({
    value: p.original ?? p.y, // wenn original vorhanden, nimm den
    label: ds.label
    }))
  );

  if (allValues.length === 0) {
    container.innerHTML = "";
    return;
  }

  const numericValues = allValues.filter(p => typeof p.value === "number");

  if (numericValues.length === 0) {
    container.innerHTML = "<div>Keine gültigen Daten</div>";
    return;
  }

  const max = numericValues.reduce((a, b) => (a.value > b.value ? a : b));
  const min = numericValues.reduce((a, b) => (a.value < b.value ? a : b));

  container.innerHTML = `
    <div>Höchster AVG: ${max.value.toFixed(2)} - ${max.label}</div>
    <div>Niedrigster AVG: ${min.value.toFixed(2)} - ${min.label}</div>
  `;
}

document.querySelectorAll(".channel").forEach(el => {
  el.addEventListener("mousedown", e => {
    e.preventDefault(); // verhindert Text markieren
  });

  el.addEventListener("click", e => {
    e.stopPropagation(); // ✅ Verhindert, dass der globale Klick das Popup wieder schließt!

    const container = e.currentTarget;
    const label = container.dataset.id;

    if (!label) return;

    // Aasanurme-Motor_Current_Max → aufsplitten
    const anlage = label.split("-")[0];
    const channel = label.substring(anlage.length + 1); // alles nach dem ersten "-"

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

// DATUMS-LOGIK
function updateDateDisplay() {
  const display = document.querySelector(".left-controls input");
  const day = selectedDate.getDate().toString().padStart(2, "0");
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = selectedDate.getFullYear();
  display.value = `${day}.${month}.${year}`;
}

function loadDataForDate(date) {
  loadedTrackerData = {};
  const parameters = ["motor_current_max", "chip_temp", "angle"];

  Promise.all(
    parameters.map(param =>
      fetch(`http://localhost:5000/api/${param}?date=${date.toISOString().slice(0, 10)}`)
        .then(res => res.json())
        .then(data => ({ param, data }))
    )
  )
    .then(results => {
      loadedTrackerData = {};

      results.forEach(({ param, data }) => {
        if (!data || typeof data !== "object") return;

        Object.keys(data).forEach(key => {
          const [paramName, index] = key.split("-");
          const sites = ["Aasanurme", "Augusta", "Babimost", "Besingrand", "Calarasi"];

          sites.forEach(site => {
            const newKey = `${site}-${index}.${paramName}`;
            loadedTrackerData[newKey] = data[key];
          });
        });
      });

      activeTrackerLabels.forEach(label => {
        if (chartData[label]) {
          const trackerId = label.split("-").slice(1).join("-");
          const param = trackerId.split(".")[1];
          const index = trackerId.split(".")[0];
          const key = `${param}-${index}`;
          const baseColor = trackerColors[key] || "#000000";
        }
      });

      chart.update();

      setTimeout(() => {
        activeTrackerLabels.forEach(label => {
          const data = loadedTrackerData[label];
          if (!data) return;

          const trackerId = label.split("-").slice(1).join("-");
          const param = trackerId.split(".")[1];
          const index = trackerId.split(".")[0];
          const key = `${param}-${index}`;
          const originalData = data;

          const scaledData =
            param === "Chip_Temp"
              ? data.map(v => (v !== null ? v / 8 : null))
              : param === "Angle"
              ? data.map(v => (v !== null ? (v + 60) / 24 : null))
              : param === "Device_Type"
              ? data.map(v => (v === 3001 ? 1 : v === 3012 ? 2 : null))
              : data;

          const cleanedData = Array.from({ length: 24 }, (_, i) => ({
            x: `${i.toString().padStart(2, "0")}:00`,
            y: scaledData[i] !== undefined ? scaledData[i] : null,
            original: data[i] !== undefined ? data[i] : null
          }));

          const hasValidY = cleanedData.some(point => point.y !== null);

          if (!chartData[label]) {
            chartData[label] = {
              label: label,
              data: [],
              borderColor: trackerColors[key] || "#000000",
              borderWidth: 2,
              fill: false
            };
            chart.data.datasets.push(chartData[label]);
          }

          if (hasValidY) {
            chartData[label].data = cleanedData;
            const color = trackerColors[key] || "#000000";
            chartData[label].borderColor = color;
            chartData[label].backgroundColor = color;
            chartData[label].pointBorderColor = color;
            chartData[label].pointBackgroundColor = color;
          } else {
            console.warn(`⚠️ Keine gültigen Y-Daten für ${label}`);
          }
        });

        chart.update();
        updateInfoOutput();

        const hasAnyData = Object.values(chartData).some(ds =>
          ds.data.some(point => point.y !== null)
        );

        if (!hasAnyData) {
          chart.data.datasets = []; // Diagramm leeren
          chart.update();
        }

        hideLoader(); // ✅ Spinner am Ende sicher ausblenden
      }, 500);
    })
    .catch(err => {
      console.error("Fehler beim Laden:", err);
      hideLoader(); // ✅ Auch bei Fehlern ausblenden
    });

  updateDateDisplay();
  populateDateSelectors();

  if (activeTrackerLabels.size > 0) {
    const dateStr = date.toISOString().slice(0, 10);
    const trackersToReload = Array.from(activeTrackerLabels);

    fetch("http://localhost:5000/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackers: trackersToReload,
        date: dateStr,
        forceReload: false
      })
    })
      .then(res => res.json())
      .then(backendData => {
        trackersToReload.forEach(label => {
          const data = backendData[label];
          if (!data || !Array.isArray(data)) return;

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
              : param === "Device_Type"
              ? data.map(v => (v === 3001 ? 1 : v === 3012 ? 2 : null))
              : data;

          const cleanedData = Array.from({ length: 24 }, (_, i) => ({
            x: `${i.toString().padStart(2, "0")}:00`,
            y: scaledData[i] ?? null,
            original: originalData[i] ?? null
          }));

          const hasValidY = cleanedData.some(point => point.y !== null);
          const color = trackerColors[key] || "#000000";

          if (!chartData[label]) {
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
          }

          chartData[label].data = hasValidY ? cleanedData : [];
        });

        chart.update();
        updateInfoOutput();

        const hasAnyData = Object.values(chartData).some(ds =>
          ds.data.some(point => point.y !== null)
        );

        if (!hasAnyData) {
          chart.data.datasets = [];
          chart.update();
        }

        hideLoader(); // ✅ auch hier am Ende
      })
      .catch(err => {
        console.error("❌ Fehler beim automatischen Reload:", err);
        hideLoader(); // ✅ auch hier
      });
  } else {
    // 🔁 Keine aktiven Tracker → Spinner trotzdem beenden!
    hideLoader();
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

// Dropdown-Wechsel
["day-select", "month-select", "year-select"].forEach(id => {
  document.getElementById(id).addEventListener("change", () => {
    const day = parseInt(document.getElementById("day-select").value);
    const month = parseInt(document.getElementById("month-select").value);
    const year = parseInt(document.getElementById("year-select").value);

    // ✅ Verhindert 1-Tages-Verschiebung durch Zeitzonenprobleme
    selectedDate = new Date(year, month, day, 12); 

    // ✅ Spinner anzeigen wie bei < / > Navigation
    showLoader();

    // ✅ Lädt alle aktiven Tracker-Daten automatisch
    loadDataForDate(selectedDate);
  });
});

// Pfeiltasten < >
document.querySelector(".left-controls button:nth-child(1)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  showLoader(); // ✨ Spinner anzeigen
  loadDataForDate(selectedDate);
});

document.querySelector(".left-controls button:nth-child(3)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  showLoader(); // ✨ Spinner anzeigen
  loadDataForDate(selectedDate);
});

document.addEventListener("DOMContentLoaded", () => {
  setupChart();
  populateDateSelectors();
  updateDateDisplay();
  loadDataForDate(selectedDate); // ✅ Diese Zeile hinzufügen!
});

// Auf heutiges Datum springen
document.getElementById("today-button").addEventListener("click", () => {
  selectedDate = new Date();
  loadDataForDate(selectedDate);
});

// TRACKER-POPUP
function openTrackerPopup(elem, anlage, channel) {
  console.log("🚀 openTrackerPopup() aufgerufen");
  console.log("Anlage:", anlage);
  console.log("Channel:", channel);

  const popup = document.querySelector(".tracker-popup");
  console.log("Popup-Element:", popup); // ✅ jetzt korrekt!

  const alreadyOpen = !popup.classList.contains("hidden");
  const currentLeft = parseInt(popup.style.left, 10);
  const currentTop = parseInt(popup.style.top, 10);
  const rect = elem.getBoundingClientRect();
  const targetLeft = Math.round(rect.left + window.scrollX);
  const targetTop = Math.round(rect.bottom + window.scrollY);

  if (alreadyOpen && currentLeft === targetLeft && currentTop === targetTop) {
    popup.classList.add("hidden");

    // 🔁 Pfeil zurück auf ">"
    const toggleIcon = elem.querySelector(".tracker-toggle");
    if (toggleIcon) toggleIcon.textContent = ">";

    return;
  } 

  closeAllPopups();

  const list = popup.querySelector(".tracker-list");
  list.innerHTML = "";

  const trackers = Array.from({ length: 19 }, (_, i) =>
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

  popup.style.top = `${targetTop}px`;
  popup.style.left = `${targetLeft}px`;
  popup.classList.remove("hidden");
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

async function addSelectedTrackers(btn) {
  const popup = btn.closest(".tracker-popup");
  const checkboxes = popup.querySelectorAll("input[type=checkbox]:checked");

  const trackerIds = Array.from(checkboxes).map(cb => cb.value);
  if (trackerIds.length === 0) return;

  const dateStr = selectedDate.toISOString().slice(0, 10);

  try {
    const res = await fetch("http://localhost:5000/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackers: trackerIds, date: dateStr })
    });

    const backendData = await res.json();
    console.log("📊 API-Daten:", backendData);

    trackerIds.forEach(label => {
      if (typeof label !== "string" || !label.includes("-") || !label.includes(".")) {
        console.warn("❌ Ungültiges Label übersprungen:", label);
        return;
      }


      const [anlage, paramRaw] = label.split("-");
      const [index, param] = paramRaw.split(".");
      const key = `${param}-${index}`;
      const unit = getUnit(param);
      const color = getTrackerColor(key);

      const scaledData =
        param.toLowerCase() === "chip_temp"
          ? data.map(v => (v !== null ? v / 8 : null))
          : param.toLowerCase() === "angle"
          ? data.map(v => (v !== null ? (v + 60) / 24 : null))
          : data;

      const cleanedData = scaledData.map((val, hour) => ({
        x: `${hour.toString().padStart(2, "0")}:00`,
        y: val,
        original: data[hour]
      }));

      const hasValidY = cleanedData.some(p => p.y !== null);

      if (!chartData[label]) {
        chartData[label] = {
          label: `${label} ${unit}`.trim(),
          data: hasValidY ? cleanedData : [],
          borderColor: color,
          backgroundColor: color,
          pointBorderColor: color,
          pointBackgroundColor: color,
          borderWidth: 2,
          tension: 0.2,
          fill: false
        };
        chart.data.datasets.push(chartData[label]);
        activeTrackerLabels.add(label);
      } else {
        chartData[label].data = hasValidY ? cleanedData : [];
      }
    });

    chart.update();
    updateInfoOutput();
    closeAllPopups();
  } catch (err) {
    console.error("❌ Fehler beim Abrufen der Tracker-Daten:", err);
  }
}

function reloadActiveTrackers() {
  if (activeTrackerLabels.size === 0) {
    alert("Keine Tracker aktiv!");
    return;
  }

  showLoader(); // ✨ Zeige Spinner

  const dateStr = selectedDate.toISOString().slice(0, 10);
  const trackersToReload = Array.from(activeTrackerLabels);

  fetch("http://localhost:5000/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackers: trackersToReload,
      date: dateStr,
      forceReload: true
    })
  })
    .then(res => res.json())
    .then(backendData => {
      trackersToReload.forEach(label => {
        const data = backendData[label];
        if (!data || !Array.isArray(data)) {
          console.warn(`⚠️ Keine oder ungültige Reload-Daten für ${label}`);
          return;
        }

        const [anlage, paramRaw] = label.split("-");
        const [index, param] = paramRaw.split(".");
        const key = `${param}-${index}`;
        const originalData = data;
        const unit = getUnit(param);

        const scaledData =
          param === "Chip_Temp"
            ? data.map(v => (v !== null ? v / 8 : null))
            : param === "Angle"
            ? data.map(v => (v !== null ? (v + 60) / 24 : null))
            : param === "Device_Type"
            ? data.map(v => (v === 3001 ? 1 : v === 3012 ? 2 : null))
            : data;

        const cleanedData = Array.from({ length: 24 }, (_, i) => ({
          x: `${i.toString().padStart(2, "0")}:00`,
          y: scaledData[i] ?? null,
          original: originalData[i] ?? null
        }));

        const hasValidY = cleanedData.some(point => point.y !== null);
        const color = trackerColors[key] || "#000000";

        if (!chartData[label]) {
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
        }

        chartData[label].borderColor = color;
        chartData[label].backgroundColor = color;
        chartData[label].pointBorderColor = color;
        chartData[label].pointBackgroundColor = color;
        chartData[label].data = hasValidY ? cleanedData : [];
      });

      chart.update();
      updateInfoOutput();
    })
    .catch(err => {
      console.error("❌ Fehler beim Reload:", err);
    })
    .finally(() => {
      hideLoader(); // ✨ Verstecke Spinner
    });
}

function closeMultiDownload() {
  // Modal ausblenden
  document.getElementById("multiDownloadModal").classList.add("hidden");

  // Alle Checkboxen zurücksetzen
  document.querySelectorAll("#multiDownloadModal input[type='checkbox']").forEach(cb => {
    cb.checked = false;
  });

  // Datum zurücksetzen
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  // Enddatum Einschränkung zurücksetzen
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

  // Falls bereits ausgewähltes Enddatum ungültig ist, löschen
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

document.getElementById("confirmDownload").addEventListener("click", async () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) {
    alert("Bitte Start- und Enddatum wählen!");
    return;
  }

  const zip = new JSZip();

  // ✅ Liste der ausgewählten Channels
  const selectedChannels = Array.from(
    document.querySelectorAll("#multiDownloadModal .modal-section:nth-child(2) input[type='checkbox']:checked")
  ).map(cb => cb.nextSibling?.textContent?.trim().replace(/\[.*?\]/g, "").trim());

  if (selectedChannels.length === 0) {
    alert("Bitte mindestens einen Channel auswählen!");
    return;
  }

  for (const channelKey of selectedChannels) {
    const trackerIds = Array.from({ length: 19 }, (_, i) =>
      `Aasanurme-${(i + 1).toString().padStart(3, "0")}.${channelKey}`
    );

    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    const rows = [];

    for (const date of allDates) {
      const isoDate = date.toISOString().slice(0, 10);

      try {
        const res = await fetch("http://localhost:5000/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackers: trackerIds,
            date: isoDate,
            forceReload: false
          })
        });

        const data = await res.json();

        for (let hour = 0; hour < 24; hour++) {
          const row = [
            isoDate,
            `${hour.toString().padStart(2, "0")}:00`
          ];

          for (const trackerId of trackerIds) {
            const values = data[trackerId];
            row.push(values && values[hour] != null ? values[hour].toString().replace(".", ",") : "");
          }

          rows.push(row);
        }
      } catch (err) {
        console.error(`❌ Fehler bei ${channelKey} am ${isoDate}`, err);
        alert("Fehler beim Abrufen der Daten!");
        return;
      }
    }

    const header = ["Datum", "Uhrzeit", ...trackerIds];
    const csvContent = header.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");

    zip.file(`Aasanurme_${channelKey}_${startDate}_bis_${endDate}.csv`, csvContent);
  }

  // 🧷 ZIP bauen und herunterladen
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Aasanurme_Multiple_${startDate}_bis_${endDate}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 🧹 Fenster & Felder zurücksetzen
  document.getElementById("multiDownloadModal").classList.add("hidden");
  document.querySelectorAll("#multiDownloadModal input[type='checkbox']").forEach(cb => cb.checked = false);
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("endDate").removeAttribute("min");
  document.getElementById("endDate").removeAttribute("max");
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
