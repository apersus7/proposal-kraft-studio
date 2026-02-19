import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CompanyProfile } from './AppLayout';
import { Building2, Upload, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onComplete: (profile: CompanyProfile) => Promise<void>;
  userEmail: string;
}

export default function OnboardingScreen({ onComplete, userEmail }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CompanyProfile>({
    company_name: '',
    logo_url: '',
    bio: '',
    services: '',
    website: '',
    phone: '',
    address: '',
    case_studies: '',
    stripe_key: '',
    paypal_key: '',
    razorpay_key: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData(p => ({ ...p, logo_url: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = async () => {
    setSaving(true);
    await onComplete(data);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to ProposalKraft</h1>
          <p className="text-muted-foreground mt-1">Let's set up your company profile to personalize proposals</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-5">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Company Details</h2>
                <p className="text-sm text-muted-foreground">This info appears on every proposal you create</p>
              </div>

              {/* Logo upload */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border group-hover:border-primary flex items-center justify-center transition-colors overflow-hidden">
                    {data.logo_url ? (
                      <img src={data.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                </label>
                <div>
                  <p className="text-sm font-medium">Company Logo</p>
                  <p className="text-xs text-muted-foreground">Click to upload (PNG, JPG)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={data.company_name}
                    onChange={e => setData(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Acme Digital Studio"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Bio / Tagline</Label>
                  <Textarea
                    value={data.bio}
                    onChange={e => setData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="We craft stunning digital experiences that drive results..."
                    className="mt-1 resize-none min-h-[80px]"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Services Offered</Label>
                  <Input
                    value={data.services}
                    onChange={e => setData(p => ({ ...p, services: e.target.value }))}
                    placeholder="Web Design, SEO, Logo Design, Branding..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={data.website}
                    onChange={e => setData(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={data.phone}
                    onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!data.company_name.trim()}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Portfolio & Case Studies</h2>
                <p className="text-sm text-muted-foreground">AI will include these to strengthen your proposals</p>
              </div>

              <div>
                <Label>Case Studies / Previous Work</Label>
                <Textarea
                  value={data.case_studies}
                  onChange={e => setData(p => ({ ...p, case_studies: e.target.value }))}
                  placeholder="• Redesigned TechCorp's website, boosting leads by 60%&#10;• Built e-commerce store for FashionBrand, generating $2M in first year&#10;• Created brand identity for StartupXYZ, raised $5M Series A"
                  className="mt-1 resize-none min-h-[120px]"
                />
              </div>

              <div>
                <Label>Address (optional)</Label>
                <Input
                  value={data.address}
                  onChange={e => setData(p => ({ ...p, address: e.target.value }))}
                  placeholder="123 Main St, San Francisco, CA 94102"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleComplete} disabled={saving}>
                  {saving ? 'Setting up...' : 'Start Creating Proposals 🚀'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
