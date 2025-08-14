// frontend/src/app/layout.tsx
'use client'; // This must be at the very top for client components

import { Geist, Geist_Mono } from "next/font/google";
import { ApolloProvider } from '@apollo/client';
import client from '../../lib/apollo-client';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// REMOVED: export const metadata: Metadata = { ... };
// Metadata cannot be exported from a 'use client' component.
// Next.js will generate default metadata, or you can define it in a parent Server Component.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloProvider client={client}>
          {children}
        </ApolloProvider>
      </body>
    </html>
  );
}
