import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Argus',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="max-w-[680px] mx-auto px-6 py-24">
        <Link href="/" className="text-[#FA4500] text-sm hover:underline mb-8 inline-block">&larr; Back to home</Link>
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-12">Last updated: February 22, 2026</p>

        <div className="space-y-8 text-[15px] leading-[1.8] text-white/60">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>When you use Argus, we collect the following information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Account information:</strong> email address and name when you sign up.</li>
              <li><strong className="text-white/80">Usage data:</strong> URLs you submit for cloning, build history, and feature usage.</li>
              <li><strong className="text-white/80">Payment information:</strong> processed securely by Stripe. We do not store card details.</li>
              <li><strong className="text-white/80">Technical data:</strong> browser type, IP address, and device information for analytics and security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and maintain the Argus service.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Send transactional emails (welcome, billing, security).</li>
              <li>Improve the product and fix bugs.</li>
              <li>Prevent abuse and enforce rate limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Supabase:</strong> authentication and database hosting.</li>
              <li><strong className="text-white/80">Stripe:</strong> payment processing.</li>
              <li><strong className="text-white/80">Vercel:</strong> hosting and sandbox execution.</li>
              <li><strong className="text-white/80">AI providers:</strong> (Anthropic, Google, OpenAI) for code generation — only the URL and prompt you provide are sent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Build history is retained for 90 days. You can request deletion of your data at any time by emailing <a href="mailto:hello@argus.build" className="text-[#FA4500] hover:underline">hello@argus.build</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights (GDPR)</h2>
            <p>If you are in the EU/EEA, you have the right to access, rectify, delete, or export your personal data. Contact us at <a href="mailto:hello@argus.build" className="text-[#FA4500] hover:underline">hello@argus.build</a> to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:hello@argus.build" className="text-[#FA4500] hover:underline">hello@argus.build</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
