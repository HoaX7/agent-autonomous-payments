const requester = async <T = Record<string, any>>({
    url,
    method,
    data,
    headers
}: {
    url: string;
    method: "GET" | "POST";
    data?: T;
    headers?: RequestInit["headers"]
}) => {
    try {
        const baseUrl = import.meta.env.VITE_PUBLIC_RETAIL_API;
        const request: RequestInit = {
            method,
            headers: {
                "content-type": "application/json",
                ...headers
            }
        };
        if (method === "GET" && data) {
            const queryParams = new URLSearchParams(data as any).toString();
            url += `?${queryParams}`;
        } else if (data) {
            request.body = JSON.stringify(data);
        }
        const response = await fetch(`${baseUrl}/${url}`, request)
        if (!response.ok) throw await response.json();
        return response.json()
    } catch (err) {
        throw err;
    }
}

export default requester;
