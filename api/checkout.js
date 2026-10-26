// Cria uma preferência no Mercado Pago (Checkout Pro) e devolve a URL de pagamento.
// Preços vêm sempre do products.json do servidor, nunca do navegador.
const produtos = require('../products.json');

const TAMANHOS = ['P', 'M', 'G'];
// Tipos de pagamento do Mercado Pago escondidos em cada botão
const EXCLUIR = {
  pix: ['credit_card', 'debit_card', 'prepaid_card', 'ticket', 'atm'],
  cartao: ['bank_transfer', 'debit_card', 'prepaid_card', 'ticket', 'atm'],
};

function montarItens(itens) {
  if (!Array.isArray(itens) || !itens.length || itens.length > 50) throw new Error('sacola inválida');
  return itens.map(({id, tam, qtd}) => {
    const p = produtos.find(p => p.id === id);
    if (!p || !TAMANHOS.includes(tam) || !Number.isInteger(qtd) || qtd < 1 || qtd > 20) throw new Error('item inválido');
    return {id: `${id}-${tam}`, title: `${p.nome} (tam. ${tam})`, quantity: qtd, unit_price: p.preco, currency_id: 'BRL'};
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({erro: 'método não permitido'});
  if (!process.env.MP_ACCESS_TOKEN) return res.status(503).json({erro: 'pagamento não configurado'});
  let items;
  try { items = montarItens(req.body && req.body.itens); } catch (e) { return res.status(400).json({erro: e.message}); }
  const excluir = EXCLUIR[req.body.metodo];
  if (!excluir) return res.status(400).json({erro: 'forma de pagamento inválida'});

  const site = `https://${req.headers.host}`;
  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      items,
      shipments: {mode: 'not_specified'},
      payment_methods: {excluded_payment_types: excluir.map(id => ({id}))},
      back_urls: {success: `${site}/?pagamento=aprovado`, pending: `${site}/?pagamento=pendente`, failure: `${site}/`},
      auto_return: 'approved',
      statement_descriptor: 'USE OZ',
    }),
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({erro: 'falha no Mercado Pago'});
  res.json({url: data.init_point});
};

module.exports.montarItens = montarItens;
