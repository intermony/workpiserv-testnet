export default function ContactPage() {
  return (
    <div className="section-container py-16 max-w-xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-4">Contact Us</h1>
      <p className="text-muted-foreground mb-8">Have a question or issue? We're here to help.</p>
      <div className="space-y-4">
        <div className="p-4 border border-border rounded-xl flex items-center gap-4">
          <span className="text-2xl">📧</span>
          <div>
            <p className="font-medium text-navy">Email Support</p>
            <a href="mailto:support@workpiserv.com" className="text-brand text-sm">support@workpiserv.com</a>
          </div>
        </div>
        <div className="p-4 border border-border rounded-xl flex items-center gap-4">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-medium text-navy">Pi Network Chat</p>
            <p className="text-muted-foreground text-sm">Find us on Pi Network as @workpiserv</p>
          </div>
        </div>
        <div className="p-4 border border-border rounded-xl flex items-center gap-4">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="font-medium text-navy">Response Time</p>
            <p className="text-muted-foreground text-sm">Within 24 hours on business days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
