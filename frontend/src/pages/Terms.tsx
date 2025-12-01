import { Link } from 'react-router'

export function Terms() {
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

        <h1 className="text-4xl font-serif font-medium text-ink mb-8">Terms of Service</h1>
        <p className="text-ink-light mb-8">Last updated: November 30, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-ink">
          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">1. Acceptance of Terms</h2>
            <p className="text-ink-light leading-relaxed">
              By accessing or using Triptab (the "Service"), operated by nshipman LLC, you agree to be bound
              by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">2. Description of Service</h2>
            <p className="text-ink-light leading-relaxed">
              Triptab is a collaborative travel planning application that helps users create, manage, and share
              trip itineraries. Features include AI-powered email parsing, expense tracking, checklists, and
              personalized recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">3. User Accounts</h2>
            <p className="text-ink-light leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">4. Acceptable Use</h2>
            <p className="text-ink-light leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-ink-light space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Share content that is harmful, offensive, or infringes on others' rights</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer or attempt to extract source code from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">5. User Content</h2>
            <p className="text-ink-light leading-relaxed mb-4">
              You retain ownership of content you create on the Service (trip details, itineraries, notes).
              By using the Service, you grant us a license to store, display, and process your content to
              provide the Service.
            </p>
            <p className="text-ink-light leading-relaxed">
              When you share a trip with others, you authorize us to make that content available to the
              people you've shared it with.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">6. AI Features</h2>
            <p className="text-ink-light leading-relaxed">
              The Service includes AI-powered features for parsing travel confirmations and generating
              recommendations. These features are provided "as is" and may not always be accurate. You are
              responsible for verifying all travel details and bookings independently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">7. Third-Party Services</h2>
            <p className="text-ink-light leading-relaxed">
              The Service may include links to third-party websites and services (such as booking platforms).
              We are not responsible for the content, terms, or practices of these third parties. Any bookings
              or transactions you make through third-party services are solely between you and that third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">8. Intellectual Property</h2>
            <p className="text-ink-light leading-relaxed">
              The Service, including its design, features, and content (excluding user content), is owned by
              nshipman LLC and protected by intellectual property laws. You may not copy, modify, or distribute
              our proprietary content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-ink-light leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              WE ARE NOT A TRAVEL AGENCY AND DO NOT GUARANTEE THE ACCURACY OF TRAVEL INFORMATION OR
              RECOMMENDATIONS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">10. Limitation of Liability</h2>
            <p className="text-ink-light leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NSHIPMAN LLC SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, REVENUE, OR
              PROFITS, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT
              YOU PAID US IN THE PAST 12 MONTHS, IF ANY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">11. Indemnification</h2>
            <p className="text-ink-light leading-relaxed">
              You agree to indemnify and hold harmless nshipman LLC from any claims, damages, or expenses
              arising from your use of the Service, your violation of these Terms, or your violation of any
              rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">12. Termination</h2>
            <p className="text-ink-light leading-relaxed">
              We may suspend or terminate your access to the Service at any time for any reason, including
              violation of these Terms. You may delete your account at any time. Upon termination, your right
              to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">13. Changes to Terms</h2>
            <p className="text-ink-light leading-relaxed">
              We may modify these Terms at any time. We will notify you of material changes by posting the
              updated Terms on this page. Your continued use of the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">14. Governing Law</h2>
            <p className="text-ink-light leading-relaxed">
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of
              law principles. Any disputes shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-medium mb-4">15. Contact Us</h2>
            <p className="text-ink-light leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-ink-light mt-4">
              nshipman LLC<br />
              Email: support@triptab.io
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
