const STORAGE_KEY = 'duks-bar-v1';

const state = {
  categorias: [],
  produtos: [],
  lancamentos: [],
  drinks: [],
  cardapio: [],
};

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(state, data);
    } catch (e) {}
  }
  if (!Array.isArray(state.cardapio)) state.cardapio = [];
  if (state.categorias.length === 0) {
    state.categorias = [
      { id: id(), nome: 'Bebidas Alcoólicas' },
      { id: id(), nome: 'Energéticos' },
      { id: id(), nome: 'Frutas' },
      { id: id(), nome: 'Insumos' },
    ];
    save();
  }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function brl(v) { return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function num(v) { return Number(v) || 0; }

// TABS
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    renderAll();
  });
});

// MODAL helpers
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => b.closest('.modal').classList.remove('open'));
});
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// CATEGORIAS
document.getElementById('btnAddCategoria').addEventListener('click', () => {
  const input = document.getElementById('novaCategoria');
  const nome = input.value.trim();
  if (!nome) return;
  if (state.categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    alert('Categoria já existe.');
    return;
  }
  state.categorias.push({ id: id(), nome });
  input.value = '';
  save();
  renderAll();
});

function renderCategorias() {
  const ul = document.getElementById('listaCategorias');
  ul.innerHTML = '';
  state.categorias.forEach(c => {
    const div = document.createElement('div');
    div.className = 'chip';
    div.innerHTML = `${c.nome} <button title="Excluir">×</button>`;
    div.querySelector('button').addEventListener('click', () => {
      const usados = state.produtos.filter(p => p.categoriaId === c.id).length;
      if (usados > 0) {
        if (!confirm(`Existem ${usados} produto(s) nessa categoria. Excluir mesmo assim?`)) return;
        state.produtos = state.produtos.filter(p => p.categoriaId !== c.id);
      }
      state.categorias = state.categorias.filter(x => x.id !== c.id);
      save();
      renderAll();
    });
    ul.appendChild(div);
  });
  // popular selects
  const sels = [document.getElementById('filtroCategoria'), document.getElementById('prodCategoria')];
  sels.forEach((sel, i) => {
    const keep = sel.value;
    sel.innerHTML = i === 0 ? '<option value="">Todas as categorias</option>' : '';
    state.categorias.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.nome;
      sel.appendChild(o);
    });
    sel.value = keep;
  });
}

// PRODUTOS
const modalProd = document.getElementById('modalProduto');
document.getElementById('btnNovoProduto').addEventListener('click', () => abrirProduto());

function abrirProduto(prod) {
  document.getElementById('tituloModalProd').textContent = prod ? 'Editar produto' : 'Novo produto';
  document.getElementById('prodId').value = prod?.id || '';
  document.getElementById('prodNome').value = prod?.nome || '';
  document.getElementById('prodCategoria').value = prod?.categoriaId || (state.categorias[0]?.id || '');
  document.getElementById('prodUnidade').value = prod?.unidade || 'un';
  document.getElementById('prodMinimo').value = prod?.minimo ?? 0;
  document.getElementById('prodQtd').value = prod?.qtd ?? 0;
  document.getElementById('prodCusto').value = prod?.custo ?? 0;
  document.getElementById('prodVenda').value = prod?.venda ?? 0;
  modalProd.classList.add('open');
}

document.getElementById('formProduto').addEventListener('submit', e => {
  e.preventDefault();
  const pid = document.getElementById('prodId').value;
  const data = {
    nome: document.getElementById('prodNome').value.trim(),
    categoriaId: document.getElementById('prodCategoria').value,
    unidade: document.getElementById('prodUnidade').value,
    minimo: num(document.getElementById('prodMinimo').value),
    qtd: num(document.getElementById('prodQtd').value),
    custo: num(document.getElementById('prodCusto').value),
    venda: num(document.getElementById('prodVenda').value),
  };
  if (!data.nome || !data.categoriaId) return;
  if (pid) {
    const i = state.produtos.findIndex(p => p.id === pid);
    state.produtos[i] = { ...state.produtos[i], ...data };
  } else {
    state.produtos.push({ id: id(), ...data });
  }
  save();
  modalProd.classList.remove('open');
  renderAll();
});

document.getElementById('buscaProduto').addEventListener('input', renderProdutos);
document.getElementById('filtroCategoria').addEventListener('change', renderProdutos);

function renderProdutos() {
  const busca = document.getElementById('buscaProduto').value.toLowerCase();
  const filtro = document.getElementById('filtroCategoria').value;
  const tbody = document.getElementById('tblProdutos');
  tbody.innerHTML = '';
  const lista = state.produtos.filter(p =>
    (!filtro || p.categoriaId === filtro) &&
    (!busca || p.nome.toLowerCase().includes(busca))
  );
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Nenhum produto cadastrado.</td></tr>`;
    return;
  }
  lista.forEach(p => {
    const cat = state.categorias.find(c => c.id === p.categoriaId)?.nome || '-';
    const lucro = p.venda - p.custo;
    const margem = p.custo > 0 ? ((lucro / p.custo) * 100).toFixed(0) : '—';
    const baixo = p.qtd <= p.minimo;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${cat}</td>
      <td>${p.unidade}</td>
      <td class="${baixo ? 'alert' : ''}">${p.qtd}</td>
      <td>${brl(p.custo)}</td>
      <td>${brl(p.venda)}</td>
      <td>${brl(lucro)} <small style="color:var(--muted)">(${margem}%)</small></td>
      <td>
        <button class="btn ghost small" data-edit="${p.id}">Editar</button>
        <button class="btn danger small" data-del="${p.id}">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => abrirProduto(state.produtos.find(p => p.id === b.dataset.edit)))
  );
  tbody.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => {
      if (!confirm('Excluir este produto?')) return;
      state.produtos = state.produtos.filter(p => p.id !== b.dataset.del);
      save();
      renderAll();
    })
  );
}

// LANÇAMENTOS
const modalLanc = document.getElementById('modalLanc');
document.getElementById('btnNovoLanc').addEventListener('click', () => {
  if (state.produtos.length === 0) {
    alert('Cadastre um produto antes de fazer lançamentos.');
    return;
  }
  const sel = document.getElementById('lancProduto');
  sel.innerHTML = '';
  state.produtos.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.nome + ' (' + p.qtd + ' ' + p.unidade + ')';
    sel.appendChild(o);
  });
  document.getElementById('lancTipo').value = 'entrada';
  document.getElementById('lancQtd').value = '';
  document.getElementById('lancValor').value = '';
  document.getElementById('lancObs').value = '';
  modalLanc.classList.add('open');
});

document.getElementById('formLanc').addEventListener('submit', e => {
  e.preventDefault();
  const prodId = document.getElementById('lancProduto').value;
  const tipo = document.getElementById('lancTipo').value;
  const qtd = num(document.getElementById('lancQtd').value);
  const valor = num(document.getElementById('lancValor').value);
  const obs = document.getElementById('lancObs').value.trim();
  if (qtd <= 0) return alert('Quantidade inválida.');
  const prod = state.produtos.find(p => p.id === prodId);
  if (!prod) return;
  if (tipo === 'saida' && qtd > prod.qtd) {
    if (!confirm(`Estoque atual é ${prod.qtd}. Lançar mesmo assim?`)) return;
  }
  prod.qtd = tipo === 'entrada' ? prod.qtd + qtd : prod.qtd - qtd;
  state.lancamentos.unshift({
    id: id(), data: new Date().toISOString(), produtoId: prodId,
    tipo, qtd, valor, obs,
  });
  save();
  modalLanc.classList.remove('open');
  renderAll();
});

document.getElementById('filtroTipo').addEventListener('change', renderLancamentos);

function renderLancamentos() {
  const filtro = document.getElementById('filtroTipo').value;
  const tbody = document.getElementById('tblLanc');
  tbody.innerHTML = '';
  const lista = state.lancamentos.filter(l => !filtro || l.tipo === filtro);
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Nenhum lançamento.</td></tr>`;
    return;
  }
  lista.forEach(l => {
    const prod = state.produtos.find(p => p.id === l.produtoId);
    const d = new Date(l.data);
    const dataStr = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dataStr}</td>
      <td><span class="tag ${l.tipo}">${l.tipo}</span></td>
      <td>${prod?.nome || '(removido)'}</td>
      <td>${l.qtd}</td>
      <td>${brl(l.valor)}</td>
      <td>${brl(l.valor * l.qtd)}</td>
      <td>${l.obs || '-'}</td>
      <td><button class="btn danger small" data-del="${l.id}">×</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => {
      if (!confirm('Excluir este lançamento? O estoque NÃO será revertido automaticamente.')) return;
      state.lancamentos = state.lancamentos.filter(l => l.id !== b.dataset.del);
      save();
      renderAll();
    })
  );
}

// DASHBOARD
function renderDashboard() {
  document.getElementById('kpiProdutos').textContent = state.produtos.length;
  const itens = state.produtos.reduce((s, p) => s + p.qtd, 0);
  const custo = state.produtos.reduce((s, p) => s + p.qtd * p.custo, 0);
  const venda = state.produtos.reduce((s, p) => s + p.qtd * p.venda, 0);
  document.getElementById('kpiItens').textContent = itens.toLocaleString('pt-BR');
  document.getElementById('kpiCusto').textContent = brl(custo);
  document.getElementById('kpiVenda').textContent = brl(venda);
  document.getElementById('kpiLucro').textContent = brl(venda - custo);

  const baixo = state.produtos.filter(p => p.qtd <= p.minimo);
  const tbody = document.getElementById('tblBaixo');
  tbody.innerHTML = '';
  if (baixo.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Tudo em ordem.</td></tr>`;
    return;
  }
  baixo.forEach(p => {
    const cat = state.categorias.find(c => c.id === p.categoriaId)?.nome || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.nome}</td><td>${cat}</td><td class="alert">${p.qtd}</td><td>${p.minimo}</td>`;
    tbody.appendChild(tr);
  });
}

// DRINKS
const modalDrink = document.getElementById('modalDrink');
let ingTmp = [];

let drinkFotoData = '';
document.getElementById('drinkFoto').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    drinkFotoData = ev.target.result;
    const prev = document.getElementById('drinkFotoPrev');
    prev.src = drinkFotoData; prev.style.display = 'block';
    document.getElementById('btnRemoverDrinkFoto').style.display = 'inline-block';
  };
  r.readAsDataURL(f);
});
document.getElementById('btnRemoverDrinkFoto').addEventListener('click', () => {
  drinkFotoData = '';
  document.getElementById('drinkFoto').value = '';
  document.getElementById('drinkFotoPrev').style.display = 'none';
  document.getElementById('btnRemoverDrinkFoto').style.display = 'none';
});
document.getElementById('btnNovoDrink').addEventListener('click', () => abrirDrink());
document.getElementById('btnAddIng').addEventListener('click', () => {
  ingTmp.push({ nome: '', qtd: 0, unidade: 'ml', valorUnit: 0 });
  renderIngredientes();
});
document.getElementById('drinkPreco').addEventListener('input', atualizarDrinkTotais);
document.getElementById('buscaDrink').addEventListener('input', renderDrinks);

function abrirDrink(drink) {
  document.getElementById('tituloModalDrink').textContent = drink ? 'Editar drink' : 'Novo drink';
  document.getElementById('drinkId').value = drink?.id || '';
  document.getElementById('drinkNome').value = drink?.nome || '';
  document.getElementById('drinkDesc').value = drink?.desc || '';
  document.getElementById('drinkPreco').value = drink?.preco ?? 0;
  drinkFotoData = drink?.foto || '';
  const dprev = document.getElementById('drinkFotoPrev');
  if (drinkFotoData) {
    dprev.src = drinkFotoData; dprev.style.display = 'block';
    document.getElementById('btnRemoverDrinkFoto').style.display = 'inline-block';
  } else {
    dprev.style.display = 'none';
    document.getElementById('btnRemoverDrinkFoto').style.display = 'none';
  }
  document.getElementById('drinkFoto').value = '';
  ingTmp = drink ? JSON.parse(JSON.stringify(drink.ingredientes)) : [];
  if (ingTmp.length === 0) ingTmp.push({ nome: '', qtd: 0, unidade: 'ml', valorUnit: 0 });
  renderIngredientes();
  modalDrink.classList.add('open');
}

function renderIngredientes() {
  const div = document.getElementById('ingredientes');
  div.innerHTML = '';
  const unidades = ['ml', 'L', 'g', 'kg', 'un', 'dose', 'cx'];
  ingTmp.forEach((ing, idx) => {
    const custoIng = num(ing.valorUnit);
    const row = document.createElement('div');
    row.className = 'ing-row';
    row.innerHTML = `
      <input type="text" data-idx="${idx}" data-field="nome" value="${ing.nome || ''}" placeholder="Ex: Cachaça" />
      <input type="number" step="0.01" data-idx="${idx}" data-field="qtd" value="${ing.qtd}" placeholder="0" />
      <select class="ing-unit-sel" data-idx="${idx}" data-field="unidade">
        ${unidades.map(u => `<option value="${u}" ${u === ing.unidade ? 'selected' : ''}>${u}</option>`).join('')}
      </select>
      <input type="number" step="0.0001" data-idx="${idx}" data-field="valorUnit" value="${ing.valorUnit}" placeholder="R$" />
      <span class="ing-cost">${brl(custoIng)}</span>
      <button type="button" data-remove="${idx}">×</button>
    `;
    div.appendChild(row);
  });
  div.querySelectorAll('select, input').forEach(el => {
    el.addEventListener('input', e => {
      const i = +e.target.dataset.idx;
      const f = e.target.dataset.field;
      const v = e.target.value;
      ingTmp[i][f] = (f === 'qtd' || f === 'valorUnit') ? num(v) : v;
      if (f === 'qtd' || f === 'valorUnit') {
        const row = e.target.closest('.ing-row');
        const custo = num(ingTmp[i].valorUnit);
        row.querySelector('.ing-cost').textContent = brl(custo);
        atualizarDrinkTotais();
      }
    });
  });
  div.querySelectorAll('[data-remove]').forEach(b => {
    b.addEventListener('click', () => {
      ingTmp.splice(+b.dataset.remove, 1);
      renderIngredientes();
    });
  });
  atualizarDrinkTotais();
}

function calcCustoDrink(ingredientes) {
  return ingredientes.reduce((s, ing) => s + num(ing.valorUnit), 0);
}

function atualizarDrinkTotais() {
  const custo = calcCustoDrink(ingTmp);
  const preco = num(document.getElementById('drinkPreco').value);
  document.getElementById('drinkCustoTotal').textContent = brl(custo);
  document.getElementById('drinkLucro').textContent = brl(preco - custo);
}

document.getElementById('formDrink').addEventListener('submit', e => {
  e.preventDefault();
  const did = document.getElementById('drinkId').value;
  const data = {
    nome: document.getElementById('drinkNome').value.trim(),
    desc: document.getElementById('drinkDesc').value.trim(),
    preco: num(document.getElementById('drinkPreco').value),
    foto: drinkFotoData,
    ingredientes: ingTmp.filter(i => i.nome && i.qtd > 0),
  };
  if (!data.nome) return;
  if (data.ingredientes.length === 0) return alert('Adicione ao menos um ingrediente com nome e quantidade.');
  if (did) {
    const i = state.drinks.findIndex(d => d.id === did);
    state.drinks[i] = { ...state.drinks[i], ...data };
  } else {
    state.drinks.push({ id: id(), ...data });
  }
  save();
  modalDrink.classList.remove('open');
  renderAll();
});

function renderDrinks() {
  const busca = document.getElementById('buscaDrink').value.toLowerCase();
  const grid = document.getElementById('listaDrinks');
  grid.innerHTML = '';
  const lista = state.drinks.filter(d => !busca || d.nome.toLowerCase().includes(busca));
  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;background:var(--panel);border:1px solid var(--border);border-radius:12px;">Nenhum drink cadastrado.</div>`;
    return;
  }
  lista.forEach(d => {
    const custo = calcCustoDrink(d.ingredientes);
    const lucro = d.preco - custo;
    const margem = custo > 0 ? ((lucro / custo) * 100).toFixed(0) : '—';
    const cmv = d.preco > 0 ? ((custo / d.preco) * 100).toFixed(1) : '—';
    const card = document.createElement('div');
    card.className = 'drink-card';
    card.innerHTML = `
      ${d.foto ? `<img src="${d.foto}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;" />` : ''}
      <h3>${d.nome}</h3>
      ${d.desc ? `<div class="desc">${d.desc}</div>` : ''}
      <ul>
        ${d.ingredientes.map(ing =>
          `<li>• ${ing.qtd} ${ing.unidade} — ${ing.nome} <small>(${brl(num(ing.valorUnit))})</small></li>`
        ).join('')}
      </ul>
      <div class="stats">
        <span>Custo: ${brl(custo)}</span>
        <span>Venda: <b>${brl(d.preco)}</b></span>
      </div>
      <div class="stats">
        <span>Lucro: <b>${brl(lucro)}</b> (${margem}%)</span>
        <span>CMV: ${cmv}%</span>
      </div>
      <div class="actions-row">
        <button class="btn ghost small" data-edit="${d.id}">Editar</button>
        <button class="btn danger small" data-del="${d.id}">Excluir</button>
      </div>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => abrirDrink(state.drinks.find(d => d.id === b.dataset.edit)))
  );
  grid.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => {
      if (!confirm('Excluir este drink?')) return;
      state.drinks = state.drinks.filter(d => d.id !== b.dataset.del);
      save();
      renderAll();
    })
  );
}

function renderAll() {
  renderCategorias();
  renderProdutos();
  renderLancamentos();
  renderDrinks();
  renderCardapio();
  renderDashboard();
}

// CARDÁPIO
const modalCard = document.getElementById('modalCard');
document.getElementById('btnNovoCard').addEventListener('click', () => abrirCard());
document.getElementById('buscaCard').addEventListener('input', renderCardapio);
document.getElementById('filtroCardCat').addEventListener('change', renderCardapio);

let cardFotoData = '';
document.getElementById('cardFoto').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    cardFotoData = ev.target.result;
    const prev = document.getElementById('cardFotoPrev');
    prev.src = cardFotoData; prev.style.display = 'block';
    document.getElementById('btnRemoverFoto').style.display = 'inline-block';
  };
  r.readAsDataURL(f);
});
document.getElementById('btnRemoverFoto').addEventListener('click', () => {
  cardFotoData = '';
  document.getElementById('cardFoto').value = '';
  document.getElementById('cardFotoPrev').style.display = 'none';
  document.getElementById('btnRemoverFoto').style.display = 'none';
});

function abrirCard(item) {
  document.getElementById('tituloModalCard').textContent = item ? 'Editar item' : 'Novo item do cardápio';
  document.getElementById('cardId').value = item?.id || '';
  document.getElementById('cardNome').value = item?.nome || '';
  document.getElementById('cardCat').value = item?.categoria || 'cerveja';
  document.getElementById('cardDesc').value = item?.desc || '';
  document.getElementById('cardPreco').value = item?.preco ?? 0;
  cardFotoData = item?.foto || '';
  const prev = document.getElementById('cardFotoPrev');
  if (cardFotoData) {
    prev.src = cardFotoData; prev.style.display = 'block';
    document.getElementById('btnRemoverFoto').style.display = 'inline-block';
  } else {
    prev.style.display = 'none';
    document.getElementById('btnRemoverFoto').style.display = 'none';
  }
  document.getElementById('cardFoto').value = '';
  modalCard.classList.add('open');
}

document.getElementById('formCard').addEventListener('submit', e => {
  e.preventDefault();
  const cid = document.getElementById('cardId').value;
  const data = {
    nome: document.getElementById('cardNome').value.trim(),
    categoria: document.getElementById('cardCat').value,
    desc: document.getElementById('cardDesc').value.trim(),
    preco: num(document.getElementById('cardPreco').value),
    foto: cardFotoData,
  };
  if (!data.nome) return;
  if (cid) {
    const i = state.cardapio.findIndex(x => x.id === cid);
    state.cardapio[i] = { ...state.cardapio[i], ...data };
  } else {
    state.cardapio.push({ id: id(), ...data });
  }
  save();
  modalCard.classList.remove('open');
  renderAll();
});

function renderCardapio() {
  const busca = document.getElementById('buscaCard').value.toLowerCase();
  const filtro = document.getElementById('filtroCardCat').value;
  const grid = document.getElementById('listaCard');
  grid.innerHTML = '';
  const lista = state.cardapio.filter(i =>
    (!filtro || i.categoria === filtro) &&
    (!busca || i.nome.toLowerCase().includes(busca))
  );
  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;background:var(--panel);border:1px solid var(--border);border-radius:12px;">Nenhum item cadastrado.</div>`;
    return;
  }
  const catLabel = { cerveja: 'Cerveja', refrigerante: 'Refrigerante', petisco: 'Petisco', outros: 'Outros' };
  lista.forEach(it => {
    const card = document.createElement('div');
    card.className = 'drink-card';
    card.innerHTML = `
      ${it.foto ? `<img src="${it.foto}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;" />` : ''}
      <h3>${it.nome}</h3>
      <div class="desc">${catLabel[it.categoria] || ''}${it.desc ? ' — ' + it.desc : ''}</div>
      <div class="stats"><span>Preço: <b>${brl(it.preco)}</b></span></div>
      <div class="actions-row">
        <button class="btn ghost small" data-edit="${it.id}">Editar</button>
        <button class="btn danger small" data-del="${it.id}">Excluir</button>
      </div>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => abrirCard(state.cardapio.find(x => x.id === b.dataset.edit)))
  );
  grid.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => {
      if (!confirm('Excluir este item?')) return;
      state.cardapio = state.cardapio.filter(x => x.id !== b.dataset.del);
      save();
      renderAll();
    })
  );
}

load();
renderAll();
