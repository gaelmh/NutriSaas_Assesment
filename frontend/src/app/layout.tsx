// Client-side component, necessary for handling private chatbot interactions
'use client'; 

// Import fonts from 'next/font/google' and the Apollo Client library components & CSS global file
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloProvider } from '@apollo/client';
import client from '../../lib/apollo-client';
import "./globals.css";

// Configure and load the Geist font family for sans-serif
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure and load the Geist Mono font family for monospace
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The root layout component for the application
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
        {/* Wrap the entire application in the ApolloProvider. */}
        {/* This makes the Apollo Client instance available to all components inside. */}
        <ApolloProvider client={client}>
          {children}
        </ApolloProvider>
      </body>
    </html>
  );
}
