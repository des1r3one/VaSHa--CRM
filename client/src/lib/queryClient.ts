import { QueryClient } from "@tanstack/react-query";

// Создаем экземпляр QueryClient с настройками
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

// Функция для выполнения запросов к API с автоматическим добавлением токена
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Получаем токен из localStorage
  const token = localStorage.getItem("token");

  // Создаем заголовки с токеном авторизации
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Выполняем запрос с обновленными заголовками
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Если получаем 401 (Unauthorized), очищаем данные пользователя
  if (response.status === 401) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Перенаправляем на страницу авторизации
    window.location.href = "/auth";
  }

  return response;
}

// Функция для выполнения GET-запросов
export async function fetchData<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка при запросе ${url}`);
  }
  
  return response.json();
}

// Функция для выполнения POST-запросов
export async function postData<T>(url: string, data: any): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка при запросе ${url}`);
  }
  
  return response.json();
}

// Функция для выполнения PUT-запросов
export async function putData<T>(url: string, data: any): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка при запросе ${url}`);
  }
  
  return response.json();
}

// Функция для выполнения DELETE-запросов
export async function deleteData<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка при запросе ${url}`);
  }
  
  return response.json();
}
