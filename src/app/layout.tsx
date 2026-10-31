import type { Metadata, Viewport } from 'next';
import { Lato, Open_Sans as OpenSans } from 'next/font/google';
import Header from '@/components/Header/Header';
import Providers from '@/components/Providers/Providers';
import './globals.scss';

const openSans = OpenSans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({ subsets: ['latin'], weight: ['100', '300', '400', '700', '900'], variable: '--font-lato' });

export const metadata: Metadata = {
  title: 'Assiste Aí',
};

// The page may draw under the iPhone's status bar and notch, so the backdrop reaches the screen's top edge; the header
// keeps its content clear of them (`env(safe-area-inset-*)`)
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#202225',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${openSans.variable} ${lato.variable}`}>
      <body>
        <main>
          <Providers>
            <Header />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}
