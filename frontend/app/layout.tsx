import type { Metadata } from "next";
import "./styles.css";
import "./journey.css";
export const metadata: Metadata = { title: "ClearFit — Resume compatibility", description: "Understand how your resume aligns with a job description." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
