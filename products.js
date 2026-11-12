/* ============================================================
   PRODUCTS: single source of truth for prices and checkout links.
   Used by product.html and each individual product page.

   price  Regular NZD price incl. GST, e.g. 49 (what you normally
          charge). Leave null to hide the price.
   link   Stripe Payment Link (https://buy.stripe.com/...).
          While empty, buy buttons fall back to "Enquire now".
============================================================ */
window.OOT_PRODUCTS = {
  stand:  { name: 'Tap Stand', price: null, link: '' },
  plaque: { name: 'Plaque',    price: null, link: '' },
  card:   { name: 'Tap Card',  price: null, link: '' },
};

/* ============================================================
   SALE: a genuine, time-limited discount.

   percent    Discount off the regular price.
   endsAt     Real end date/time, e.g. '2026-11-30T23:59:00+13:00'.
              The sale banner, countdown and sale prices only show
              before this moment. Afterwards everything returns to
              regular prices automatically. Leave null for no sale.
   promoCode  Stripe promotion code for the same % off, expiring at
              endsAt. It's pre-applied at checkout via the link.
============================================================ */
window.OOT_SALE = { percent: 35, endsAt: null, promoCode: '' };

(function () {
  'use strict';
  const products = window.OOT_PRODUCTS;
  const sale = window.OOT_SALE;
  const saleEnd = sale.endsAt ? new Date(sale.endsAt).getTime() : 0;
  const saleOn = sale.percent > 0 && saleEnd > Date.now();

  const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const nowPrice = p => saleOn ? Math.round(p.price * (100 - sale.percent)) / 100 : p.price;

  // Prices (wrappers stay hidden until a price is set)
  document.querySelectorAll('[data-price]').forEach(el => {
    const p = products[el.dataset.price];
    if (!p || p.price == null) return;
    el.textContent = money(nowPrice(p));
    const wrap = el.closest('[data-price-wrap]');
    if (wrap) wrap.hidden = false;
  });

  // Regular price, struck through during the sale
  document.querySelectorAll('[data-was]').forEach(el => {
    const p = products[el.dataset.was];
    if (p && p.price != null) el.textContent = money(p.price);
  });
  document.querySelectorAll('[data-sale-pct]').forEach(el => { el.textContent = sale.percent; });
  document.querySelectorAll('[data-sale-only]').forEach(el => { el.hidden = !saleOn; });

  // "From $X" labels
  const prices = Object.values(products).filter(p => p.price != null).map(nowPrice);
  if (prices.length) {
    document.querySelectorAll('[data-from-price]').forEach(el => {
      el.textContent = (el.dataset.fromPrice || '').replace('{price}', money(Math.min(...prices)));
      el.hidden = false;
    });
  }

  // Buy buttons: default markup is a safe "Enquire now" link to contact.html
  document.querySelectorAll('[data-buy]').forEach(btn => {
    const p = products[btn.dataset.buy];
    if (!p || !p.link) return;
    btn.href = saleOn && sale.promoCode
      ? p.link + (p.link.includes('?') ? '&' : '?') + 'prefilled_promo_code=' + encodeURIComponent(sale.promoCode)
      : p.link;
    if (btn.dataset.label) btn.lastChild.textContent = btn.dataset.label;
    btn.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'begin_checkout', product: p.name, value: nowPrice(p), currency: 'NZD' });
    });
  });

  if (!saleOn) return;

  // Top banner
  const banner = document.createElement('div');
  banner.className = 'sale-banner';
  banner.innerHTML = '<strong>Sale ending soon</strong><span>' + sale.percent + '% off</span><span>Free NZ shipping</span>' +
    '<span class="sale-banner__time">Ends in <b data-cd-inline></b></span>';
  document.body.prepend(banner);
  document.body.classList.add('has-sale');

  // Countdowns
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const diff = saleEnd - Date.now();
    if (diff <= 0) { location.reload(); return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    document.querySelectorAll('[data-cd="d"]').forEach(el => { el.textContent = pad(d); });
    document.querySelectorAll('[data-cd="h"]').forEach(el => { el.textContent = pad(h); });
    document.querySelectorAll('[data-cd="m"]').forEach(el => { el.textContent = pad(m); });
    document.querySelectorAll('[data-cd="s"]').forEach(el => { el.textContent = pad(s); });
    document.querySelectorAll('[data-cd-inline]').forEach(el => {
      el.textContent = (d ? d + 'd ' : '') + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    });
  };
  tick();
  setInterval(tick, 1000);
})();
