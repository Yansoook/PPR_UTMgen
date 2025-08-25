// Массив для хранения истории ссылок
let linkHistory = [];

// Загружаем историю при старте
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('utmLinks');
    if (saved) {
      linkHistory = JSON.parse(saved);
    } else {
      linkHistory = [];
    }
  } catch (e) {
    console.error('Ошибка чтения из localStorage:', e);
    linkHistory = [];
  }
}

// Сохраняем историю в localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem('utmLinks', JSON.stringify(linkHistory));
  } catch (e) {
    console.error('Ошибка сохранения в localStorage:', e);
  }
}

// Переключение вкладок
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  
  const content = document.getElementById(tabName);
  const tab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
  
  if (content) content.classList.add('active');
  if (tab) tab.classList.add('active');

  // При переходе на вкладку "История" — обновляем список
  if (tabName === 'history') {
    renderHistory();
  }
}

// Генерация UTM-ссылки
function generateUTM() {
  const urlInput = document.getElementById("urlInput").value.trim();
  const source = document.getElementById("source").value; // например, banner, email
  const campaign = document.getElementById("campaign").value.trim();

  if (!urlInput) {
    alert("Введите ссылку!");
    return;
  }
  if (!campaign) {
    alert("Введите цель (utm_campaign)");
    return;
  }

  try {
    const url = new URL(urlInput);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", campaign);
    url.searchParams.set("utm_content", "1");

    const finalUrl = url.toString();
    document.getElementById("result").textContent = finalUrl;
    document.getElementById("result").style.display = "block";
    document.getElementById("copyBtn").disabled = false;

    // Сохраняем в историю
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('ru-RU'),
      url: finalUrl,
      source,
      campaign
    };
    linkHistory.push(entry);
    saveToLocalStorage();

  } catch (e) {
    alert("Некорректная ссылка. Проверьте формат.");
  }
}

// Копирование в буфер обмена
function copyToClipboard() {
  const result = document.getElementById("result").textContent;
  navigator.clipboard.writeText(result).then(() => {
    alert("Скопировано в буфер!");
  }).catch(err => {
    console.error("Ошибка копирования: ", err);
    alert("Не удалось скопировать. Попробуйте вручную.");
  });
}

// Отображение истории
function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  if (linkHistory.length === 0) {
    list.innerHTML = "<p>История пуста</p>";
    document.getElementById("bulkActions").style.display = "none";
    return;
  }

  list.innerHTML = "";
  [...linkHistory].reverse().forEach(entry => {
    const div = document.createElement("div");
    div.className = "link-item";
    div.innerHTML = `
      <div class="link-info">
        <strong>[${entry.timestamp}]</strong><br>
        <small><strong>Ссылка:</strong> ${entry.url}</small><br>
        <small><strong>Канал:</strong> ${entry.source} | 
               <strong>Цель:</strong> ${entry.campaign}</small>
      </div>
      <input type="checkbox" class="link-checkbox" data-id="${entry.id}" onchange="toggleBulkActions()">
    `;
    list.appendChild(div);
  });

  document.getElementById("bulkActions").style.display = "none";
}

// Показать/скрыть панель действий при выборе чекбоксов
function toggleBulkActions() {
  const checked = document.querySelectorAll('.link-checkbox:checked');
  const actions = document.getElementById("bulkActions");
  actions.style.display = checked.length > 0 ? "flex" : "none";
}

// Выбрать все чекбоксы
function selectAll() {
  document.querySelectorAll('.link-checkbox').forEach(cb => {
    cb.checked = true;
  });
  toggleBulkActions();
}

// Снять все чекбоксы
function deselectAll() {
  document.querySelectorAll('.link-checkbox').forEach(cb => {
    cb.checked = false;
  });
  toggleBulkActions();
}

// Удалить выбранные ссылки
function deleteSelected() {
  const checked = document.querySelectorAll('.link-checkbox:checked');
  if (checked.length === 0) return;

  if (!confirm(`Удалить ${checked.length} выбранную(ых) ссылку(и)?`)) {
    return;
  }

  const selectedIds = Array.from(checked).map(cb => cb.dataset.id);
  linkHistory = linkHistory.filter(link => !selectedIds.includes(link.id));
  saveToLocalStorage();
  renderHistory();
  document.getElementById("bulkActions").style.display = "none";
}

// Скачать выбранные ссылки в .txt
function downloadSelected() {
  const checked = document.querySelectorAll('.link-checkbox:checked');
  if (checked.length === 0) return;

  const selectedIds = Array.from(checked).map(cb => cb.dataset.id);
  const selectedLinks = linkHistory.filter(link => selectedIds.includes(link.id));

  if (selectedLinks.length === 0) return;

  let text = "=== Сгенерированные UTM-ссылки ===\n\n";
  selectedLinks.forEach(entry => {
    text += `[Дата создания: ${entry.timestamp}]\n`;
    text += `Ссылка: ${entry.url}\n`;
    text += `Канал: ${entry.source}\n`;
    text += `Цель: ${entry.campaign}\n`;
    text += `----------------------------------------\n`;
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `utm_selected_${formatDate(new Date())}.txt`;
  link.click();
}

// Вспомогательная функция: формат даты для имени файла
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// При загрузке страницы
window.onload = function () {
  loadFromLocalStorage();
  if (document.getElementById('history') && document.getElementById('history').classList.contains('active')) {
    renderHistory();
  }
};
