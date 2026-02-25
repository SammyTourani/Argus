import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center px-6">
      <div className="text-[#FA4500] text-sm font-mono mb-4">404</div>
      <h1 className="text-4xl font-bold text-white mb-4">Page not found</h1>
      <p className="text-white/50 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="text-[#FA4500] hover:underline">&larr; Back to home</Link>
    </div>
  );
}
