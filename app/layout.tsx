import type { Metadata, Viewport } from 'next';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Focus Timer',
    template: '%s | Focus Timer'
  },
  description: 'Privacy-first focus stopwatch with local webcam presence and alertness tracking.',
  applicationName: 'Focus Timer',
  keywords: [
    'focus timer',
    'study timer',
    'pomodoro alternative',
    'presence detection',
    'webcam stopwatch',
    'student productivity'
  ],
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Focus Timer',
    description: 'Local webcam-based presence tracking to run your stopwatch only while you are present and awake.',
    siteName: 'Focus Timer'
  },
  twitter: {
    card: 'summary',
    title: 'Focus Timer',
    description: 'Run your study timer automatically when you are present and alert.'
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  },
  manifest: '/site.webmanifest'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
