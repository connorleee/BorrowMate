import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-base text-text-primary antialiased">
                <ThemeProvider>
                    <div className="flex min-h-screen">
                        <Sidebar />
                        <main className="flex-1 flex flex-col items-center w-full md:translate-x-0">
                            <div className="flex-1 w-full flex flex-col gap-20 items-center">
                                <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3 w-full pt-16 md:pt-0">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
