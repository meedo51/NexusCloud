export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeaders(),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    // Optionally trigger clear token / logout event
    console.warn('Unauthorized request');
  }

  return response;
}
