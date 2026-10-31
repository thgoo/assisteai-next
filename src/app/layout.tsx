import type { Metadata } from 'next';
import { Lato, Open_Sans as OpenSans } from 'next/font/google';
import Header from '@/components/Header/Header';
import Providers from '@/components/Providers/Providers';
import { SITE_URL } from '@/lib/config';
import './globals.scss';

const openSans = OpenSans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({ subsets: ['latin'], weight: ['100', '300', '400', '700', '900'], variable: '--font-lato' });

const DESCRIPTION = 'Filmes e séries que a galera assistiu, e o que achou de cada um.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Assiste Aí',
  description: DESCRIPTION,
  // The preview of a shared link (WhatsApp, Telegram...)
  openGraph: {
    siteName: 'Assiste Aí',
    title: 'Assiste Aí',
    description: DESCRIPTION,
    locale: 'pt_BR',
    type: 'website',
    images: ['/img/logo-square.png'],
  },
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
