import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TabSyncManager } from "@/components/tab-sync-manager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "バーテンダーAI - カクテル推薦チャットボット",
  description: "音声対話でカクテルを推薦するAIバーテンダー",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TabSyncManager />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
