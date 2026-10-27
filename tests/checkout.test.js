const assert = require('assert');
const {montarItens, montarCliente} = require('../api/checkout');
const [i] = montarItens([{id: 'saia-lese', tam: 'M', qtd: 2}]);
assert.equal(i.unit_price, 89.9);
assert.equal(i.quantity, 2);
for (const ruim of [[], [{id: 'x', tam: 'M', qtd: 1}], [{id: 'saia-lese', tam: 'XG', qtd: 1}], [{id: 'saia-lese', tam: 'M', qtd: 0}], [{id: 'saia-lese', tam: 'M', qtd: 1.5}]])
  assert.throws(() => montarItens(ruim));

assert.deepEqual(montarCliente({nome: '  Ana   Maria ', whatsapp: '(92) 98403-0605'}), {nome: 'Ana Maria', zap: '92984030605'});
for (const ruim of [undefined, {}, {nome: 'A', whatsapp: '92984030605'}, {nome: 'Ana', whatsapp: '9298'}, {nome: 'Ana', whatsapp: 92984030605}])
  assert.throws(() => montarCliente(ruim));
console.log('ok');

// handler: forma de pagamento vira tipos excluídos no Mercado Pago
const handler = require('../api/checkout');
const resposta = () => { const r = {code: 200, body: null}; r.status = c => (r.code = c, r); r.json = b => (r.body = b, r); return r; };
(async () => {
  process.env.MP_ACCESS_TOKEN = 'TEST-x';
  let enviado;
  global.fetch = async (url, opts) => (enviado = JSON.parse(opts.body), {ok: true, json: async () => ({init_point: 'https://mp/checkout'})});
  const cliente = {nome: 'Ana', whatsapp: '92984030605'};
  const req = (metodo, c = cliente) => ({method: 'POST', headers: {host: 'loja'}, body: {itens: [{id: 'saia-lese', tam: 'M', qtd: 1}], metodo, cliente: c}});

  let r = resposta(); await handler(req('pix'), r);
  assert.equal(r.body.url, 'https://mp/checkout');
  assert.ok(enviado.payment_methods.excluded_payment_types.some(t => t.id === 'credit_card'));
  assert.ok(!enviado.payment_methods.excluded_payment_types.some(t => t.id === 'bank_transfer'));
  assert.deepEqual(enviado.payer.phone, {area_code: '92', number: '984030605'});
  assert.ok(enviado.external_reference.includes('92984030605'));

  r = resposta(); await handler(req('cartao'), r);
  assert.ok(enviado.payment_methods.excluded_payment_types.some(t => t.id === 'bank_transfer'));
  assert.ok(!enviado.payment_methods.excluded_payment_types.some(t => t.id === 'credit_card'));
  assert.equal(enviado.payment_methods.installments, 3);

  r = resposta(); await handler(req('boleto'), r); assert.equal(r.code, 400);
  r = resposta(); await handler(req('pix', {nome: 'Ana'}), r); assert.equal(r.code, 400);

  global.fetch = async () => { throw new Error('rede'); };
  r = resposta(); await handler(req('pix'), r); assert.equal(r.code, 502);

  delete process.env.MP_ACCESS_TOKEN;
  r = resposta(); await handler(req('pix'), r); assert.equal(r.code, 503);
  console.log('handler ok');
})();
