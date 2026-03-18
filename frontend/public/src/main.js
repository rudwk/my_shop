import { api, auth } from "./api.js";
import { getPath, matchRoute, navigate, startRouter } from "./router.js";
import {
  clampInt,
  escapeHtml,
  formatDateTime,
  formatMoney,
  setPage,
  toast,
} from "./ui.js";

const state = {
  me: null,
  products: [],
  search: "",
  cart: [],
  orders: [],
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function isSignedIn() {
  return auth.isSignedIn();
}

function requireAuth(redirectPath) {
  if (isSignedIn()) return true;
  navigate(`/signin?next=${encodeURIComponent(redirectPath)}`);
  return false;
}

function parseQuery(path) {
  const [p, qs] = path.split("?");
  const params = new URLSearchParams(qs || "");
  return { path: p || "/", params };
}

function appShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="#/">
          <span class="brand__name">My Shop</span>
        </a>
        <nav class="nav" aria-label="Primary">
          <a href="#/">Products</a>
          <a href="#/orders">Orders</a>
          <a class="pill" href="#/cart" aria-label="Cart">
            <span>Cart</span>
            <span class="pill__count" id="cart-count">0</span>
          </a>
          <span id="auth-slot"></span>
        </nav>
      </header>

      <main class="content">
        <section id="page" class="page"></section>
      </main>

      <footer class="footer">
        <span>
          Frontend uses <span style="font-family: var(--font-mono);">/api</span>
          proxy. Update <span style="font-family: var(--font-mono);">API_TARGET</span>
          to point to backend.
        </span>
      </footer>
    </div>
  `;
}

function renderHeader() {
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = String(getCartCount());

  const authSlot = document.getElementById("auth-slot");
  if (!authSlot) return;

  if (!isSignedIn()) {
    authSlot.innerHTML = `<a class="btn btn--primary" href="#/signin">Sign in</a>`;
    return;
  }

  const name = state.me?.name || state.me?.email || "Account";
  authSlot.innerHTML = `
    <span class="pill" title="${escapeHtml(name)}">
      <span>${escapeHtml(name)}</span>
      <button class="btn" id="btn-logout" type="button">Logout</button>
    </span>
  `;

  const logoutBtn = document.getElementById("btn-logout");
  logoutBtn?.addEventListener("click", () => {
    auth.clear();
    setState({ me: null, cart: [], orders: [] });
    toast({ kind: "info", title: "Signed out", message: "Tokens cleared." });
    navigate("/");
  });
}

function productStockBadge(stock) {
  const s = Number(stock || 0);
  if (s <= 0) return `<span class="badge badge--low">OUT</span>`;
  if (s <= 5) return `<span class="badge badge--low">LOW ${s}</span>`;
  return `<span class="badge">STOCK ${s}</span>`;
}

function pageHome() {
  const wrapper = document.createElement("section");
  wrapper.className = "card";

  wrapper.innerHTML = `
    <div class="hero">
      <div>
        <h1>Warm, simple shopping.</h1>
        <p>Browse products, add to cart, and checkout via the backend API.</p>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn" id="btn-reload" type="button">Reload</button>
        <button class="btn btn--primary" id="btn-sync" type="button">Sync Account</button>
      </div>
    </div>
    <div class="toolbar">
      <div class="search" role="search">
        <span style="font-family: var(--font-mono); font-size: 12px; color: rgba(22,22,22,0.55);">/products</span>
        <input id="search-input" placeholder="Search by name or description" value="${escapeHtml(
          state.search,
        )}" />
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <span class="badge">${state.products.length} items</span>
      </div>
    </div>
    <div class="grid" id="product-grid"></div>
  `;

  wrapper.querySelector("#search-input")?.addEventListener("input", (e) => {
    setState({ search: e.target.value || "" });
  });

  wrapper.querySelector("#btn-reload")?.addEventListener("click", () => {
    void loadProducts(true);
  });

  wrapper.querySelector("#btn-sync")?.addEventListener("click", () => {
    void syncSession();
  });

  const listEl = wrapper.querySelector("#product-grid");
  const q = state.search.trim().toLowerCase();
  const items = state.products.filter((p) => {
    if (!q) return true;
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.description || "").toLowerCase().includes(q)
    );
  });

  if (!items.length) {
    listEl.innerHTML = `<div class="panel"><p style="margin:0; color: var(--muted);">No products found.</p></div>`;
    return wrapper;
  }

  listEl.innerHTML = items
    .map(
      (p) => `
        <article class="product" data-id="${p.id}">
          <div class="product__thumb" aria-hidden="true"></div>
          <div>
            <h3 class="product__title">${escapeHtml(p.name)}</h3>
            <p class="product__desc">${escapeHtml(p.description)}</p>
            <div class="product__meta">
              <span class="price">${escapeHtml(formatMoney(p.price))}</span>
              ${productStockBadge(p.stock)}
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  listEl.querySelectorAll(".product").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id");
      navigate(`/product/${id}`);
    });
  });

  return wrapper;
}

function pageProduct(productIdRaw) {
  const productId = Number(productIdRaw);
  const product = state.products.find((p) => Number(p.id) === productId);

  const wrapper = document.createElement("section");
  wrapper.className = "card panel";

  if (!product) {
    wrapper.innerHTML = `
      <h2>Product</h2>
      <p style="margin:0; color: var(--muted);">Product not found. Try reloading the list.</p>
      <div style="display:flex; gap:10px; margin-top: 12px;">
        <button class="btn" id="btn-back" type="button">Back</button>
        <button class="btn" id="btn-reload" type="button">Reload products</button>
      </div>
    `;
    wrapper
      .querySelector("#btn-back")
      ?.addEventListener("click", () => navigate("/"));
    wrapper
      .querySelector("#btn-reload")
      ?.addEventListener("click", () => void loadProducts(true));
    return wrapper;
  }

  const maxQty = Math.max(1, Number(product.stock || 1));
  wrapper.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 16px; flex-wrap: wrap;">
      <div>
        <h2 style="margin:0;">${escapeHtml(product.name)}</h2>
        <p style="margin:10px 0 0 0; color: var(--muted); line-height: 1.55; max-width: 70ch;">
          ${escapeHtml(product.description)}
        </p>
        <div style="display:flex; gap:10px; flex-wrap: wrap; margin-top: 12px; align-items: center;">
          <span class="price">${escapeHtml(formatMoney(product.price))}</span>
          ${productStockBadge(product.stock)}
          <span class="badge" title="Created at">${escapeHtml(
            formatDateTime(product.createdAt),
          )}</span>
        </div>
      </div>
      <div style="display:grid; gap:10px; min-width: 260px;">
        <div class="field">
          <label for="qty">Quantity</label>
          <input id="qty" type="number" min="1" max="${maxQty}" value="1" />
        </div>
        <button class="btn btn--primary" id="btn-add" type="button">Add to cart</button>
        <button class="btn" id="btn-cart" type="button">Go to cart</button>
      </div>
    </div>
  `;

  wrapper.querySelector("#btn-cart")?.addEventListener("click", () => {
    navigate("/cart");
  });

  wrapper.querySelector("#btn-add")?.addEventListener("click", async () => {
    if (!requireAuth(`/product/${productId}`)) return;
    const qtyEl = wrapper.querySelector("#qty");
    const qty = clampInt(qtyEl?.value ?? 1, 1, maxQty);

    try {
      await api.addToCart(productId, qty);
      toast({
        kind: "info",
        title: "Added",
        message: `${qty} item(s) added to cart.`,
      });
      await refreshCart();
    } catch (e) {
      toast({ kind: "error", title: "Add to cart failed", message: e.message });
    }
  });

  return wrapper;
}

function cartTableRows(cart) {
  if (!cart.length) {
    return `<tr><td colspan="5" style="color: var(--muted);">Cart is empty.</td></tr>`;
  }

  return cart
    .map((item) => {
      const product = item.product ?? {};
      const unit = Number(product.price || 0);
      const qty = Number(item.quantity || 0);
      const subtotal = unit * qty;
      return `
        <tr data-product-id="${product.id}">
          <td>
            <div style="display:grid; gap:4px;">
              <strong>${escapeHtml(product.name ?? "Product")}</strong>
              <span style="color: var(--muted); font-size: 12px;">${escapeHtml(
                product.description ?? "",
              )}</span>
            </div>
          </td>
          <td style="font-family: var(--font-mono);">${escapeHtml(
            formatMoney(unit),
          )}</td>
          <td>
            <input class="qty" type="number" min="1" max="${Math.max(
              1,
              Number(product.stock || 1),
            )}" value="${qty}" style="width: 86px; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.75);" />
          </td>
          <td style="font-family: var(--font-mono);">${escapeHtml(
            formatMoney(subtotal),
          )}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn--primary btn-update" type="button">Update</button>
              <button class="btn btn--danger btn-remove" type="button">Remove</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function computeCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const unit = Number(item?.product?.price || 0);
    const qty = Number(item?.quantity || 0);
    return sum + unit * qty;
  }, 0);
}

function pageCart() {
  const wrapper = document.createElement("section");
  wrapper.className = "card panel";

  const total = computeCartTotal(state.cart);

  wrapper.innerHTML = `
    <div class="two-col">
      <div>
        <h2>Cart</h2>
        <table class="table" aria-label="Cart items">
          <thead>
            <tr>
              <th style="width: 46%;">Item</th>
              <th>Unit</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th style="width: 18%; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="cart-rows">
            ${cartTableRows(state.cart)}
          </tbody>
        </table>
        <div style="display:flex; justify-content: space-between; align-items:center; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
          <button class="btn btn--danger" id="btn-clear" type="button">Clear cart</button>
          <span class="badge">Tip: update quantity before checkout</span>
        </div>
      </div>

      <aside class="card" style="padding: 14px;">
        <h2 style="margin:0 0 10px 0;">Summary</h2>
        <div style="display:grid; gap: 8px;">
          <div style="display:flex; justify-content: space-between; gap: 12px;">
            <span style="color: var(--muted);">Items</span>
            <span style="font-family: var(--font-mono);">${getCartCount()}</span>
          </div>
          <div style="display:flex; justify-content: space-between; gap: 12px;">
            <span style="color: var(--muted);">Total</span>
            <span style="font-family: var(--font-mono);">${escapeHtml(
              formatMoney(total),
            )}</span>
          </div>
        </div>
        <div style="display:flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
          <button class="btn btn--primary" id="btn-checkout" type="button">Checkout</button>
          <button class="btn" id="btn-continue" type="button">Continue shopping</button>
        </div>
        <p style="margin: 12px 0 0 0; color: var(--muted); font-size: 12px; line-height: 1.45;">
          Checkout calls <span style="font-family: var(--font-mono);">POST /order/payment</span>
          and clears the cart on success.
        </p>
      </aside>
    </div>
  `;

  wrapper.querySelector("#btn-continue")?.addEventListener("click", () => {
    navigate("/");
  });

  wrapper.querySelector("#btn-clear")?.addEventListener("click", async () => {
    try {
      await api.clearCart();
      toast({ kind: "info", title: "Cleared", message: "Cart cleared." });
      await refreshCart();
    } catch (e) {
      toast({ kind: "error", title: "Clear failed", message: e.message });
    }
  });

  wrapper
    .querySelector("#btn-checkout")
    ?.addEventListener("click", async () => {
      if (!state.cart.length) {
        toast({
          kind: "warn",
          title: "Empty cart",
          message: "Add items before checkout.",
        });
        return;
      }
      try {
        await api.checkout();
        toast({ kind: "info", title: "Success", message: "Order created." });
        await refreshCart();
        await refreshOrders();
        navigate("/orders");
      } catch (e) {
        toast({ kind: "error", title: "Checkout failed", message: e.message });
      }
    });

  wrapper.querySelectorAll("tr[data-product-id]").forEach((row) => {
    const productId = Number(row.getAttribute("data-product-id"));
    const qtyInput = row.querySelector("input.qty");
    row.querySelector(".btn-update")?.addEventListener("click", async () => {
      const max = Number(qtyInput?.getAttribute("max") || 99);
      const qty = clampInt(qtyInput?.value ?? 1, 1, max);
      try {
        await api.updateCartQuantity(productId, qty);
        toast({ kind: "info", title: "Updated", message: "Quantity updated." });
        await refreshCart();
      } catch (e) {
        toast({ kind: "error", title: "Update failed", message: e.message });
      }
    });
    row.querySelector(".btn-remove")?.addEventListener("click", async () => {
      try {
        await api.removeCartItem(productId);
        toast({ kind: "info", title: "Removed", message: "Item removed." });
        await refreshCart();
      } catch (e) {
        toast({ kind: "error", title: "Remove failed", message: e.message });
      }
    });
  });

  return wrapper;
}

function orderStatusBadge(status) {
  const s = String(status || "").toUpperCase();
  if (s === "CANCELLED") return `<span class="badge badge--low">${escapeHtml(
    s,
  )}</span>`;
  return `<span class="badge">${escapeHtml(s)}</span>`;
}

function pageOrders() {
  const wrapper = document.createElement("section");
  wrapper.className = "card panel";

  const rows = state.orders?.length
    ? state.orders
        .map((o) => {
          const orderedAt = formatDateTime(o.orderedAt);
          const items = Array.isArray(o.items) ? o.items : [];
          const itemLines = items
            .map((it) => {
              const name = it?.product?.name ?? "Product";
              const qty = it?.quantity ?? 0;
              const unit = it?.price ?? it?.product?.price ?? 0;
              return `<li style="margin:0; padding: 4px 0; color: rgba(22,22,22,0.78);">
                <span style="font-family: var(--font-mono);">${escapeHtml(
                  String(qty),
                )}x</span>
                ${escapeHtml(name)}
                <span style="color: var(--muted);">(${escapeHtml(
                  formatMoney(unit),
                )})</span>
              </li>`;
            })
            .join("");

          const canCancel = String(o.status).toUpperCase() === "PAID";
          return `
            <tr data-order-id="${o.id}">
              <td style="font-family: var(--font-mono);">#${escapeHtml(
                String(o.id),
              )}</td>
              <td>${orderStatusBadge(o.status)}</td>
              <td style="font-family: var(--font-mono);">${escapeHtml(
                formatMoney(o.total),
              )}</td>
              <td>${escapeHtml(orderedAt)}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn--danger btn-cancel" type="button" ${
                    canCancel ? "" : "disabled"
                  }>Cancel</button>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="5" style="background: rgba(255,255,255,0.55);">
                <ul style="margin: 0; padding: 8px 18px;">
                  ${itemLines || `<li style="color: var(--muted);">No items loaded.</li>`}
                </ul>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="5" style="color: var(--muted);">No orders yet.</td></tr>`;

  wrapper.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
      <div>
        <h2>Orders</h2>
        <p style="margin:0; color: var(--muted);">Shows <span style="font-family: var(--font-mono);">GET /order</span>.</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn" id="btn-reload" type="button">Reload</button>
        <button class="btn" id="btn-shop" type="button">Shop</button>
      </div>
    </div>

    <div style="margin-top: 12px;">
      <table class="table" aria-label="Orders">
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Total</th>
            <th>Ordered</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  wrapper
    .querySelector("#btn-reload")
    ?.addEventListener("click", () => void refreshOrders(true));
  wrapper.querySelector("#btn-shop")?.addEventListener("click", () => {
    navigate("/");
  });

  wrapper.querySelectorAll("tr[data-order-id]").forEach((row) => {
    const orderId = Number(row.getAttribute("data-order-id"));
    const btn = row.querySelector(".btn-cancel");
    btn?.addEventListener("click", async () => {
      try {
        await api.cancelOrder(orderId);
        toast({
          kind: "info",
          title: "Cancelled",
          message: `Order #${orderId} cancelled.`,
        });
        await refreshOrders(true);
      } catch (e) {
        toast({ kind: "error", title: "Cancel failed", message: e.message });
      }
    });
  });

  return wrapper;
}

function pageSignIn(queryParams) {
  const wrapper = document.createElement("section");
  wrapper.className = "card panel";

  wrapper.innerHTML = `
    <h2>Sign in</h2>
    <p style="margin:0 0 12px 0; color: var(--muted);">Uses <span style="font-family: var(--font-mono);">POST /user/signin</span>.</p>
    <form class="form" id="form-signin">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
      </div>
      <div style="display:flex; gap:10px; flex-wrap: wrap;">
        <button class="btn btn--primary" type="submit">Sign in</button>
        <button class="btn" id="btn-signup" type="button">Create account</button>
      </div>
    </form>
  `;

  wrapper.querySelector("#btn-signup")?.addEventListener("click", () => {
    const next = queryParams?.get("next");
    navigate(`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  });

  wrapper.querySelector("#form-signin")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const tokens = await api.signIn({ email, password });
      auth.setTokens(tokens);
      toast({ kind: "info", title: "Signed in", message: "Token stored." });
      await syncSession();
      const next = queryParams?.get("next") || "/";
      navigate(next);
    } catch (err) {
      toast({ kind: "error", title: "Sign in failed", message: err.message });
    }
  });

  return wrapper;
}

function pageSignUp(queryParams) {
  const wrapper = document.createElement("section");
  wrapper.className = "card panel";

  wrapper.innerHTML = `
    <h2>Create account</h2>
    <p style="margin:0 0 12px 0; color: var(--muted);">Uses <span style="font-family: var(--font-mono);">POST /user/signup</span>.</p>
    <form class="form" id="form-signup">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="new-password" minlength="4" maxlength="20" required />
      </div>
      <div class="field">
        <label for="name">Name</label>
        <input id="name" name="name" type="text" autocomplete="name" required />
      </div>
      <div class="field">
        <label for="address">Address</label>
        <input id="address" name="address" type="text" autocomplete="street-address" required />
      </div>
      <div style="display:flex; gap:10px; flex-wrap: wrap;">
        <button class="btn btn--primary" type="submit">Sign up</button>
        <button class="btn" id="btn-signin" type="button">I already have an account</button>
      </div>
    </form>
  `;

  wrapper.querySelector("#btn-signin")?.addEventListener("click", () => {
    const next = queryParams?.get("next");
    navigate(`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  });

  wrapper.querySelector("#form-signup")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
      name: String(fd.get("name") || "").trim(),
      address: String(fd.get("address") || "").trim(),
    };

    try {
      const tokens = await api.signUp(payload);
      auth.setTokens(tokens);
      toast({ kind: "info", title: "Signed up", message: "Token stored." });
      await syncSession();
      const next = queryParams?.get("next") || "/";
      navigate(next);
    } catch (err) {
      toast({ kind: "error", title: "Sign up failed", message: err.message });
    }
  });

  return wrapper;
}

function render() {
  renderHeader();

  const { path, params } = parseQuery(getPath());

  let page = null;

  if (path === "/") page = pageHome();

  const productParams = matchRoute(path, "/product/:id");
  if (productParams) page = pageProduct(productParams.id);

  if (path === "/cart") {
    if (!requireAuth("/cart")) return;
    page = pageCart();
  }

  if (path === "/orders") {
    if (!requireAuth("/orders")) return;
    page = pageOrders();
  }

  if (path === "/signin") page = pageSignIn(params);
  if (path === "/signup") page = pageSignUp(params);

  if (!page) {
    const notFound = document.createElement("section");
    notFound.className = "card panel";
    notFound.innerHTML = `
      <h2>Not found</h2>
      <p style="margin:0; color: var(--muted);">Unknown route: <span style="font-family: var(--font-mono);">${escapeHtml(
        path,
      )}</span></p>
      <div style="margin-top: 12px;"><button class="btn" id="btn-home" type="button">Go home</button></div>
    `;
    notFound.querySelector("#btn-home")?.addEventListener("click", () => {
      navigate("/");
    });
    page = notFound;
  }

  setPage(page);
}

function demoProducts() {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      name: "Citrus Ceramic Mug",
      description: "Warm glaze, bright mornings, zero fuss.",
      price: 12900,
      stock: 12,
      createdAt: now,
    },
    {
      id: 2,
      name: "Linen Tote Bag",
      description: "Soft structure. Carries books, groceries, and plans.",
      price: 18900,
      stock: 7,
      createdAt: now,
    },
    {
      id: 3,
      name: "Desk Lamp (Amber)",
      description: "A small sun for late-night focus.",
      price: 35900,
      stock: 3,
      createdAt: now,
    },
    {
      id: 4,
      name: "Scented Candle: Cedar",
      description: "Clean burn with a calm, woody finish.",
      price: 21900,
      stock: 0,
      createdAt: now,
    },
    {
      id: 5,
      name: "Notebook Set",
      description: "Three slim notebooks for daily notes and sketches.",
      price: 9900,
      stock: 24,
      createdAt: now,
    },
    {
      id: 6,
      name: "Kitchen Timer",
      description: "Minimal dial. Maximum peace of mind.",
      price: 14900,
      stock: 9,
      createdAt: now,
    },
  ];
}

async function loadProducts(force = false) {
  if (state.products.length && !force) return;
  try {
    const products = await api.listProducts();
    setState({ products: Array.isArray(products) ? products : [] });
  } catch {
    setState({ products: demoProducts() });
    toast({
      kind: "warn",
      title: "API unavailable",
      message: "Showing demo products. Start the backend to enable cart/checkout.",
      timeoutMs: 5200,
    });
  }
}

async function refreshCart() {
  if (!isSignedIn()) return;
  try {
    const cart = await api.getCart();
    setState({ cart: Array.isArray(cart) ? cart : [] });
  } catch {
    setState({ cart: [] });
  }
}

async function refreshOrders(forceToast = false) {
  if (!isSignedIn()) return;
  try {
    const orders = await api.listOrders();
    setState({ orders: Array.isArray(orders) ? orders : [] });
    if (forceToast) toast({ kind: "info", title: "Orders", message: "Updated." });
  } catch (e) {
    if (forceToast) toast({ kind: "error", title: "Orders", message: e.message });
  }
}

async function syncSession() {
  if (!isSignedIn()) return;
  try {
    const me = await api.getMe();
    const safeMe = me
      ? {
          id: me.id,
          email: me.email,
          name: me.name,
          address: me.address,
          role: me.role,
          createdAt: me.createdAt,
        }
      : null;

    setState({ me: safeMe });
    await refreshCart();
    await refreshOrders();
  } catch {
    auth.clear();
    setState({ me: null, cart: [], orders: [] });
    toast({ kind: "warn", title: "Session expired", message: "Please sign in again." });
    navigate("/signin");
  }
}

function boot() {
  appShell();
  startRouter(() => render());
  void loadProducts(false);
  if (isSignedIn()) void syncSession();
  render();
}

boot();

