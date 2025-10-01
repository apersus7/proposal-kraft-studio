import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm md:text-base">
        <Sparkles className="h-5 w-5 flex-shrink-0 animate-pulse" />
        <p className="font-medium text-center">
          <span className="font-bold">Launch Special:</span> Get all features for just $17/month! 🚀
        </p>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => navigate('/payment')}
          className="hidden md:inline-flex bg-white text-red-600 hover:bg-gray-100 font-semibold"
        >
          Get Started
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
