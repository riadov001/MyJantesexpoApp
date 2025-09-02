import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Simple query function
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const token = localStorage.getItem("myjantes_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(queryKey.join("") as string, {
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }

  return await res.json();
};

// Set default query function
queryClient.setDefaultOptions({
  queries: {
    queryFn: defaultQueryFn,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
