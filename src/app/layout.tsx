import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Onboarding Project Builder",
    description: "Build rich onboarding experiences for your team",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="bg-[#1e1e1e] text-[#cccccc] h-screen overflow-hidden">
                {children}
            </body>
        </html>
    );
}
