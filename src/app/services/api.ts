const API_URL = "http://localhost:4000/api"

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    /* extraemos el token del localstore */
    const token = localStorage.getItem("jvToken");
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!res.ok) {
        throw new Error(`Api error: ${res.status}`);
    }

    return res.json();
}
