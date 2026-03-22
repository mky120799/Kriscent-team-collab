const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5555/api";

// 1. Remove trailing slash
const sanitizedUrl = rawUrl.replace(/\/$/, "");

// 2. Ensure it ends with /api for the API calls
export const API_BASE_URL = sanitizedUrl.endsWith("/api")
  ? sanitizedUrl
  : `${sanitizedUrl}/api`;

// 3. Get the root URL for socket.io (remove /api)
export const ROOT_URL = API_BASE_URL.replace(/\/api$/, "");

console.log("🌐 API Base URL:", API_BASE_URL);
console.log("🔌 Root URL (Socket):", ROOT_URL);
