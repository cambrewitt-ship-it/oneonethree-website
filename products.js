/* ============================================================
   PRODUCTS: single source of truth for prices and checkout links.
   Used by product.html and each individual product page.

   price      NZD incl. GST, e.g. 49. Leave null to hide the price.
   compareAt  Only set this if the product was genuinely sold at that
              higher price (NZ Fair Trading Act). Shows a "Save X%" tag.
   link       Stripe Payment Link (https://buy.stripe.com/...).
              While empty, buy buttons fall back to "Enquire now".
============================================================ */
window.OOT_PRODUCTS = {
  stand:  { name: 'Tap Stand', price: null, compareAt: null, link: '' },
  plaque: { name: 'Plaque',    price: null, compareAt: null, link: '' },
  card:   { name: 'Tap Card',  price: null, compareAt: null, link: '' },
};

(function () {
  'use strict';
  const products = window.OOT_PRODUCTS;
  const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));

  // Prices (wrappers stay hidden until a price is set)
  document.querySelectorAll('[data-price]').forEach(el => {
    const p = products[el.dataset.price];
    if (!p || p.price == null) return;
    el.textContent = money(p.price);
    const wrap = el.closest('[data-price-wrap]');
    if (wrap) wrap.hidden = false;
  });

  // Compare-at price + saving
  document.querySelectorAll('[data-compare]').forEach(el => {
    const p = products[el.dataset.compare];
    if (!p || p.price == null || !p.compareAt || p.compareAt <= p.price) return;
    el.querySelector('s').textContent = money(p.compareAt);
    el.querySelector('[data-save]').textContent = 'Save ' + Math.round((1 - p.price / p.compareAt) * 100) + '%';
    el.hidden = false;
  });

  // "From $X" labels
  const prices = Object.values(products).map(p => p.price).filter(n => n != null);
  if (prices.length) {
    document.querySelectorAll('[data-from-price]').forEach(el => {
      el.textContent = (el.dataset.fromPrice || '') .replace('{price}', money(Math.min(...prices)));
      el.hidden = false;
    });
  }

  // Buy buttons: default markup is a safe "Enquire now" link to contact.html
  document.querySelectorAll('[data-buy]').forEach(btn => {
    const p = products[btn.dataset.buy];
    if (!p || !p.link) return;
    btn.href = p.link;
    if (btn.dataset.label) btn.lastChild.textContent = btn.dataset.label;
    btn.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'begin_checkout', product: p.name, value: p.price, currency: 'NZD' });
    });
  });
})();
