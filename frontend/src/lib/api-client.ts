export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");

    // Store current path before redirect so user can return after re-login
    localStorage.setItem(
      "redirectAfterLogin",
      window.location.pathname + window.location.search,
    );

    // Use history.replaceState to preserve history stack instead of window.location.href
    window.history.replaceState(null, "", "/");
    window.location.reload();
  }

  return res;
}
