let chart;
const chartData = {};
let selectedTrackers = {};
let selectedDate = new Date(); // nimmt immer das aktuelle Datum

function toggleChannels(element) {
  const list = element.nextElementSibling;
  list.classList.toggle("hidden");
  const icon = element.querySelector(".toggle-icon");
  icon.textContent = list.classList.contains("hidden") ? "+" : "-";
}

function randomData() {
  const data = [];
  for (let i = 0; i <= 24; i++) {
    data.push({ x: `${i.toString().padStart(2, "0")}:00`, y: Math.random() * 4 });
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
      animation: false,
      layout: {
        padding: {
          top: 25,
          bottom: 50
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
          max: 4,
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
  chart.update();
  updateInfoOutput();
  document.querySelectorAll(".channel").forEach(el => el.classList.remove("active"));
}

function downloadChart() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("lineChart").toDataURL();
  link.click();
}

function updateInfoOutput() {
  const container = document.querySelector(".info-output");
  const allValues = Object.values(chartData).flatMap(ds => ds.data.map(p => ({ value: p.y, label: ds.label })));
  if (allValues.length === 0) {
    container.innerHTML = "";
    return;
  }

  const max = allValues.reduce((a, b) => a.value > b.value ? a : b);
  const min = allValues.reduce((a, b) => a.value < b.value ? a : b);

  container.innerHTML = `
    <div>Höchster AVG: ${max.value.toFixed(2)} - ${max.label}</div>
    <div>Niedrigster AVG: ${min.value.toFixed(2)} - ${min.label}</div>
  `;
}

// CHANNEL-KLICK
document.querySelectorAll(".channel").forEach(el => {
  el.addEventListener("click", e => {
    const label = el.dataset.id;
    const [anlage, channel] = label.split("-");
    openTrackerPopup(el, anlage, channel);
  });
});

// 1D / 1W BUTTON-WECHSEL
document.querySelectorAll(".resolution-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const resolution = btn.getAttribute("data-resolution");

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
  fetch(`http://localhost:5000/api/motor_current_max?date=${date.toISOString().slice(0, 10)}`)
    .then(res => res.json())
    .then(data => {
      removeAll(); // vorheriges Chart leeren

      const fixedLabels = Array.from({ length: 25 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

      Object.keys(data).forEach(key => {
        const values = data[key];
      
        const dataset = {
          label: key,
          data: fixedLabels.map((label, i) => ({
            x: label,
            y: values[i] ?? null  // fallback wenn Wert fehlt
          })),
          borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          borderWidth: 2,
          fill: false
        };
      
        chart.data.datasets.push(dataset);
      });


      chart.update();
      updateInfoOutput();
    })
    .catch(err => {
      console.error("Fehler beim Laden:", err);
    });

  updateDateDisplay();
  populateDateSelectors();
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
    selectedDate = new Date(year, month, day);
    loadDataForDate(selectedDate);
  });
});

// Pfeiltasten < >
document.querySelector(".left-controls button:nth-child(1)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  loadDataForDate(selectedDate);
});

document.querySelector(".left-controls button:nth-child(3)").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
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
  const popup = document.querySelector(".tracker-popup");
  const alreadyOpen = !popup.classList.contains("hidden");
  const currentLeft = parseInt(popup.style.left, 10);
  const currentTop = parseInt(popup.style.top, 10);
  const rect = elem.getBoundingClientRect();
  const targetLeft = Math.round(rect.left + window.scrollX);
  const targetTop = Math.round(rect.bottom + window.scrollY);

  if (alreadyOpen && currentLeft === targetLeft && currentTop === targetTop) {
    popup.classList.add("hidden");
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

function addSelectedTrackers(btn) {
  const popup = btn.closest(".tracker-popup");
  const checkboxes = popup.querySelectorAll("input[type=checkbox]");

  checkboxes.forEach(cb => {
    if (cb.checked) {
      const label = cb.dataset.tracker;
      if (!chartData[label]) {
        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
        const dataset = {
          label: label,
          data: randomData(),
          borderColor: color,
          borderWidth: 2,
          fill: false
        };
        chart.data.datasets.push(dataset);
        chartData[label] = dataset;
      }
    }
  });

  chart.update();
  updateInfoOutput();

  document.querySelectorAll(".tracker-toggle").forEach(t => t.textContent = ">");
  checkboxes.forEach(cb => {
    cb.checked = false;
    selectedTrackers[cb.dataset.tracker] = false;
  });

  closeAllPopups();
}
