import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getAuthToken } from "./lib/authToken";

// Ensure all API requests include credentials (cookies) and Bearer token when available
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("/api/")) {
    const headers = new Headers(init?.headers);
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return originalFetch.call(this, input, { ...init, credentials: "include", headers });
  }
  return originalFetch.call(this, input, init);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

