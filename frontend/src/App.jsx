import { useMemo, useState } from "react";

const API_BASE = "http://localhost:5000/api";

async function apiCall(path, method = "GET", body, token = "") {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      data = { message: "Server returned non-JSON response." };
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: {
        message: "Cannot connect to backend API.",
        error: error.message,
        hint: "Make sure backend is running on http://localhost:5000",
      },
    };
  }
}

export default function App() {
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [output, setOutput] = useState({});

  const sessionText = useMemo(() => {
    if (!currentUser) return "Not logged in";
    return `Logged in as ${currentUser.name} (${currentUser.role})`;
  }, [currentUser]);

  const role = currentUser?.role;

  async function handleRegister(e) {
    e.preventDefault();
    const result = await apiCall("/auth/register", "POST", regForm);
    setOutput({ status: result.status, ...result.data });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const result = await apiCall("/auth/login", "POST", loginForm);
    setOutput({ status: result.status, ...result.data });
    if (result.data?.token) {
      setToken(result.data.token);
      setCurrentUser(result.data.user);
    }
  }

  async function runAction(path, method = "GET", body) {
    const result = await apiCall(path, method, body, token);
    setOutput({ status: result.status, ...result.data });
  }

  function logout() {
    setToken("");
    setCurrentUser(null);
    setOutput({ message: "Logged out." });
  }

  return (
    <main className="container">
      <h1>E-Commerce RBAC React Demo</h1>

      <section className="card">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <input
            placeholder="Name"
            value={regForm.name}
            onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            value={regForm.email}
            onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Password"
            value={regForm.password}
            onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
          />
          <select
            value={regForm.role}
            onChange={(e) => setRegForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit">Register</button>
        </form>
      </section>

      <section className="card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
          />
          <button type="submit">Login</button>
        </form>
      </section>

      <section className="card">
        <h2>Role Dashboard</h2>
        <p>{sessionText}</p>
        <div className="actions">
          {!currentUser && <button onClick={() => runAction("/customer/products")}>Public: View Products</button>}

          {role === "ADMIN" && (
            <>
              <button onClick={() => runAction("/admin/users")}>Admin: All Users</button>
              <button onClick={() => runAction("/admin/vendors")}>Admin: Vendors</button>
              <button onClick={() => runAction("/admin/customers")}>Admin: Customers</button>
              <button onClick={() => runAction("/admin/products")}>Admin: All Products</button>
            </>
          )}

          {role === "VENDOR" && (
            <>
              <button onClick={() => runAction("/vendor/products")}>Vendor: My Products</button>
              <button onClick={() => runAction("/vendor/customers")}>Vendor: My Customers</button>
            </>
          )}

          {role === "CUSTOMER" && (
            <>
              <button onClick={() => runAction("/customer/products")}>Customer: View Products</button>
              <button
                onClick={() =>
                  runAction("/customer/orders", "POST", {
                    items: [{ productId: 1, quantity: 1 }],
                  })
                }
              >
                Customer: Place Sample Order
              </button>
              <button onClick={() => runAction("/customer/orders/me")}>Customer: My Orders</button>
            </>
          )}

          {!currentUser && <button disabled>Please login to see role actions</button>}

          <button onClick={logout}>Logout</button>
        </div>
      </section>

      <section className="card">
        <h2>Output</h2>
        <pre>{JSON.stringify(output, null, 2)}</pre>
      </section>
    </main>
  );
}
