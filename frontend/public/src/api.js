const ACCESS_TOKEN_KEY = "myshop_access_token";
const REFRESH_TOKEN_KEY = "myshop_refresh_token";

function getStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

async function readJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export const auth = {
  get accessToken() {
    return getStored(ACCESS_TOKEN_KEY);
  },
  get refreshToken() {
    return getStored(REFRESH_TOKEN_KEY);
  },
  setTokens(tokens) {
    if (tokens?.accessToken) setStored(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens?.refreshToken) setStored(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clear() {
    removeStored(ACCESS_TOKEN_KEY);
    removeStored(REFRESH_TOKEN_KEY);
  },
  isSignedIn() {
    return Boolean(getStored(ACCESS_TOKEN_KEY));
  },
};

async function apiRequest(path, options = {}) {
  const { method = "GET", body, authRequired = false, headers = {} } = options;

  const finalHeaders = { ...headers };
  if (body != null) finalHeaders["Content-Type"] = "application/json";

  if (authRequired) {
    const token = auth.accessToken;
    if (!token) {
      const err = new Error("Not signed in");
      err.code = "NO_TOKEN";
      throw err;
    }
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers: finalHeaders,
    body: body == null ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await readJsonSafe(res);
    const message =
      (typeof data?.message === "string" && data.message) ||
      (Array.isArray(data?.message) && data.message.join(", ")) ||
      res.statusText ||
      "Request failed";

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return readJsonSafe(res);
}

export const api = {
  async signUp(payload) {
    return apiRequest("/user/signup", { method: "POST", body: payload });
  },
  async signIn(payload) {
    return apiRequest("/user/signin", { method: "POST", body: payload });
  },
  async getMe() {
    return apiRequest("/", { authRequired: true });
  },
  async listProducts() {
    return apiRequest("/products/find/all");
  },
  async getCart() {
    return apiRequest("/carts/find", { authRequired: true });
  },
  async addToCart(productId, quantity) {
    return apiRequest("/carts/add", {
      method: "POST",
      authRequired: true,
      body: { productId, quantity },
    });
  },
  async updateCartQuantity(productId, quantity) {
    return apiRequest("/carts", {
      method: "PATCH",
      authRequired: true,
      body: { productId, quantity },
    });
  },
  async removeCartItem(productId) {
    const token = auth.accessToken;
    if (!token) throw new Error("Not signed in");

    // backend returns no body; tolerate both 200 and 204.
    const res = await fetch(`/api/carts/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await readJsonSafe(res);
      const err = new Error(data?.message || res.statusText || "Request failed");
      err.status = res.status;
      throw err;
    }
    return null;
  },
  async clearCart() {
    return apiRequest("/carts", { method: "DELETE", authRequired: true });
  },
  async checkout() {
    return apiRequest("/order/payment", { method: "POST", authRequired: true });
  },
  async listOrders() {
    return apiRequest("/order", { authRequired: true });
  },
  async cancelOrder(orderId) {
    return apiRequest(`/order/${orderId}/cancel`, {
      method: "PATCH",
      authRequired: true,
    });
  },
};

