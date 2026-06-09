export default function TermsPage() {
  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>

      <p className="text-gray-600 mb-6">
        By using WorkπServ, you agree to the following terms and conditions. Please read them carefully.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">1. Acceptance of Terms</h2>
      <p className="text-gray-600 mb-6">
        By using WorkπServ, you confirm that you have read, understood, and agreed to these terms. If you do not agree, please do not use the platform.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">2. Service Description</h2>
      <p className="text-gray-600 mb-2">WorkπServ is a freelance platform that allows users to:</p>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>Publish and sell professional services in Pi</li>
        <li>Purchase services from professional freelancers</li>
        <li>Communicate and manage projects within the platform</li>
        <li>Make secure payments in Pi cryptocurrency</li>
      </ul>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">3. User Account</h2>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>You must have an active Pi Network account to use the platform</li>
        <li>You are responsible for maintaining the security of your account</li>
        <li>You must be 18 years of age or older</li>
        <li>Your information must be accurate and truthful</li>
      </ul>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">4. Code of Conduct</h2>
      <p className="text-gray-600 mb-2">Users are prohibited from:</p>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>Posting fake or misleading content</li>
        <li>Fraud or manipulation of payments</li>
        <li>Violating intellectual property rights</li>
        <li>Harassing or abusing other users</li>
        <li>Posting illegal or offensive content</li>
      </ul>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">5. Payments & Commissions</h2>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>All payments are made in Pi via Pi Network</li>
        <li>The platform takes a commission on each successful transaction</li>
        <li>Payments are held in escrow until service completion</li>
        <li>In case of dispute, the platform will mediate between parties</li>
      </ul>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">6. Cancellations & Refunds</h2>
      <p className="text-gray-600 mb-6">
        An order can be cancelled and refunded if the seller has not started work within the agreed timeframe, or if the service description was not fulfilled.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">7. Disclaimer</h2>
      <p className="text-gray-600 mb-6">
        WorkπServ is an intermediary platform. We are not responsible for the quality of services provided by sellers. Each seller is fully responsible for their services.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">8. Account Suspension</h2>
      <p className="text-gray-600 mb-6">
        We reserve the right to suspend or terminate any account that violates these terms or compromises platform integrity.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">9. Modification of Terms</h2>
      <p className="text-gray-600 mb-6">
        We reserve the right to modify these terms at any time. You will be notified of any significant changes via the app.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">10. Contact Us</h2>
      <p className="text-gray-600">
        For any inquiries, contact us at{' '}
        <a href="mailto:legal@workpiserv.com" className="text-brand hover:underline">
          legal@workpiserv.com
        </a>
      </p>
    </div>
  );
}
