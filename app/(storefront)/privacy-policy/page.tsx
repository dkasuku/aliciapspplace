import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Privacy Policy — Alicia Phone Place" };

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-12">
      <div className="mx-auto max-w-3xl mb-6">
        <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534] hover:text-[#14532d]">← Back to home</Link>
      </div>
      <article className="mx-auto max-w-3xl rounded-2xl border border-[#e2ece4] bg-white p-6 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-[#0f172a] md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#64748b]">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#0f172a]/80">
          <section>
            <h2 className="font-bold text-[#0f172a]">1. Introduction</h2>
            <p className="mt-2">Alicia Phone Place (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a phone and technology store located in Juja, Kenya. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website or purchase products from us.</p>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">2. Information We Collect</h2>
            <p className="mt-2">We may collect the following types of information:</p>
            <ul className="mt-2 list-disc pl-5">
              <li><strong>Contact information:</strong> name, phone number, email address, and delivery address when you place an order.</li>
              <li><strong>Order information:</strong> products purchased, payment method, and transaction details.</li>
              <li><strong>Communication data:</strong> messages you send to our AI assistant or customer care team.</li>
              <li><strong>Technical data:</strong> browser type, device information, and usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">3. How We Use Your Information</h2>
            <p className="mt-2">We use your information to:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Process and deliver your orders</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send order confirmations and delivery updates</li>
              <li>Improve our website, products, and services</li>
              <li>Prevent fraud and ensure secure transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">4. Data Sharing</h2>
            <p className="mt-2">We do not sell your personal information. We may share your data with trusted third-party service providers (e.g., payment processors, delivery partners) solely to fulfill your orders. These providers are obligated to keep your information confidential.</p>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">5. Data Security</h2>
            <p className="mt-2">We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or disclosure. All payments are processed through secure, encrypted payment gateways.</p>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">6. Cookies</h2>
            <p className="mt-2">Our website may use cookies to improve your browsing experience, remember preferences, and analyze traffic. You can disable cookies in your browser settings, but some features may not function properly.</p>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">7. Your Rights</h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[#0f172a]">8. Contact Us</h2>
            <p className="mt-2">If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Phone / WhatsApp: +254 724 126 009</li>
              <li>Email: aliciaphoneplaceke@gmail.com</li>
              <li>Location: Juja town, Kenya</li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
