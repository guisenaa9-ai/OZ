const assert = require('assert');
const {montarItens} = require('../api/checkout');
const [i] = montarItens([{id: 'saia-lese', tam: 'M', qtd: 2}]);
assert.equal(i.unit_price, 89.9);
assert.equal(i.quantity, 2);
for (const ruim of [[], [{id: 'x', tam: 'M', qtd: 1}], [{id: 'saia-lese', tam: 'XG', qtd: 1}], [{id: 'saia-lese', tam: 'M', qtd: 0}], [{id: 'saia-lese', tam: 'M', qtd: 1.5}]])
  assert.throws(() => montarItens(ruim));
console.log('ok');

// handler: forma de pagamento vira tipos excluídos no Mercado Pago
const handler = require('../api/checkout');
const resposta = () => { const r = {code: 200, body: null}; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); return r; };
(async () => {
  process.env.MP_ACCESS_TOKEN = 'TEST-x';
  let enviado;
  global.fetch = async (url, opts) => (enviado = JSON.parse(opts.body), {ok: true, json: async () => ({init_point: 'https://mp/checkout'})});
  const req = metodo => ({method: 'POST', headers: {host: 'loja'}, body: {itens: [{id: 'saia-lese', tam: 'M', qtd: 1}], metodo}});

  let r = resposta(); await handler(req('pix'), r);
  assert.equal(r.body.url, 'https://mp/checkout');
  assert.ok(enviado.payment_methods.excluded_payment_types.some(t => t.id === 'credit_card'));
  assert.ok(!enviado.payment_methods.excluded_payment_types.some(t => t.id === 'bank_transfer'));

  r = resposta(); await handler(req('cartao'), r);
  assert.ok(enviado.payment_methods.excluded_payment_types.some(t => t.id === 'bank_transfer'));
  assert.ok(!enviado.payment_methods.excluded_payment_types.some(t => t.id === 'credit_card'));

  r = resposta(); await handler(req('boleto'), r); assert.equal(r.code, 400);
  delete process.env.MP_ACCESS_TOKEN;
  r = resposta(); await handler(req('pix'), r); assert.equal(r.code, 503);
  console.log('handler ok');
})();
