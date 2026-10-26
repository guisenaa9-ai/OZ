const WHATSAPP = '5592984030605';
const TAMANHOS = ['P', 'M', 'G'];
const brl = v => v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
let produtos = [];
let sacola = [];
try { sacola = JSON.parse(localStorage.getItem('oz-sacola')) || []; } catch {}
// descarta qualquer item adulterado antes de ir para o HTML
sacola = Array.isArray(sacola) ? sacola.filter(i => i && typeof i.id === 'string' && TAMANHOS.includes(i.tam) && Number.isInteger(i.qtd) && i.qtd > 0 && i.qtd <= 20) : [];

const $ = id => document.getElementById(id);
const salvar = () => { try { localStorage.setItem('oz-sacola', JSON.stringify(sacola)); } catch {} };
const abrir = v => document.body.classList.toggle('aberto', v);

function renderGrade() {
  $('grade').innerHTML = produtos.map(p => `
    <article class="produto">
      <img src="${p.img}" alt="${p.nome}" loading="lazy">
      <h3>${p.nome}</h3>
      <span class="preco">${brl(p.preco)}</span>
      <div class="linha">
        <div class="tams" role="radiogroup" aria-label="Tamanho">${TAMANHOS.map(t => `<input type="radio" name="tam-${p.id}" id="tam-${p.id}-${t}" value="${t}"${t === 'M' ? ' checked' : ''}><label for="tam-${p.id}-${t}">${t}</label>`).join('')}</div>
        <button class="btn" data-add="${p.id}">Adicionar</button>
      </div>
    </article>`).join('');
}

function renderSacola() {
  const linhas = sacola.map(i => ({...i, p: produtos.find(p => p.id === i.id)})).filter(i => i.p);
  $('contador').textContent = linhas.reduce((s, i) => s + i.qtd, 0);
  $('total').textContent = brl(linhas.reduce((s, i) => s + i.qtd * i.p.preco, 0));
  document.querySelectorAll('[data-metodo], #pedido-zap').forEach(b => b.disabled = !linhas.length);
  $('itens').innerHTML = linhas.length ? linhas.map((i, n) => `
    <div class="item">
      <img src="${i.p.img}" alt="">
      <div><div>${i.p.nome}</div><small>Tam. ${i.tam} · ${brl(i.p.preco)}</small></div>
      <div class="qtd"><button data-mais="${n}" data-d="-1" aria-label="Diminuir">−</button>${i.qtd}<button data-mais="${n}" data-d="1" aria-label="Aumentar">+</button></div>
    </div>`).join('') : '<p class="vazio">Sua sacola está vazia.</p>';
}

document.addEventListener('click', e => {
  const add = e.target.dataset.add, mais = e.target.dataset.mais;
  if (add) {
    const tam = document.querySelector(`input[name="tam-${add}"]:checked`).value;
    const i = sacola.find(i => i.id === add && i.tam === tam);
    i ? i.qtd++ : sacola.push({id: add, tam, qtd: 1});
    salvar(); renderSacola(); abrir(true);
  } else if (mais !== undefined) {
    sacola[mais].qtd += +e.target.dataset.d;
    sacola = sacola.filter(i => i.qtd > 0);
    salvar(); renderSacola();
  }
});
$('abrir-carrinho').onclick = () => abrir(true);
$('fechar').onclick = $('fundo').onclick = () => abrir(false);

function pedidoWhatsApp() {
  const linhas = sacola.map(i => { const p = produtos.find(p => p.id === i.id); return `• ${i.qtd}x ${p.nome} (tam. ${i.tam}) ${brl(p.preco * i.qtd)}`; });
  const total = sacola.reduce((s, i) => s + i.qtd * produtos.find(p => p.id === i.id).preco, 0);
  const msg = `Olá linda, quero fechar este pedido 💕\n\n${linhas.join('\n')}\n\nTotal: ${brl(total)}`;
  location.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

$('pedido-zap').onclick = pedidoWhatsApp;

document.querySelectorAll('[data-metodo]').forEach(btn => btn.onclick = async () => {
  const texto = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Abrindo…';
  $('aviso').className = 'aviso';
  $('aviso').textContent = 'Pagamento seguro via Mercado Pago';
  try {
    const r = await fetch('/api/checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({itens: sacola, metodo: btn.dataset.metodo})});
    const {url} = await r.json();
    if (!r.ok || !url) throw 0;
    location.href = url;
  } catch {
    $('aviso').className = 'aviso erro';
    $('aviso').textContent = 'Não conseguimos abrir o pagamento agora. Tente de novo ou feche pelo WhatsApp.';
  } finally {
    btn.disabled = false;
    btn.textContent = texto;
  }
});

if (new URLSearchParams(location.search).get('pagamento') === 'aprovado') {
  sacola = []; salvar();
  alert('Pagamento aprovado! Obrigada pela compra 💕 Vamos te chamar no WhatsApp para combinar a entrega.');
  history.replaceState(null, '', location.pathname);
}

fetch('products.json').then(r => r.json()).then(d => { produtos = d; renderGrade(); renderSacola(); });
