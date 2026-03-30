import { ShieldCheck } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Return Policy</h1>
          <p className="text-white/50">Last updated: Jan 1, 2024</p>
        </div>

        <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white max-w-none">
          <h3>Overview</h3>
          <p>We want you to love your SouthZone purchase. If you&apos;re not completely satisfied, we gladly accept returns of unworn, unwashed, undamaged or defective merchandise purchased online for delivery within India within 7 days of the original purchase.</p>

          <h3>Return Process</h3>
          <ol>
            <li>Log into your account and navigate to <strong>Orders</strong>.</li>
            <li>Select the order you wish to return and click <strong>Return Item</strong>.</li>
            <li>Pack the item securely in original packaging with tags attached.</li>
            <li>Our delivery partner will pick up the item within 2-3 business days.</li>
          </ol>

          <h3>Conditions</h3>
          <ul>
            <li>Merchandise must have all original garment tags still attached.</li>
            <li>Items must be free of stains, makeup, deodorant, or wear.</li>
            <li>Sale items or limited edition drops are considered final sale and cannot be returned.</li>
          </ul>

          <h3>Refunds</h3>
          <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will flow back to the original method of payment within 5-7 business days.</p>
        </div>
      </div>
    </div>
  );
}
