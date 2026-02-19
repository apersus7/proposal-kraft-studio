import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Upload, Save, Globe, Phone, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Profile {
  company_name: string;
  logo_url: string;
  bio: string;
  services: string;
  website: string;
  phone: string;
  address: string;
  case_studies: string;
}

const empty: Profile = {
  company_name: '',
  logo_url: '',
  bio: '',
  services: '',
  website: '',
  phone: '',
  address: '',
  case_studies: '',
};

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    if (data) {
      setProfile({
        company_name: data.company_name || '',
        logo_url: data.logo_url || data.avatar_url || '',
        bio: data.bio || '',
        services: data.services || '',
        website: data.website || '',
        phone: data.phone || '',
        address: data.address || '',
        case_studies: data.case_studies || '',
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(p => ({ ...p, logo_url: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('profiles')
      .upsert({
        user_id: user?.id,
        email: user?.email,
        company_name: profile.company_name,
        logo_url: profile.logo_url,
        avatar_url: profile.logo_url,
        bio: profile.bio,
        services: profile.services,
        website: profile.website,
        phone: profile.phone,
        address: profile.address,
        case_studies: profile.case_studies,
      }, { onConflict: 'user_id' });

    if (error) {
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    } else {
      toast({ title: 'Company profile saved!' });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Company Profile</h1>
          <p className="text-xs text-muted-foreground">This information is used to personalize your proposals</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Logo & Name */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Brand</h2>

          {/* Logo upload */}
          <div className="flex items-center gap-5">
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border group-hover:border-primary flex items-center justify-center overflow-hidden transition-colors">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </label>
            <div>
              <p className="font-medium text-sm">Company Logo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click to upload PNG or JPG</p>
              <label className="cursor-pointer mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Upload className="h-3 w-3" /> Upload logo
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Company Name *</Label>
            <Input
              value={profile.company_name}
              onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
              placeholder="Acme Digital Studio"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Bio / Tagline</Label>
            <Textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="We craft stunning digital experiences that drive results..."
              className="mt-1 resize-none min-h-[90px]"
            />
          </div>
        </div>

        {/* Services */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Services
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">Services Offered</Label>
            <Input
              value={profile.services}
              onChange={e => setProfile(p => ({ ...p, services: e.target.value }))}
              placeholder="Web Design, SEO, Logo Design, Branding..."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Case Studies / Portfolio</Label>
            <Textarea
              value={profile.case_studies}
              onChange={e => setProfile(p => ({ ...p, case_studies: e.target.value }))}
              placeholder={"• Redesigned TechCorp's site, boosting leads by 60%\n• Built e-commerce for FashionBrand, $2M first year\n• Brand identity for StartupXYZ, raised $5M Series A"}
              className="mt-1 resize-none min-h-[110px]"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" /> Contact & Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
              <Input
                value={profile.website}
                onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                placeholder="https://yoursite.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
              <Input
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Input
                value={profile.address}
                onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                placeholder="123 Main St, San Francisco, CA 94102"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !profile.company_name.trim()} className="w-full h-11 text-sm font-semibold">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
