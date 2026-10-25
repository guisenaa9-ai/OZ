const assert = require('assert');
const {montarItens} = require('../api/checkout');
const [i] = montarItens([{id: 'saia-lese', tam: 'M', qtd: 2}]);
assert.equal(i.unit_price, 89.9);
assert.equal(i.quantity, 2);
for (const ruim of [[], [{id: 'x', tam: 'M', qtd: 1}], [{id: 'saia-lese', tam: 'XG', qtd: 1}], [{id: 'saia-lese', tam: 'M', qtd: 0}], [{id: 'saia-lese', tam: 'M', qtd: 1.5}]])
  assert.throws(() => montarItens(ruim));
console.log('ok');
