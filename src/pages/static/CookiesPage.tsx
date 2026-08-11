export default function CookiesPage() {
  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

      <p className="text-muted-foreground mb-6">
        WorkPiServ uses cookies and similar technologies to improve your experience on our platform. This page explains what cookies we use and why.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">1. What Are Cookies?</h2>
      <p className="text-muted-foreground mb-6">
        Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve platform performance.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">2. Cookies We Use</h2>
      <ul className="space-y-2 text-muted-foreground mb-6">
        <li>🔐 <strong>Essential cookies</strong> — Required for authentication and security (Pi Network session)</li>
        <li>⚙️ <strong>Functional cookies</strong> — Remember your preferences and settings</li>
        <li>📊 <strong>Analytics cookies</strong> — Help us understand how the platform is used (anonymous data)</li>
      </ul>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">3. Managing Cookies</h2>
      <p className="text-muted-foreground mb-6">
        You can control or disable cookies through your browser settings. Note that disabling essential cookies may affect platform functionality.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">4. Third-Party Cookies</h2>
      <p className="text-muted-foreground mb-6">
        We may use third-party services (such as Pi Network authentication) that set their own cookies. We do not control these cookies and recommend reviewing their respective privacy policies.
      </p>

      <h2 className="font-heading font-bold text-xl text-navy mb-3">5. Contact</h2>
      <p className="text-muted-foreground">
        For any questions about our cookie policy, contact us at{' '}
        <a href="mailto:legal@workpiserv.com" className="text-brand hover:underline">
          legal@workpiserv.com
        </a>
      </p>
    </div>
  );
}
