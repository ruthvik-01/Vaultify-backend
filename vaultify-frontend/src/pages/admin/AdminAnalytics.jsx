import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Analytics</h2>
          <p className="text-xs text-gray-500 font-medium">Real-time system data overview.</p>
        </div>
      </div>

      <div className="bg-white border border-brand-sand/70 rounded-3xl p-16 text-center text-gray-400 font-medium space-y-3 shadow-sm">
        <BarChart3 className="w-12 h-12 mx-auto text-brand-sage mb-2" />
        <p className="font-serif font-bold text-base text-brand-charcoal">No analytics available.</p>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Synthetic and fake analytics graphs have been removed. Simple metrics are available directly on the Admin Dashboard.
        </p>
      </div>
    </div>
  );
}
