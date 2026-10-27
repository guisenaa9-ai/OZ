const WHATSAPP = '5592984030605';
const TAMANHOS = ['P', 'M', 'G'];
const PARCELAS = 3;
// Ligue quando ativar o "parcelamento sem juros" no painel do Mercado Pago
const SEM_JUROS = false;
const brl = v => v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
const parcela = v => SEM_JUROS ? `ou ${PARCELAS}x de ${brl(v / PARCELAS)} sem juros` : `no Pix ou em até ${PARCELAS}x no cartão`;
let produtos = [];
let filtro = 'todos';
let sacola = [];
try { sacola = JSON.parse(localStorage.getItem('oz-sacola')) || []; } catch {}
// descarta qualquer item adulterado antes de ir para o HTML
sacola = Array.isArray(sacola) ? sacola.filter(i => i && typeof i.id === 'string' && TAMANHOS.includes(i.tam) && Number.isInteger(i.qtd) && i.qtd > 0 && i.qtd <= 20) : [];

const $ = id => document.getElementById(id);
const salvar = () => { try { localStorage.setItem('oz-sacola', JSON.stringify(sacola)); } catch {} };
const abrir = v => document.body.classList.toggle('aberto', v);
// só os itens cujo produto ainda existe no catálogo
const linhasSacola = () => sacola.map((i, n) => ({...i, n, p: produtos.find(p => p.id === i.id)})).filter(i => i.p);

function renderGrade() {
  const lista = produtos.filter(p => filtro === 'todos' || p.cat === filtro);
  $('grade').innerHTML = lista.map(p => `
    <article class="produto">
      <div class="foto">
        <img src="${p.img}" alt="${p.nome}" loading="lazy">
        <span class="selo">Pronta entrega</span>
      </div>
      <h3>${p.nome}</h3>
      <div class="precos"><span class="preco">${brl(p.preco)}</span><small>${parcela(p.preco)}</small></div>
      <div class="linha">
        <div class="tams" role="radiogroup" aria-label="Tamanho">${TAMANHOS.map(t => `<input type="radio" name="tam-${p.id}" id="tam-${p.id}-${t}" value="${t}"${t === 'M' ? ' checked' : ''}><label for="tam-${p.id}-${t}">${t}</label>`).join('')}</div>
        <button class="btn" data-add="${p.id}">Adicionar</button>
      </div>
    </article>`).join('');
}

function renderSacola() {
  const linhas = linhasSacola();
  const total = linhas.reduce((s, i) => s + i.qtd * i.p.preco, 0);
  $('contador').textContent = linhas.reduce((s, i) => s + i.qtd, 0);
  $('total').textContent = brl(total);
  $('total-parcela').textContent = linhas.length ? (SEM_JUROS ? `ou ${PARCELAS}x de ${brl(total / PARCELAS)} sem juros` : `Pix ou até ${PARCELAS}x no cartão`) : '';
  document.querySelectorAll('[data-metodo], #pedido-zap').forEach(b => b.disabled = !linhas.length);
  $('cliente').hidden = !linhas.length;
  $('itens').innerHTML = linhas.length ? linhas.map(i => `
    <div class="item">
      <img src="${i.p.img}" alt="">
      <div><div>${i.p.nome}</div><small>Tam. ${i.tam} · ${brl(i.p.preco)}</small></div>
      <div class="qtd"><button data-mais="${i.n}" data-d="-1" aria-label="Diminuir">−</button>${i.qtd}<button data-mais="${i.n}" data-d="1" aria-label="Aumentar">+</button></div>
    </div>`).join('') : '<div class="vazio"><p>Sua sacola está vazia.</p><a href="#colecao" class="btn claro" data-fechar>Ver coleção</a></div>';
}

document.addEventListener('click', e => {
  const alvo = e.target.closest('[data-add], [data-mais], [data-filtro], [data-fechar]');
  if (!alvo) return;
  if (alvo.dataset.add) {
    const add = alvo.dataset.add;
    const tam = document.querySelector(`input[name="tam-${add}"]:checked`).value;
    const i = sacola.find(i => i.id === add && i.tam === tam);
    i ? i.qtd = Math.min(i.qtd + 1, 20) : sacola.push({id: add, tam, qtd: 1});
    salvar(); renderSacola(); abrir(true);
    $('contador').classList.remove('pulo'); void $('contador').offsetWidth; $('contador').classList.add('pulo');
  } else if (alvo.dataset.mais !== undefined) {
    const item = sacola[alvo.dataset.mais];
    if (!item) return;
    item.qtd = Math.min(item.qtd + +alvo.dataset.d, 20);
    sacola = sacola.filter(i => i.qtd > 0);
    salvar(); renderSacola();
  } else if (alvo.dataset.filtro) {
    filtro = alvo.dataset.filtro;
    document.querySelectorAll('[data-filtro]').forEach(b => b.setAttribute('aria-pressed', b === alvo));
    renderGrade();
  } else if (alvo.dataset.fechar !== undefined) {
    abrir(false);
  }
});
$('abrir-carrinho').onclick = () => abrir(true);
$('fechar').onclick = $('fundo').onclick = () => abrir(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') abrir(false); });

// nome e WhatsApp ficam lembrados neste navegador
try { const c = JSON.parse(localStorage.getItem('oz-cliente')); if (c) { $('nome').value = c.nome || ''; $('whatsapp').value = c.whatsapp || ''; } } catch {}
$('whatsapp').oninput = e => {
  if (e.inputType && e.inputType.startsWith('delete')) return;
  const d = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value = d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}${d.length > 6 ? '-' + d.slice(d.length > 10 ? 7 : 6) : ''}` : d;
};

function aviso(texto, erro) {
  $('aviso').className = erro ? 'aviso erro' : 'aviso';
  $('aviso').textContent = texto;
}

function lerCliente() {
  const nome = $('nome').value.trim(), whatsapp = $('whatsapp').value;
  if (nome.length < 2) { aviso('Digite seu nome para continuarmos.', true); $('nome').focus(); return null; }
  if (!/^\d{10,11}$/.test(whatsapp.replace(/\D/g, ''))) { aviso('Digite seu WhatsApp com DDD, para combinarmos a entrega.', true); $('whatsapp').focus(); return null; }
  try { localStorage.setItem('oz-cliente', JSON.stringify({nome, whatsapp})); } catch {}
  return {nome, whatsapp};
}

function pedidoWhatsApp() {
  const linhas = linhasSacola();
  const total = linhas.reduce((s, i) => s + i.qtd * i.p.preco, 0);
  const lista = linhas.map(i => `• ${i.qtd}x ${i.p.nome} (tam. ${i.tam}) ${brl(i.p.preco * i.qtd)}`);
  const msg = `Olá linda, quero fechar este pedido 💕\n\n${lista.join('\n')}\n\nTotal: ${brl(total)}`;
  location.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

$('pedido-zap').onclick = pedidoWhatsApp;

document.querySelectorAll('[data-metodo]').forEach(btn => btn.onclick = async () => {
  const cliente = lerCliente();
  if (!cliente) return;
  const texto = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Abrindo…';
  aviso('Pagamento seguro via Mercado Pago');
  try {
    const itens = linhasSacola().map(({id, tam, qtd}) => ({id, tam, qtd}));
    const r = await fetch('/api/checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({itens, metodo: btn.dataset.metodo, cliente})});
    const {url} = await r.json();
    if (!r.ok || !url) throw 0;
    location.href = url;
  } catch {
    aviso('Não conseguimos abrir o pagamento agora. Tente de novo ou feche pelo WhatsApp.', true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = texto;
  }
});

if (new URLSearchParams(location.search).get('pagamento') === 'aprovado') {
  sacola = []; salvar();
  alert('Pagamento aprovado! Obrigada pela compra 💕 Vamos te chamar no WhatsApp para combinar a entrega.');
  history.replaceState(null, '', location.pathname);
}

fetch('products.json').then(r => r.json()).then(d => { produtos = d; renderGrade(); renderSacola(); });
