function getStorageKey() {
  if (!currentUserId) return null;
  return `tracksmart-${currentUserId}`;
}

/* ===== MONTH SETUP ===== */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CURRENT_MONTH = MONTHS[new Date().getMonth()] || "Jan";

/* ===== DEFAULT DATA ===== */
let income = 0;
let expense = 0;
let currentUserId = null;

let monthlyData = {
  Jan: createMonth(),
  Feb: createMonth(),
  Mar: createMonth(),
  Apr: createMonth(),
  May: createMonth(),
  Jun: createMonth(),
  Jul: createMonth(),
  Aug: createMonth(),
  Sep: createMonth(),
  Oct: createMonth(),
  Nov: createMonth(),
  Dec: createMonth(),
};

let transactions = [];

/* ===== HELPERS ===== */
function createMonth() {
  return {
    total: 0,
    categories: {
      Entertainment: 0,
      Transportation: 0,
      Food: 0,
      Housing: 0,
      Health: 0,
      Education: 0,
    },
  };
}

/* ===== ELEMENTS (SAFE) ===== */
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const table = document.getElementById("transactions");

const modal = document.getElementById("modal");
if (modal) {
  modal.style.display = "none";
}
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

if (openBtn && modal) {
  openBtn.onclick = () => (modal.style.display = "flex");
}
if (closeBtn && modal) {
  closeBtn.onclick = () => (modal.style.display = "none");
}

const category = document.getElementById("category");
const radios = document.querySelectorAll("input[name='type']");

/* ===== LOAD / SAVE ===== */
function saveToStorage() {}

async function loadFromDatabase() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const response = await fetch(
    "https://tracksmart-production-5ef6.up.railway.app/api/transactions",
    {
      headers: {
        Authorization: token,
      },
    },
  );

  const data = await response.json();
  console.log("Fetched from API:", data.length);
  console.log("Transactions from API:", data);

  income = 0;
  expense = 0;

  transactions = [];

  monthlyData = {
    Jan: createMonth(),
    Feb: createMonth(),
    Mar: createMonth(),
    Apr: createMonth(),
    May: createMonth(),
    Jun: createMonth(),
    Jul: createMonth(),
    Aug: createMonth(),
    Sep: createMonth(),
    Oct: createMonth(),
    Nov: createMonth(),
    Dec: createMonth(),
  };

  data.forEach((t) => {
    const amount = Number(t.amount);

    if (t.type === "income") {
      income += amount;
    } else {
      expense += amount;
    }

    transactions.push({
      id: t.id,
      type: t.type,
      desc: t.description,
      amount,
      category: t.category,
      date: t.transaction_date,
    });

    const month = MONTHS[new Date(t.transaction_date).getMonth()];

    if (t.type === "expense" && monthlyData[month]) {
      monthlyData[month].total += amount;

      if (monthlyData[month].categories[t.category] !== undefined) {
        monthlyData[month].categories[t.category] += amount;
      }
    }
  });
  console.log("Transactions array:", transactions.length);

  updateUI();
}

/* ===== CATEGORY SELECT (SAFE) ===== */
function loadCategory(type) {
  if (!category) return;

  category.innerHTML = "";

  if (type === "income") {
    const o = document.createElement("option");
    o.textContent = "Income";
    category.appendChild(o);
    return;
  }

  const def = document.createElement("option");
  def.textContent = "Select a category";
  def.disabled = true;
  def.selected = true;
  category.appendChild(def);

  Object.keys(monthlyData[CURRENT_MONTH].categories).forEach((c) => {
    const o = document.createElement("option");
    o.textContent = c;
    category.appendChild(o);
  });
}

if (category) {
  loadCategory("expense");
  radios.forEach((r) => (r.onchange = () => loadCategory(r.value)));
}

/* ===== CHARTS (SAFE) ===== */
let barChart = null;
let pieChart = null;

const barCanvas = document.getElementById("barChart");
if (barCanvas) {
  barChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [{ data: MONTHS.map((m) => monthlyData[m].total) }],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

const pieCanvas = document.getElementById("pieChart");
if (pieCanvas) {
  pieChart = new Chart(pieCanvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(monthlyData[CURRENT_MONTH].categories),
      datasets: [
        {
          data: Object.values(monthlyData[CURRENT_MONTH].categories),
        },
      ],
    },
    options: { cutout: "70%" },
  });
}

/* ===== UPDATE UI ===== */
function updateUI() {
  console.log("Rendering rows:", transactions.length);
  if (incomeEl) incomeEl.textContent = `$${income.toFixed(2)}`;
  if (expenseEl) expenseEl.textContent = `$${expense.toFixed(2)}`;
  if (balanceEl) balanceEl.textContent = `$${(income - expense).toFixed(2)}`;

  if (barChart) {
    barChart.data.datasets[0].data = MONTHS.map((m) => monthlyData[m].total);
    barChart.update();
  }

  if (pieChart) {
    pieChart.data.datasets[0].data = Object.values(
      monthlyData[CURRENT_MONTH].categories,
    );
    pieChart.update();
  }

  if (!table) return;
  table.innerHTML = "";
  transactions.forEach((t) => addRow(t, false));
}

/* ===== ADD TABLE ROW ===== */
function addRow(t, save = true) {
  if (!table) return;

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${t.desc}</td>
    <td>${t.category}</td>
    <td>${t.date}</td>
    <td class="right ${t.type === "income" ? "green" : "red"}">
      ${t.type === "income" ? "+" : "-"}$${t.amount.toFixed(2)}
    </td>
    <td>
      <button class="delete-btn"
              data-id="${t.id}">
        Delete
      </button>
    </td>
  `;

  const deleteBtn = tr.querySelector(".delete-btn");

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Delete this transaction?")) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
      `https://tracksmart-production-5ef6.up.railway.app/api/transactions/${t.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      },
    );

    console.log(await response.text());

    await loadFromDatabase();
  });

  table.prepend(tr);

  if (save) {
    transactions.unshift(t);
  }
}

/* ===== ADD TRANSACTION (SAFE) ===== */
const addBtn = document.getElementById("addTransaction");
if (addBtn) {
  addBtn.onclick = async () => {
    const type = document.querySelector("input[name='type']:checked").value;
    const desc = document.getElementById("desc").value.trim();
    const amt = +document.getElementById("amount").value;

    if (!desc || !amt) return alert("Fill all fields");

    const t = {
      type,
      desc,
      amount: amt,
      category: category?.value || "Income",
      date: new Date().toDateString(),
      month: CURRENT_MONTH,
    };

    if (type === "income") income += amt;
    else {
      expense += amt;
      monthlyData[CURRENT_MONTH].total += amt;
      monthlyData[CURRENT_MONTH].categories[t.category] += amt;
    }

    const token = localStorage.getItem("token");

    await fetch(
      "https://tracksmart-production-5ef6.up.railway.app/api/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          type: t.type,
          description: t.desc,
          category: t.category,
          amount: t.amount,
          transaction_date: new Date().toISOString().split("T")[0],
        }),
      },
    );

        await loadFromDatabase();

    if (modal) {
      modal.style.display = "none";
    }

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
  };
}

loadFromDatabase();
