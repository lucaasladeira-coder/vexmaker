// Import modern Vite CSS bundling
import './style.css';

// CORE STATE
let orders = [];
let orderToDeleteId = null;

// LOCAL SYSTEM TIME REFERENCE FROM METADATA: 2026-05-17
const CURRENT_SYSTEM_DATE = new Date("2026-05-17T00:00:00");

// DEMO DATA SEEDING (Used if localStorage has no data to display rich premium look instantly)
const demoOrders = [
  {
    id: "demo-1",
    clientName: "Mariana Costa",
    printDescription: "Action Figure Cyberpunk\nAltura 25cm, alta resolução, 0.12mm camada",
    deadline: "2026-05-16", // Passed yesterday
    observations: "Utilizar resina cinza premium. Cuidado com suportes finos nos dedos.",
    status: "nao-iniciado",
    createdAt: "2026-05-15T10:00:00.000Z"
  },
  {
    id: "demo-2",
    clientName: "Roberto Mendes",
    printDescription: "Engrenagem Helicoidal de Redução\nImpressão com 100% de preenchimento (infill)",
    deadline: "2026-05-19", // Future
    observations: "Imprimir em filamento PETG preto para maior resistência mecânica. Parede de 1.2mm.",
    status: "em-producao",
    createdAt: "2026-05-16T14:30:00.000Z"
  },
  {
    id: "demo-3",
    clientName: "Amanda Souza",
    printDescription: "Vaso de Decoração Espiral\nAltura 15cm, bico de 0.8mm",
    deadline: "2026-05-22", // Future
    observations: "Modo vaso (spiralize outer contour). PLA Silk Dourado.",
    status: "concluido",
    createdAt: "2026-05-14T09:15:00.000Z"
  }
];

// DOM ELEMENTS
const orderForm = document.getElementById('order-form');
const inputClient = document.getElementById('client-name');
const inputPrint = document.getElementById('print-description');
const inputDeadline = document.getElementById('delivery-deadline');
const inputObs = document.getElementById('general-obs');

// Column Card containers
const listNaoIniciado = document.getElementById('list-nao-iniciado');
const listEmProducao = document.getElementById('list-em-producao');
const listConcluido = document.getElementById('list-concluido');

// Statistics UI Counters
const countNaoIniciado = document.getElementById('count-nao-iniciado');
const countEmProducao = document.getElementById('count-em-producao');
const countConcluido = document.getElementById('count-concluido');

const hdrNaoIniciado = document.getElementById('hdr-nao-iniciado');
const hdrEmProducao = document.getElementById('hdr-em-producao');
const hdrConcluido = document.getElementById('hdr-concluido');

// Deletion Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteModalText = document.getElementById('delete-modal-text');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  // Fetch from local storage
  const stored = localStorage.getItem('vexmaker_orders');
  if (stored) {
    orders = JSON.parse(stored);
  } else {
    orders = [...demoOrders];
    saveOrders();
  }

  // Add input change listeners to remove error state dynamically
  [inputClient, inputPrint, inputDeadline].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim() !== '') {
        input.classList.remove('invalid-field');
        const errorMsg = input.parentElement.querySelector('.error-message');
        if (errorMsg) errorMsg.style.display = 'none';
      }
    });
  });

  renderApp();
});

// STORAGE HANDLERS
function saveOrders() {
  localStorage.setItem('vexmaker_orders', JSON.stringify(orders));
}

// STATE CONTROLLERS
function addOrder(clientName, printDescription, deadline, observations) {
  const newOrder = {
    id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    clientName,
    printDescription,
    deadline,
    observations,
    status: 'nao-iniciado',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveOrders();
  renderApp();
  showToast('Novo pedido criado com sucesso!', 'success');
}

// Attach state mutators to window object for inline HTML event listener compatibility
window.updateOrderStatus = function(id, newStatus) {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = newStatus;
    saveOrders();
    renderApp();
    showToast(`Pedido de ${order.clientName} movido para "${getStatusLabel(newStatus)}"!`, 'info');
  }
};

window.confirmDeleteOrder = function(id) {
  const order = orders.find(o => o.id === id);
  if (order) {
    orderToDeleteId = id;
    deleteModalText.innerHTML = `Tem certeza que deseja excluir este pedido?<br><br><span style="font-size: 13px; color: #a0a0a0; font-weight: 500;">Cliente: ${escapeHtml(order.clientName)}<br>Peça: ${escapeHtml(order.printDescription.split('\n')[0])}</span>`;
    deleteModal.classList.add('active');
  }
};

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  orderToDeleteId = null;
}

// Modal Events
btnCancelDelete.addEventListener('click', closeDeleteModal);
btnConfirmDelete.addEventListener('click', () => {
  if (orderToDeleteId) {
    const order = orders.find(o => o.id === orderToDeleteId);
    orders = orders.filter(o => o.id !== orderToDeleteId);
    saveOrders();
    renderApp();
    showToast(`Pedido de ${order ? order.clientName : ''} excluído com sucesso!`, 'danger');
    closeDeleteModal();
  }
});

// Close modal clicking outside
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    closeDeleteModal();
  }
});

// UTILITIES & FORMATTERS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDateBr(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusLabel(status) {
  switch (status) {
    case 'nao-iniciado': return 'Não Iniciado';
    case 'em-producao': return 'Em Produção';
    case 'concluido': return 'Concluído';
    default: return status;
  }
}

// Date Overdue Checker relative to 2026-05-17
function isOverdue(deadlineStr, status) {
  if (status === 'concluido') return false;
  const deadlineDate = new Date(deadlineStr + 'T00:00:00');
  return deadlineDate < CURRENT_SYSTEM_DATE;
}

// RENDER FUNCTIONS
function renderApp() {
  // 1. Separate & Sort orders (closest deadline date first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.deadline + 'T00:00:00');
    const dateB = new Date(b.deadline + 'T00:00:00');
    // Closest date first
    if (dateA - dateB !== 0) return dateA - dateB;
    // Secondary sort: creation timestamp
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const naoIniciadoList = sortedOrders.filter(o => o.status === 'nao-iniciado');
  const emProducaoList = sortedOrders.filter(o => o.status === 'em-producao');
  const concluidoList = sortedOrders.filter(o => o.status === 'concluido');

  // 2. Update stats indicators (Columns + Header)
  const totalNaoIniciado = naoIniciadoList.length;
  const totalEmProducao = emProducaoList.length;
  const totalConcluido = concluidoList.length;

  countNaoIniciado.textContent = totalNaoIniciado;
  countEmProducao.textContent = totalEmProducao;
  countConcluido.textContent = totalConcluido;

  hdrNaoIniciado.textContent = totalNaoIniciado;
  hdrEmProducao.textContent = totalEmProducao;
  hdrConcluido.textContent = totalConcluido;

  // 3. Render each column list
  renderList(listNaoIniciado, naoIniciadoList, 'nao-iniciado');
  renderList(listEmProducao, emProducaoList, 'em-producao');
  renderList(listConcluido, concluidoList, 'concluido');
}

function renderList(container, list, colStatus) {
  container.innerHTML = '';
  
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-message">Nenhum pedido aqui ainda</div>`;
    return;
  }

  list.forEach(order => {
    const isOrderOverdue = isOverdue(order.deadline, order.status);
    const cardClass = isOrderOverdue ? 'order-card overdue-glow' : 'order-card';
    
    let statusBadgeClass = '';
    if (order.status === 'nao-iniciado') statusBadgeClass = 'badge-red';
    else if (order.status === 'em-producao') statusBadgeClass = 'badge-yellow';
    else if (order.status === 'concluido') statusBadgeClass = 'badge-green';

    // Custom action button logic
    let actionButtonHtml = '';
    if (order.status === 'nao-iniciado') {
      actionButtonHtml = `
        <button class="btn-action btn-start" onclick="updateOrderStatus('${order.id}', 'em-producao')">
          <span>▶ Iniciar Produção</span>
        </button>
      `;
    } else if (order.status === 'em-producao') {
      actionButtonHtml = `
        <button class="btn-action btn-complete" onclick="updateOrderStatus('${order.id}', 'concluido')">
          <span>✅ Concluir Pedido</span>
        </button>
      `;
    } else {
      actionButtonHtml = `
        <div class="badge-finalized">Pedido Finalizado</div>
      `;
    }

    // Observations HTML section (only shown if filled)
    const obsHtml = order.observations.trim() 
      ? `<div class="card-obs">
          <span style="font-size: 14px; margin-right: 4px; line-height: 1;">💬</span>
          <span class="obs-text">${escapeHtml(order.observations)}</span>
         </div>`
      : '';

    // Overdue warning and calendar icon block
    let dateRowHtml = '';
    if (isOrderOverdue) {
      dateRowHtml = `
        <div class="card-date-row overdue-warning">
          <span>⚠️</span>
          <span>Prazo: ${formatDateBr(order.deadline)} (Atrasado)</span>
        </div>
      `;
    } else {
      dateRowHtml = `
        <div class="card-date-row">
          <!-- SVG Calendar -->
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM19 7H5V6H19V7Z"/>
          </svg>
          <span>Prazo: ${formatDateBr(order.deadline)}</span>
        </div>
      `;
    }

    const cardHtml = `
      <div class="${cardClass}" data-id="${order.id}">
        <!-- Badge Top Right -->
        <div class="card-badge-container">
          <span class="status-badge ${statusBadgeClass}">${getStatusLabel(order.status)}</span>
        </div>

        <!-- Header with Client Name and what to print -->
        <div class="card-header">
          <h4 class="client-name">${escapeHtml(order.clientName)}</h4>
          <p class="print-description">${escapeHtml(order.printDescription)}</p>
        </div>

        <!-- Date Deadline Row -->
        ${dateRowHtml}

        <!-- General Observations (Conditional) -->
        ${obsHtml}

        <hr class="card-divider">

        <!-- Card Actions -->
        <div class="card-footer">
          ${actionButtonHtml}
          <button class="btn-delete" onclick="confirmDeleteOrder('${order.id}')" title="Excluir Pedido">
            <!-- SVG Trash -->
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

// FORM SUBMISSION & VALIDATION
orderForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nameVal = inputClient.value.trim();
  const printVal = inputPrint.value.trim();
  const dateVal = inputDeadline.value.trim();
  const obsVal = inputObs.value.trim();

  let isFormValid = true;
  let firstInvalidInput = null;

  // Validate Client Name
  if (nameVal === '') {
    triggerValidationFailure(inputClient);
    isFormValid = false;
    if (!firstInvalidInput) firstInvalidInput = inputClient;
  } else {
    clearValidationState(inputClient);
  }

  // Validate What to print
  if (printVal === '') {
    triggerValidationFailure(inputPrint);
    isFormValid = false;
    if (!firstInvalidInput) firstInvalidInput = inputPrint;
  } else {
    clearValidationState(inputPrint);
  }

  // Validate Deadline Date
  if (dateVal === '') {
    triggerValidationFailure(inputDeadline);
    isFormValid = false;
    if (!firstInvalidInput) firstInvalidInput = inputDeadline;
  } else {
    clearValidationState(inputDeadline);
  }

  if (!isFormValid) {
    if (firstInvalidInput) firstInvalidInput.focus();
    showToast('Preencha todos os campos obrigatórios!', 'danger');
    return;
  }

  // Success Add order
  addOrder(nameVal, printVal, dateVal, obsVal);

  // Reset Form fields
  orderForm.reset();
});

// Helper functions for shaking and validation states
function triggerValidationFailure(inputElement) {
  inputElement.classList.add('invalid-field');
  const errorMsg = inputElement.parentElement.querySelector('.error-message');
  if (errorMsg) errorMsg.style.display = 'block';

  // Shake animation trigger
  inputElement.classList.remove('shake');
  void inputElement.offsetWidth; // Reflow reset hack
  inputElement.classList.add('shake');
}

function clearValidationState(inputElement) {
  inputElement.classList.remove('invalid-field');
  inputElement.classList.remove('shake');
  const errorMsg = inputElement.parentElement.querySelector('.error-message');
  if (errorMsg) errorMsg.style.display = 'none';
}

// TOAST SYSTEM IMPLEMENTATION
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Select fitting SVG for toast
  let svgIcon = '';
  if (type === 'success') {
    svgIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>`;
  } else if (type === 'warning' || type === 'danger') {
    svgIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/></svg>`;
  } else {
    svgIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V11H13V13ZM13 9H11V7H13V9Z"/></svg>`;
  }

  toast.innerHTML = `
    ${svgIcon}
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Slide in transition
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Slide out and remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
