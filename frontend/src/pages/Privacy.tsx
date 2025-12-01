import { Link } from 'react-router'

export function Privacy() {
  return (
    <div className="min-h-screen bg-sand">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/" className="mb-8 flex items-center gap-2 font-serif text-xl font-medium text-forest tracking-tight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Triptab
        </Link>

        <h1 className="text-4xl font-serif font-medium text-ink mb-8">Privacy Policy</h1>
        <p className="text-ink-light mb-8">Last updated: November 30, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-ink">
          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">1. Introduction</h2>
            <p className="text-ink-light leading-relaxed">
              Triptab ("we," "our," or "us"), operated by nshipman LLC, is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
              use our travel planning application and website at triptab.io (the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mb-2">Personal Information</h3>
            <p className="text-ink-light leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Name and email address</li>
              <li>Profile picture (if signing in with Google)</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Trip Information</h3>
            <p className="text-ink-light leading-relaxed mb-4">
              When you use our Service, we collect:
            </p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Trip details (destinations, dates, preferences)</li>
              <li>Itinerary items (flights, hotels, activities)</li>
              <li>Expense information you choose to track</li>
              <li>Checklists and notes</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-6">Usage Information</h3>
            <p className="text-ink-light leading-relaxed">
              We automatically collect certain information about your device and usage of the Service,
              including IP address, browser type, and pages visited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">3. How We Use Your Information</h2>
            <p className="text-ink-light leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your trip planning requests</li>
              <li>Generate AI-powered recommendations and parse travel confirmations</li>
              <li>Enable trip sharing and collaboration features</li>
              <li>Send you service-related communications</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">4. Information Sharing</h2>
            <p className="text-ink-light leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li><strong>Other trip members:</strong> When you share a trip, other members can see trip details</li>
              <li><strong>Service providers:</strong> Third parties that help us operate the Service (hosting, AI services)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">5. Third-Party Services</h2>
            <p className="text-ink-light leading-relaxed">
              Our Service integrates with third-party services including Google (for authentication) and
              OpenAI (for AI features). These services have their own privacy policies, and we encourage
              you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">6. Data Security</h2>
            <p className="text-ink-light leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal
              information. However, no method of transmission over the Internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">7. Your Rights</h2>
            <p className="text-ink-light leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your trip data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">8. Children's Privacy</h2>
            <p className="text-ink-light leading-relaxed">
              The Service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">9. Changes to This Policy</h2>
            <p className="text-ink-light leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">10. Contact Us</h2>
            <p className="text-ink-light leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-ink-light mt-4">
              nshipman LLC<br />
              Email: privacy@triptab.io
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-dark">
          <Link to="/" className="text-terracotta hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
