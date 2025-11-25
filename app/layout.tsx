import TopNav from "@/components/TopNav";
import "./globals.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-background text-foreground antialiased">
                <main className="min-h-screen flex flex-col items-center">
                    <TopNav />
                    <div className="flex-1 w-full flex flex-col gap-20 items-center">
                        <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3 w-full">
                            {children}
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}
