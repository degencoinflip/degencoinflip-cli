import { Providers } from '@/components/Providers';
import { FlipCard } from '@/components/FlipCard';

export default function Home() {
  return (
    <Providers>
      <main className="flex min-h-screen items-center justify-center">
        <FlipCard />
      </main>
    </Providers>
  );
}
