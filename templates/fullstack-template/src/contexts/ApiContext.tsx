import { jsx, createContext, useContext } from 'frontend-hamroun';

interface ApiContextType {
  request: (url: string, options?: RequestInit) => Promise<any>;
  get: (url: string) => Promise<any>;
  post: (url: string, data?: any) => Promise<any>;
  put: (url: string, data?: any) => Promise<any>;
  delete: (url: string) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: any }) {
  const request = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  const get = (url: string) => request(url, { method: 'GET' });
  
  const post = (url: string, data?: any) => request(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });
  
  const put = (url: string, data?: any) => request(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });
  
  const del = (url: string) => request(url, { method: 'DELETE' });

  return (
    <ApiContext.Provider value={{
      request,
      get,
      post,
      put,
      delete: del
    }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
