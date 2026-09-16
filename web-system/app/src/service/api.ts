const API_URL = import.meta.env.VITE_API_URL;

export async function api(
    endpoint: string,
    options?: RequestInit
) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}