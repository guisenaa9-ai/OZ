// Versão de demonstração por 7 dias. Depois desta data (horário de Manaus) o site fica bloqueado.
const DEMO_ATE = new Date('2026-11-02T23:59:59-04:00');
const dataDemo = DEMO_ATE.toLocaleDateString('pt-BR', {timeZone: 'America/Manaus'});

if (Date.now() > DEMO_ATE) {
  document.body.classList.add('demo-encerrada');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="demo-fim" role="dialog" aria-modal="true" aria-labelledby="demo-fim-titulo">
      <div>
        <span class="logo">USE OZ</span>
        <h2 id="demo-fim-titulo">Período de teste encerrado</h2>
        <p>Esta demonstração do site ficou disponível até ${dataDemo}. Para ativar a versão oficial, fale com quem desenvolveu o site.</p>
      </div>
    </div>`);
} else {
  const dias = Math.floor((DEMO_ATE - Date.now()) / 864e5);
  document.body.insertAdjacentHTML('afterbegin', `<div class="demo-faixa">Versão de demonstração · disponível até ${dataDemo} (${dias < 1 ? 'último dia' : dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`})</div>`);
}

// Na demonstração o pedido é fechado só pelo WhatsApp (sem pagamento no site)
document.body.classList.add('so-zap');
const zap = $('pedido-zap');
zap.className = 'btn zap-fechar';
zap.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${document.querySelector('.zap svg').innerHTML}</svg>Fechar pedido pelo WhatsApp`;
zap.insertAdjacentHTML('afterend', '<p class="zap-nota">Você combina o pagamento (Pix ou cartão em até 3x) e a entrega direto com a loja.</p>');
