export default function BlogPage() {
  const posts = [
    {
      title: 'WorkPiServ enters its Testnet phase',
      date: 'June 2026',
      excerpt:
        'WorkPiServ is now live on Pi Testnet. This is a safe sandbox — no real Pi is involved — where Pioneers can try the full experience (publishing a service, buying, and the Escrow flow) and help us refine the platform before Mainnet. Your feedback shapes what comes next.',
    },
    {
      title: 'How to earn Pi with your skills',
      date: 'May 2026',
      excerpt:
        'A simple guide to creating your first service on WorkPiServ: choose what you do best, set a fair price, and let our Escrow system protect every transaction so both sides can trade with confidence.',
    },
    {
      title: 'The power of Escrow for freelancers',
      date: 'April 2026',
      excerpt:
        'Escrow is the heart of WorkPiServ. The buyer’s Pi is held safely and only released to the freelancer once the delivery is approved — protecting both sides. Here is how it works and why it matters.',
    },
  ];

  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">
        Updates and guides from the WorkPiServ journey — honest, as it happens.
      </p>
      <div className="space-y-6">
        {posts.map((post, i) => (
          <div
            key={i}
            className="border border-border rounded-xl p-6 hover:border-brand transition-colors"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {post.date}
            </span>
            <h2 className="font-heading font-bold text-xl text-navy mt-1 mb-2">
              {post.title}
            </h2>
            <p className="text-muted-foreground text-sm">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
