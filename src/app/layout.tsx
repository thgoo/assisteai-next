import type { Metadata } from 'next';
import { Lato, Open_Sans as OpenSans } from 'next/font/google';
import Header from '@/components/Header/Header';
import Providers from '@/components/Providers/Providers';
import './globals.scss';

const openSans = OpenSans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({ subsets: ['latin'], weight: ['100', '300', '400', '700', '900'], variable: '--font-lato' });

export const metadata: Metadata = {
  title: 'Assiste Aí',
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
