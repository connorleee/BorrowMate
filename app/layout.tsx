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
                            <div className="flex-1 flex flex-col gap-8 max-w-4xl px-6 md:px-8 w-full pt-20 md:pt-8 pb-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
