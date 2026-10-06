/* ==========================================================================
   TheGemByte — storefront logic (no build step, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  const SITE = window.SITE;
  const PRODUCTS = window.PRODUCTS || [];
  const CATEGORIES = window.CATEGORIES || [];
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Helpers ---------- */

  const money = new Intl.NumberFormat(SITE.locale, { style: "currency", currency: SITE.currency, maximumFractionDigits: 0 });
  const fmt = (n) => money.format(n);

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("tgb:" + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("tgb:" + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    }
  };

  function track(event, data) {
    if (!SITE.analytics || !SITE.analytics.enabled) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event }, data));
  }

  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const categoryName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;
  const discount = (p) => (p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0);
  const inStock = (p) => p.type !== "store" || (p.stock ?? 1) > 0;

  // Append configured tracking params (e.g. Amazon `tag`) without overwriting existing ones.
  function affiliateHref(p) {
    try {
      const u = new URL(p.affiliateUrl);
      Object.entries(SITE.affiliateParams || {}).forEach(([k, v]) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
      return u.toString();
    } catch { return p.affiliateUrl || "#"; }
  }

  const PALETTES = {
    tech: ["#0f6b5c", "#2fa58c"], home: ["#b5832f", "#e2b766"], style: ["#8f3c5a", "#d7799b"],
    wellness: ["#3d7a3a", "#8cc47f"], books: ["#3c3f8f", "#7a7fd6"]
  };
  // The placeholder always renders; a product photo sits on top of it and
  // removes itself if it fails to load, so a broken URL never shows a broken image.
  function media(p, alt = true) {
    const [a, b] = PALETTES[p.category] || ["#555", "#999"];
    const cat = CATEGORIES.find((c) => c.id === p.category);
    const placeholder = `<div class="placeholder" ${p.image ? 'aria-hidden="true"' : `role="img" aria-label="${esc(p.name)}"`} style="background:linear-gradient(135deg,${a},${b})">${esc(cat ? cat.icon : "◆")}</div>`;
    if (!p.image) return placeholder;
    return `${placeholder}<img class="media-img" src="${esc(p.image)}" alt="${alt ? esc(p.name) : ""}" loading="lazy" decoding="async" onerror="this.remove()">`;
  }

  function stars(r) {
    const full = Math.round(r);
    return `<span class="stars" aria-hidden="true">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
  }

  /* ---------- Toast ---------- */

  let toastTimer;
  function toast(msg) {
    let el = $(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------- Cart & wishlist ---------- */

  const Cart = {
    items() { return store.get("cart", []).filter((i) => byId(i.id)); },
    save(items) { store.set("cart", items); updateCounts(); },
    add(id, qty = 1) {
      const p = byId(id);
      if (!p || p.type !== "store" || !inStock(p)) return;
      const items = this.items();
      const line = items.find((i) => i.id === id);
      const max = p.stock ?? 99;
      if (line) line.qty = Math.min(max, line.qty + qty); else items.push({ id, qty: Math.min(max, qty) });
      this.save(items);
      track("add_to_cart", { item_id: id, item_name: p.name, value: p.price * qty, currency: SITE.currency });
      toast(`Added “${p.name}” to your bag`);
    },
    setQty(id, qty) {
      const p = byId(id);
      const items = this.items().map((i) => (i.id === id ? { id, qty: Math.max(1, Math.min(p.stock ?? 99, qty)) } : i));
      this.save(items);
    },
    remove(id) { this.save(this.items().filter((i) => i.id !== id)); },
    count() { return this.items().reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items().reduce((s, i) => s + byId(i.id).price * i.qty, 0); }
  };

  const Wishlist = {
    ids() { return store.get("wishlist", []).filter(byId); },
    has(id) { return this.ids().includes(id); },
    toggle(id) {
      const ids = this.ids();
      const on = !ids.includes(id);
      store.set("wishlist", on ? [...ids, id] : ids.filter((x) => x !== id));
      updateCounts();
      toast(on ? "Saved to your wishlist" : "Removed from your wishlist");
      return on;
    }
  };

  function updateCounts() {
    const c = Cart.count(), w = Wishlist.ids().length;
    $$("[data-cart-count]").forEach((el) => { el.textContent = c; el.hidden = c === 0; });
    $$("[data-wish-count]").forEach((el) => { el.textContent = w; el.hidden = w === 0; });
  }

  /* ---------- Layout (header/footer shared by every page) ---------- */

  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9Z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
    gem: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h16l6 8-14 16L2 12z" fill="var(--brand)"/><path d="M2 12h28M12 4l-2 8 6 16 6-16-2-8" fill="none" stroke="var(--bg)" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };

  const NAV = [
    ["index.html", "Home"], ["shop.html", "Shop all"], ["shop.html?type=store", "Our originals"],
    ["shop.html?sort=discount", "Deals"], ["about.html", "About"]
  ];

  function renderLayout() {
    const page = location.pathname.split("/").pop() || "index.html";
    const full = page + location.search;
    const isCurrent = (href) => (href === full || (href === page && !location.search)) ? ' aria-current="page"' : "";
    const links = NAV.map(([h, t]) => `<a href="${h}"${isCurrent(h)}>${t}</a>`).join("");

    const header = $("#site-header");
    if (header) {
      header.outerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="announce">Free shipping on TheGemByte originals over ${fmt(SITE.checkout.freeShippingThreshold)} · New picks every week</div>
      <header class="site-header">
        <div class="container header-inner">
          <a class="logo" href="index.html" aria-label="${esc(SITE.name)} home">${ICONS.gem}<span>${esc(SITE.name)}</span></a>
          <nav class="nav" aria-label="Main">${links}</nav>
          <div class="header-actions">
            <form class="header-search" action="shop.html" role="search">
              ${ICONS.search}<label class="sr-only" for="hs">Search products</label>
              <input id="hs" name="q" type="search" placeholder="Search gems…" autocomplete="off">
            </form>
            <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle dark mode">${ICONS.moon}</button>
            <a class="icon-btn" href="wishlist.html" aria-label="Wishlist">${ICONS.heart}<span class="count-badge" data-wish-count hidden>0</span></a>
            <a class="icon-btn" href="cart.html" aria-label="Shopping bag">${ICONS.bag}<span class="count-badge" data-cart-count hidden>0</span></a>
            <button class="icon-btn menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-nav">${ICONS.menu}</button>
          </div>
        </div>
        <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">
          <form action="shop.html" role="search" style="margin:8px 0"><label class="sr-only" for="ms">Search products</label><input class="field" id="ms" name="q" type="search" placeholder="Search gems…"></form>
          ${links}<a href="wishlist.html">Wishlist</a><a href="contact.html">Contact</a>
        </nav>
      </header>`;
    }

    const footer = $("#site-footer");
    if (footer) {
      const cats = CATEGORIES.map((c) => `<li><a href="shop.html?cat=${c.id}">${esc(c.name)}</a></li>`).join("");
      footer.outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="brand-col">
              <a class="logo" href="index.html">${ICONS.gem}<span>${esc(SITE.name)}</span></a>
              <p class="muted" style="margin-top:12px;max-width:30em">${esc(SITE.tagline)} We test, compare and curate products worth your money — plus a growing line of our own originals.</p>
              <p class="disclosure-inline">As an affiliate, we may earn a commission from qualifying purchases at no extra cost to you. <a href="disclosure.html">Learn more</a>.</p>
            </div>
            <div><h4>Shop</h4><ul>${cats}</ul></div>
            <div><h4>Help</h4><ul>
              <li><a href="contact.html">Contact us</a></li>
              <li><a href="shipping.html">Shipping &amp; returns</a></li>
              <li><a href="cart.html">Your bag</a></li>
              <li><a href="wishlist.html">Wishlist</a></li>
            </ul></div>
            <div><h4>Company</h4><ul>
              <li><a href="about.html">About</a></li>
              <li><a href="disclosure.html">Affiliate disclosure</a></li>
              <li><a href="privacy.html">Privacy policy</a></li>
              <li><a href="terms.html">Terms of use</a></li>
            </ul></div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ${esc(SITE.name)}. All rights reserved.</span>
            <span><a href="${esc(SITE.social.instagram)}" rel="noopener" target="_blank">Instagram</a> · <a href="${esc(SITE.social.pinterest)}" rel="noopener" target="_blank">Pinterest</a> · <a href="${esc(SITE.social.youtube)}" rel="noopener" target="_blank">YouTube</a></span>
          </div>
        </div>
      </footer>`;
    }

    const toggle = $(".menu-toggle");
    if (toggle) toggle.addEventListener("click", () => {
      const open = $("#mobile-nav").classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      store.set("theme", next);
    }));
  }

  /* ---------- Product card ---------- */

  function card(p) {
    const off = discount(p);
    const badges = [
      off ? `<span class="badge badge-sale">−${off}%</span>` : "",
      ...(p.badges || []).slice(0, 1).map((b) => `<span class="badge ${p.type === "store" ? "badge-own" : ""}">${esc(b)}</span>`)
    ].join("");
    const url = `product.html?id=${encodeURIComponent(p.id)}`;
    let action;
    if (p.type === "affiliate") {
      action = `<a class="btn btn-primary btn-sm btn-block" href="${esc(affiliateHref(p))}" target="_blank" rel="sponsored nofollow noopener" data-aff="${esc(p.id)}">View on ${esc(p.merchant)} ↗</a>`;
    } else if (inStock(p)) {
      action = `<button class="btn btn-primary btn-sm btn-block" type="button" data-add="${esc(p.id)}">Add to bag</button>`;
    } else {
      action = `<button class="btn btn-outline btn-sm btn-block" type="button" disabled>Sold out</button>`;
    }
    return `
      <article class="card">
        <div class="card-media">
          <div class="card-badges">${badges}</div>
          <button class="icon-btn wish-btn" type="button" data-wish="${esc(p.id)}" aria-pressed="${Wishlist.has(p.id)}" aria-label="Save ${esc(p.name)} to wishlist">${ICONS.heart}</button>
          ${media(p, false)}
        </div>
        <div class="card-body">
          <span class="card-merchant">${p.type === "store" ? "TheGemByte original" : "via " + esc(p.merchant)}</span>
          <h3 class="card-title"><a href="${url}">${esc(p.name)}</a></h3>
          <div class="rating">${stars(p.rating)} <span>${p.rating.toFixed(1)} (${p.reviews.toLocaleString(SITE.locale)})</span></div>
          <div class="price-row">
            <span class="price">${fmt(p.price)}</span>
            ${off ? `<span class="compare">${fmt(p.compareAt)}</span>` : ""}
          </div>
          <div class="card-actions">${action}</div>
        </div>
      </article>`;
  }

  // One delegated listener covers every card, PDP and wishlist button on the page.
  function bindGlobalActions() {
    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add]");
      if (add) {
        const qtyInput = $("#qty");
        Cart.add(add.dataset.add, qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1);
        return;
      }
      const wish = e.target.closest("[data-wish]");
      if (wish) {
        const on = Wishlist.toggle(wish.dataset.wish);
        $$(`[data-wish="${wish.dataset.wish}"]`).forEach((b) => b.setAttribute("aria-pressed", String(on)));
        if (document.body.dataset.page === "wishlist") initWishlist();
        return;
      }
      const aff = e.target.closest("[data-aff]");
      if (aff) {
        const p = byId(aff.dataset.aff);
        track("affiliate_click", { item_id: p.id, item_name: p.name, merchant: p.merchant, value: p.price, currency: SITE.currency });
      }
    });
  }

  /* ---------- Forms ---------- */

  function bindForms() {
    $$("form[data-form]:not([data-bound])").forEach((form) => {
      form.dataset.bound = "";
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const kind = form.dataset.form;
        const msg = $(".form-msg", form);
        const btn = $("button[type=submit]", form);
        const endpoint = (SITE.forms || {})[kind === "preorder" ? "newsletter" : kind];
        const data = new FormData(form);
        data.append("_source", kind);
        if (btn) btn.disabled = true;
        try {
          if (endpoint) {
            const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
            if (!res.ok) throw new Error(res.statusText);
          } else {
            console.warn(`[${SITE.name}] No endpoint configured for "${kind}" form — set SITE.forms in assets/js/config.js.`);
          }
          track("form_submit", { form: kind });
          form.reset();
          if (msg) msg.textContent = form.dataset.success || "Thank you! We'll be in touch.";
        } catch {
          if (msg) msg.textContent = `Something went wrong. Please email us at ${SITE.email}.`;
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    });
  }

  function cookieBar() {
    if (store.get("cookies-ok", false)) return;
    const bar = document.createElement("div");
    bar.className = "cookie-bar";
    bar.innerHTML = `<p>We use cookies and affiliate links to keep ${esc(SITE.name)} running. See our <a href="privacy.html">privacy policy</a>.</p><button class="btn btn-primary btn-sm" type="button">Got it</button>`;
    $("button", bar).addEventListener("click", () => { store.set("cookies-ok", true); bar.remove(); });
    document.body.appendChild(bar);
  }

  /* ---------- Pages ---------- */

  function initHome() {
    const cats = $("#home-categories");
    if (cats) cats.innerHTML = CATEGORIES.map((c) => `
      <a class="cat-tile" href="shop.html?cat=${c.id}">
        <span class="ic" aria-hidden="true">${esc(c.icon)}</span><strong>${esc(c.name)}</strong><small>${esc(c.blurb)}</small>
      </a>`).join("");

    const featured = $("#home-featured");
    if (featured) featured.innerHTML = PRODUCTS.filter((p) => p.featured).slice(0, 4).map(card).join("");

    const deals = $("#home-deals");
    if (deals) deals.innerHTML = [...PRODUCTS].filter((p) => discount(p) > 0).sort((a, b) => discount(b) - discount(a)).slice(0, 4).map(card).join("");

    const originals = $("#home-originals");
    if (originals) originals.innerHTML = PRODUCTS.filter((p) => p.type === "store").slice(0, 4).map(card).join("");
  }

  function initShop() {
    const params = new URLSearchParams(location.search);
    const state = {
      cat: params.get("cat") || "all",
      q: params.get("q") || "",
      sort: params.get("sort") || "featured",
      type: params.get("type") || "all",
      max: params.get("max") || "",
      instock: params.get("instock") === "1"
    };

    const chips = $("#cat-chips");
    chips.innerHTML = [{ id: "all", name: "All" }, ...CATEGORIES]
      .map((c) => `<button class="chip" type="button" data-cat="${c.id}">${esc(c.name)}</button>`).join("");

    const search = $("#shop-q"), sort = $("#shop-sort"), type = $("#shop-type"), max = $("#shop-max"), instock = $("#shop-instock");
    search.value = state.q; sort.value = state.sort; type.value = state.type; max.value = state.max; instock.checked = state.instock;

    function apply() {
      const q = state.q.trim().toLowerCase();
      let list = PRODUCTS.filter((p) =>
        (state.cat === "all" || p.category === state.cat) &&
        (state.type === "all" || p.type === state.type) &&
        (!state.max || p.price <= Number(state.max)) &&
        (!state.instock || inStock(p)) &&
        (!q || [p.name, p.summary, p.merchant, categoryName(p.category), ...(p.highlights || [])].join(" ").toLowerCase().includes(q))
      );
      const sorters = {
        featured: (a, b) => (b.featured - a.featured) || (b.rating - a.rating),
        "price-asc": (a, b) => a.price - b.price,
        "price-desc": (a, b) => b.price - a.price,
        rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
        discount: (a, b) => discount(b) - discount(a)
      };
      list.sort(sorters[state.sort] || sorters.featured);

      $$(".chip", chips).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === state.cat)));
      const cat = CATEGORIES.find((c) => c.id === state.cat);
      $("#shop-title").textContent = state.type === "store" ? "TheGemByte originals" : cat ? cat.name : "Shop all gems";
      $("#shop-blurb").textContent = cat ? cat.blurb : "Every product we've tested and loved, in one place.";
      $("#shop-count").textContent = `${list.length} ${list.length === 1 ? "product" : "products"}`;
      $("#shop-grid").innerHTML = list.length
        ? list.map(card).join("")
        : `<div class="empty" style="grid-column:1/-1"><p><strong>No gems match those filters.</strong></p><button class="btn btn-outline btn-sm" type="button" id="shop-reset">Clear filters</button></div>`;
      const reset = $("#shop-reset");
      if (reset) reset.addEventListener("click", () => { Object.assign(state, { cat: "all", q: "", type: "all", max: "", instock: false }); search.value = ""; type.value = "all"; max.value = ""; instock.checked = false; apply(); });

      const next = new URLSearchParams();
      if (state.cat !== "all") next.set("cat", state.cat);
      if (state.q) next.set("q", state.q);
      if (state.sort !== "featured") next.set("sort", state.sort);
      if (state.type !== "all") next.set("type", state.type);
      if (state.max) next.set("max", state.max);
      if (state.instock) next.set("instock", "1");
      history.replaceState(null, "", "shop.html" + (next.toString() ? "?" + next : ""));
    }

    chips.addEventListener("click", (e) => { const c = e.target.closest("[data-cat]"); if (c) { state.cat = c.dataset.cat; apply(); } });
    search.addEventListener("input", () => { state.q = search.value; apply(); });
    sort.addEventListener("change", () => { state.sort = sort.value; apply(); });
    type.addEventListener("change", () => { state.type = type.value; apply(); });
    max.addEventListener("change", () => { state.max = max.value; apply(); });
    instock.addEventListener("change", () => { state.instock = instock.checked; apply(); });
    apply();
  }

  function initProduct() {
    const id = new URLSearchParams(location.search).get("id");
    const p = byId(id);
    const root = $("#pdp");
    if (!p) {
      root.innerHTML = `<div class="empty" style="grid-column:1/-1"><h2>We couldn't find that gem.</h2><p>It may have sold out or moved.</p><a class="btn btn-primary" href="shop.html">Browse the shop</a></div>`;
      return;
    }
    const off = discount(p);
    document.title = `${p.name} — ${SITE.name}`;
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", p.summary);

    let buy;
    if (p.type === "affiliate") {
      buy = `
        <div class="pdp-actions">
          <a class="btn btn-primary" href="${esc(affiliateHref(p))}" target="_blank" rel="sponsored nofollow noopener" data-aff="${esc(p.id)}">Check price on ${esc(p.merchant)} ↗</a>
          <button class="btn btn-outline" type="button" data-wish="${esc(p.id)}" aria-pressed="${Wishlist.has(p.id)}">♡ Save</button>
        </div>
        <p class="note-box">Prices and availability are set by ${esc(p.merchant)} and may change. We earn a small commission if you buy through this link — it never affects what we recommend. <a href="disclosure.html">How we make money</a>.</p>`;
    } else {
      const ok = inStock(p);
      buy = `
        <p>${ok ? `<span class="stock-ok">● In stock</span> <span class="muted">· ships in 2–4 days</span>` : `<span class="stock-out">● Sold out</span> <span class="muted">· join the list to hear when it's back</span>`}</p>
        <div class="pdp-actions">
          ${ok ? `<div class="qty"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><input id="qty" type="number" min="1" max="${p.stock}" value="1" aria-label="Quantity"><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>
          <button class="btn btn-primary" type="button" data-add="${esc(p.id)}">Add to bag · ${fmt(p.price)}</button>` : ""}
          <button class="btn btn-outline" type="button" data-wish="${esc(p.id)}" aria-pressed="${Wishlist.has(p.id)}">♡ Save</button>
        </div>
        ${ok ? "" : `<form class="subscribe" data-form="preorder" data-success="Done — we'll email you when it's back."><input type="hidden" name="product" value="${esc(p.id)}"><label class="sr-only" for="restock-email">Email</label><input id="restock-email" type="email" name="email" placeholder="you@example.com" required style="border:1px solid var(--line)"><button class="btn btn-primary" type="submit">Notify me</button><p class="form-msg" role="status" style="flex-basis:100%"></p></form>`}
        <p class="note-box">Designed and sold by ${esc(SITE.name)}. 30-day returns · Secure checkout · SKU ${esc(p.sku || p.id)}</p>`;
    }

    root.innerHTML = `
      <div class="pdp-media">${media(p)}</div>
      <div class="pdp-info">
        <span class="eyebrow">${esc(categoryName(p.category))}${p.type === "store" ? " · TheGemByte original" : ""}</span>
        <h1>${esc(p.name)}</h1>
        <div class="rating">${stars(p.rating)} <span>${p.rating.toFixed(1)} · ${p.reviews.toLocaleString(SITE.locale)} reviews</span></div>
        <div class="pdp-price">
          <span class="price">${fmt(p.price)}</span>
          ${off ? `<span class="compare">${fmt(p.compareAt)}</span><span class="save">Save ${off}%</span>` : ""}
        </div>
        <p>${esc(p.summary)}</p>
        <ul class="highlights">${(p.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        ${buy}
      </div>`;

    $("#crumb-cat").innerHTML = `<a href="shop.html?cat=${p.category}">${esc(categoryName(p.category))}</a>`;
    $("#crumb-name").textContent = p.name;

    root.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]");
      if (!step) return;
      const input = $("#qty");
      input.value = Math.max(1, Math.min(p.stock ?? 99, (parseInt(input.value, 10) || 1) + Number(step.dataset.step)));
    });

    const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id)
      .concat(PRODUCTS.filter((x) => x.category !== p.category && x.featured)).slice(0, 4);
    $("#related").innerHTML = related.map(card).join("");

    // Structured data so search engines can show price / rating rich results.
    const ld = {
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.summary,
      sku: p.sku || p.id, category: categoryName(p.category),
      brand: { "@type": "Brand", name: p.type === "store" ? SITE.name : p.merchant },
      aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
      offers: {
        "@type": "Offer", price: p.price, priceCurrency: SITE.currency,
        availability: inStock(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: p.type === "affiliate" ? p.affiliateUrl : `${SITE.url}/product.html?id=${p.id}`
      }
    };
    if (p.image) ld.image = new URL(p.image, SITE.url + "/").toString();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    track("view_item", { item_id: p.id, item_name: p.name, value: p.price, currency: SITE.currency });
  }

  function initCart() {
    const list = $("#cart-lines"), summary = $("#cart-summary");
    const items = Cart.items();
    if (!items.length) {
      list.innerHTML = `<div class="empty"><p><strong>Your bag is empty.</strong></p><p>Affiliate picks are bought directly from the retailer — only TheGemByte originals live in your bag.</p><a class="btn btn-primary" href="shop.html?type=store">Shop our originals</a></div>`;
      summary.hidden = true;
      return;
    }
    summary.hidden = false;
    list.innerHTML = items.map((i) => {
      const p = byId(i.id);
      return `
        <div class="cart-line">
          <a class="thumb" href="product.html?id=${p.id}" tabindex="-1" aria-hidden="true">${media(p, false)}</a>
          <div>
            <div class="cart-line-top"><a href="product.html?id=${p.id}">${esc(p.name)}</a><strong>${fmt(p.price * i.qty)}</strong></div>
            <div class="muted" style="font-size:.85rem">${fmt(p.price)} each</div>
            <div class="cart-line-bottom">
              <div class="qty"><button type="button" data-line="${p.id}" data-d="-1" aria-label="Decrease">−</button><input type="number" value="${i.qty}" min="1" max="${p.stock}" data-line-input="${p.id}" aria-label="Quantity for ${esc(p.name)}"><button type="button" data-line="${p.id}" data-d="1" aria-label="Increase">+</button></div>
              <button class="link-btn" type="button" data-remove="${p.id}">Remove</button>
            </div>
          </div>
        </div>`;
    }).join("");

    const sub = Cart.subtotal();
    const { freeShippingThreshold: free, shippingFlat } = SITE.checkout;
    const ship = sub >= free ? 0 : shippingFlat;
    const pct = Math.min(100, Math.round((sub / free) * 100));
    summary.innerHTML = `
      <h2 style="font-size:1.3rem">Order summary</h2>
      <p style="font-size:.88rem;margin:0">${ship ? `You're ${fmt(free - sub)} away from free shipping.` : "You've unlocked free shipping 🎉"}</p>
      <div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <div class="summary-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${ship ? fmt(ship) : "Free"}</span></div>
      <div class="summary-row summary-total"><span>Total</span><span>${fmt(sub + ship)}</span></div>
      ${SITE.checkout.enabled
        ? `<button class="btn btn-primary btn-block" type="button" id="checkout-btn" style="margin-top:16px">Checkout securely</button>`
        : `<p class="note-box" style="margin-top:16px">Our checkout opens soon. Leave your email and we'll reserve these items and send you a launch-day discount.</p>
           <form data-form="preorder" data-success="You're on the list — we'll email you when checkout opens.">
             <input type="hidden" name="cart" value="${esc(items.map((i) => `${i.id}×${i.qty}`).join(", "))}">
             <label class="sr-only" for="po-email">Email</label>
             <input class="field" id="po-email" type="email" name="email" placeholder="you@example.com" required style="margin-bottom:10px">
             <button class="btn btn-primary btn-block" type="submit">Reserve my items</button>
             <p class="form-msg" role="status"></p>
           </form>`}`;
    bindForms();

    const checkout = $("#checkout-btn");
    if (checkout) checkout.addEventListener("click", () => {
      track("begin_checkout", { value: sub + ship, currency: SITE.currency });
      // Hook your payment provider here (Stripe Checkout, Razorpay, Snipcart…).
      document.dispatchEvent(new CustomEvent("tgb:checkout", { detail: { items: Cart.items(), subtotal: sub, shipping: ship } }));
    });
  }

  function bindCartPage() {
    const list = $("#cart-lines");
    list.addEventListener("click", (e) => {
      const step = e.target.closest("[data-line]");
      if (step) {
        const line = Cart.items().find((i) => i.id === step.dataset.line);
        Cart.setQty(step.dataset.line, line.qty + Number(step.dataset.d));
        initCart();
        return;
      }
      const rm = e.target.closest("[data-remove]");
      if (rm) { Cart.remove(rm.dataset.remove); initCart(); toast("Removed from your bag"); }
    });
    list.addEventListener("change", (e) => {
      const input = e.target.closest("[data-line-input]");
      if (input) { Cart.setQty(input.dataset.lineInput, parseInt(input.value, 10) || 1); initCart(); }
    });
    initCart();
  }

  function initWishlist() {
    const ids = Wishlist.ids();
    $("#wish-grid").innerHTML = ids.length
      ? ids.map((id) => card(byId(id))).join("")
      : `<div class="empty" style="grid-column:1/-1"><p><strong>No saved gems yet.</strong></p><p>Tap the ♡ on any product to keep it here.</p><a class="btn btn-primary" href="shop.html">Start browsing</a></div>`;
  }

  /* ---------- Boot ---------- */

  const savedTheme = store.get("theme", null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  document.addEventListener("DOMContentLoaded", () => {
    renderLayout();
    bindGlobalActions();
    const page = document.body.dataset.page;
    ({ home: initHome, shop: initShop, product: initProduct, cart: bindCartPage, wishlist: initWishlist }[page] || (() => {}))();
    bindForms();
    updateCounts();
    cookieBar();
  });

  window.TGB = { Cart, Wishlist, track, fmt };
})();
