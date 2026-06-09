export default function PrivacyPage() {
  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>
      <p className="text-gray-600 mb-6">
        Welcome to WorkπServ — the first global freelance marketplace powered by Pi Network. We respect your privacy and are committed to protecting your personal data.
      </p>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">1. Data We Collect</h2>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>Your Pi UID and username</li>
        <li>Profile information you choose to share</li>
        <li>Transaction and Pi payment data</li>
        <li>Messages between users inside the app</li>
      </ul>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">2. How We Use Your Data</h2>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>To operate and improve platform services</li>
        <li>To process Pi payments securely</li>
        <li>To communicate with you about your orders and services</li>
        <li>To ensure platform security and prevent fraud</li>
      </ul>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">3. Data Sharing</h2>
      <p className="text-gray-600 mb-2">We do not sell your personal data to any third party.</p>
      <ul className="space-y-1 text-gray-600 mb-6 list-disc list-inside">
        <li>With Pi Network to verify authentication and payments</li>
        <li>When legally required under applicable law</li>
        <li>With service providers necessary to operate the platform</li>
      </ul>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">4. Data Security</h2>
      <p className="text-gray-600 mb-6">
        We use SSL/TLS encryption to protect your data in transit. Data is stored securely on protected servers.
      </p>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">5. Contact</h2>
      <p className="text-gray-600">
        For any privacy-related questions, contact us at{' '}
        <a href="mailto:privacy@workpiserv.com" className="text-brand hover:underline">
          privacy@workpiserv.com
        </a>
      </p>
    </div>
  );
}
