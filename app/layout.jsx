import './globals.css';
import { AuthProvider } from '../lib/AuthContext';
import { ExamProvider } from '../lib/ExamContext';

export const metadata = {
  title: 'Studivo',
  description: 'Study tracker and MCQ practice tests',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Studivo', statusBarStyle: 'default' },
};

export const viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ExamProvider>{children}</ExamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
