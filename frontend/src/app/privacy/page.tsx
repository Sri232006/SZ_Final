export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-white/50">Last updated: Jan 1, 2024</p>
        </div>

        <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white max-w-none">
          <p>SouthZone respects your privacy. This page outlines how we collect, use, and handle your data.</p>
          
          <h3>1. Information We Collect</h3>
          <p>We collect information when you register, place an order, or subscribe to our newsletter. This includes your name, email address, mailing address, and phone number.</p>

          <h3>2. How We Use Your Information</h3>
          <ul>
            <li>To process and fulfill your orders.</li>
            <li>To communicate tracking updates and exclusive drops via WhatsApp/Email.</li>
            <li>To improve our website and customer service.</li>
          </ul>

          <h3>3. Data Protection</h3>
          <p>We implement a variety of security measures to maintain the safety of your personal information. Your payment data is never stored on our servers and is processed securely by Razorpay.</p>

          <h3>4. Cookies</h3>
          <p>We use cookies to save your preferences and cart contents for a seamless shopping experience.</p>
        </div>
      </div>
    </div>
  );
}
