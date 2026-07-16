// ---------- DADOS ----------
const cardapio = [
  {categoria:'Entradas', itens:[
    {id:1, nome:'Guioza (5un)', preco:24},
    {id:2, nome:'Harumaki (4un)', preco:22},
    {id:3, nome:'Edamame', preco:18},
  ]},
  {categoria:'Sushi', itens:[
    {id:4, nome:'Niguiri salmão (2un)', preco:16},
    {id:5, nome:'Hot roll salmão (8un)', preco:32},
    {id:6, nome:'Uramaki philadelphia (8un)', preco:34},
  ]},
  {categoria:'Sashimi', itens:[
    {id:7, nome:'Sashimi salmão (6un)', preco:38},
    {id:8, nome:'Sashimi atum (6un)', preco:42},
  ]},
  {categoria:'Combinados', itens:[
    {id:9, nome:'Combinado Bahia (20 peças)', preco:89},
    {id:10, nome:'Combinado especial (30 peças)', preco:129},
  ]},
  {categoria:'Bebidas', itens:[
    {id:11, nome:'Água com gás', preco:7},
    {id:12, nome:'Refrigerante lata', preco:8},
    {id:13, nome:'Saquê quente (dose)', preco:22},
  ]},
];

const state = {
  mesas: Array.from({length:10}, (_,i) => ({id:i+1, status:'livre'})),
  mesaAtivaId: null,
  comandaAtual: {},   // {itemId: qtd}
  pedidos: [],        // {id, mesaId, itens:[{nome,qtd}], enviadoEm}
};

// ---------- NAVEGAÇÃO ----------
function mudarView(role){
  document.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('active', b.dataset.role === role));
  document.getElementById('view-garcom').classList.toggle('active', role === 'garcom');
  document.getElementById('view-cozinha').classList.toggle('active', role === 'cozinha');
}

// ---------- MESAS ----------
function renderMesas(){
  const grid = document.getElementById('mesasGrid');
  grid.innerHTML = '';
  state.mesas.forEach(mesa => {
    const card = document.createElement('div');
    card.className = 'mesa-card' + (mesa.id === state.mesaAtivaId ? ' selecionada' : '');
    card.dataset.status = mesa.status;
    card.onclick = () => selecionarMesa(mesa.id);
    const label = mesa.status === 'livre' ? 'Livre' : mesa.status === 'ocupada' ? 'Ocupada' : 'Aguardando';
    card.innerHTML = `
      <div class="mesa-selo">${mesa.id}</div>
      <span class="mesa-status-label">${label}</span>
    `;
    grid.appendChild(card);
  });
}

function selecionarMesa(id){
  state.mesaAtivaId = id;
  state.comandaAtual = {};
  const mesa = state.mesas.find(m => m.id === id);
  if(mesa.status === 'livre') mesa.status = 'ocupada';
  document.getElementById('pedidoBuilder').style.display = 'block';
  document.getElementById('mesaAtivaTitulo').textContent = 'Mesa ' + id;
  document.getElementById('comandaMesaLabel').textContent = 'Mesa ' + id;
  renderMesas();
  renderCardapio();
  renderComanda();
}

// ---------- CARDÁPIO ----------
function renderCardapio(){
  const container = document.getElementById('cardapioContainer');
  container.innerHTML = '';
  cardapio.forEach(cat => {
    const bloco = document.createElement('div');
    bloco.className = 'cardapio-categoria';
    bloco.innerHTML = `<h3>${cat.categoria}</h3>`;
    cat.itens.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <p>${item.nome}</p>
          <span>R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
        </div>
        <button class="add-btn" onclick="adicionarItem(${item.id})">+</button>
      `;
      bloco.appendChild(row);
    });
    container.appendChild(bloco);
  });
}

function buscarItem(id){
  for(const cat of cardapio){
    const item = cat.itens.find(i => i.id === id);
    if(item) return item;
  }
}

function adicionarItem(id){
  state.comandaAtual[id] = (state.comandaAtual[id] || 0) + 1;
  renderComanda();
}

function alterarQtd(id, delta){
  state.comandaAtual[id] = (state.comandaAtual[id] || 0) + delta;
  if(state.comandaAtual[id] <= 0) delete state.comandaAtual[id];
  renderComanda();
}

// ---------- COMANDA ----------
function renderComanda(){
  const lista = document.getElementById('comandaLista');
  const ids = Object.keys(state.comandaAtual);
  const btnEnviar = document.getElementById('btnEnviar');

  if(ids.length === 0){
    lista.innerHTML = '<p class="comanda-empty">Nenhum item adicionado ainda</p>';
    btnEnviar.disabled = true;
  } else {
    lista.innerHTML = '';
    ids.forEach(id => {
      const item = buscarItem(Number(id));
      const qtd = state.comandaAtual[id];
      const row = document.createElement('div');
      row.className = 'comanda-item';
      row.innerHTML = `
        <span>${item.nome}</span>
        <div class="qtd-ctrl">
          <button onclick="alterarQtd(${id}, -1)">−</button>
          <span>${qtd}</span>
          <button onclick="alterarQtd(${id}, 1)">+</button>
        </div>
      `;
      lista.appendChild(row);
    });
    btnEnviar.disabled = false;
  }

  const total = ids.reduce((soma, id) => soma + buscarItem(Number(id)).preco * state.comandaAtual[id], 0);
  document.getElementById('comandaTotal').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

function enviarPedido(){
  const ids = Object.keys(state.comandaAtual);
  if(ids.length === 0) return;

  const itens = ids.map(id => ({
    nome: buscarItem(Number(id)).nome,
    qtd: state.comandaAtual[id],
  }));

  state.pedidos.push({
    id: Date.now(),
    mesaId: state.mesaAtivaId,
    itens,
    enviadoEm: Date.now(),
  });

  const mesa = state.mesas.find(m => m.id === state.mesaAtivaId);
  mesa.status = 'aguardando';

  state.comandaAtual = {};
  state.mesaAtivaId = null;
  document.getElementById('pedidoBuilder').style.display = 'none';
  renderMesas();
  renderPedidosCozinha();
}

// ---------- COZINHA ----------
function renderPedidosCozinha(){
  const grid = document.getElementById('pedidosGrid');
  if(state.pedidos.length === 0){
    grid.innerHTML = `
      <div class="cozinha-vazio" style="grid-column:1/-1;">
        <div class="mesa-selo-grande">寿</div>
        <p>Nenhum pedido no momento</p>
      </div>
    `;
    return;
  }
  grid.innerHTML = '';
  state.pedidos.forEach(pedido => {
    const minutos = Math.max(0, Math.floor((Date.now() - pedido.enviadoEm) / 60000));
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.innerHTML = `
      <div class="pedido-card-header">
        <div class="pedido-mesa-selo"><span>${pedido.mesaId}</span></div>
        <div>
          <p>Mesa ${pedido.mesaId}</p>
          <span>há ${minutos} min</span>
        </div>
      </div>
      <ul class="pedido-itens">
        ${pedido.itens.map(i => `<li><b>${i.qtd}x</b> ${i.nome}</li>`).join('')}
      </ul>
      <button class="btn-pronto" onclick="marcarPronto(${pedido.id})">Marcar como pronto</button>
    `;
    grid.appendChild(card);
  });
}

function marcarPronto(pedidoId){
  const pedido = state.pedidos.find(p => p.id === pedidoId);
  const mesa = state.mesas.find(m => m.id === pedido.mesaId);
  mesa.status = 'livre';
  state.pedidos = state.pedidos.filter(p => p.id !== pedidoId);
  renderMesas();
  renderPedidosCozinha();
}

// atualiza o "há X min" a cada 30s
setInterval(renderPedidosCozinha, 30000);

// ---------- INIT ----------
renderMesas();
renderPedidosCozinha();
