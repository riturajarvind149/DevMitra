"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30s default stale time — short enough to feel fresh
            staleTime: 30 * 1000,
            // Re-fetch when user switches back to the tab — this is the main
            // fix for "I have to refresh the page to see new messages/notifs"
            refetchOnWindowFocus: true,
            // Also re-fetch when the component remounts (navigating back to a page)
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={true}
        storageKey="devmitra-theme"
        themes={["light", "dark", "system"]}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
