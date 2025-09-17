import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building, AlertCircle, TrendingUp, Target } from 'lucide-react';

interface CompanyResearchData {
  companyName: string;
  website: string;
  industry: string;
  estimatedSize: string;
  painPoints: string[];
  opportunities: string[];
  challenges: string[];
  recommendations: string[];
  lastUpdated: string;
}

interface CompanyResearchProps {
  onResearchComplete?: (data: CompanyResearchData) => void;
}

export const CompanyResearch = ({ onResearchComplete }: CompanyResearchProps) => {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [researchData, setResearchData] = useState<CompanyResearchData | null>(null);
  const { toast } = useToast();

  const handleAnalyzeCompany = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-company', {
        body: { 
          companyName: companyName.trim(),
          companyWebsite: website.trim() || undefined
        }
      });

      if (error) throw error;

      setResearchData(data.research);
      onResearchComplete?.(data.research);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${data.research.painPoints.length} key pain points and ${data.research.opportunities.length} opportunities`,
      });
    } catch (error) {
      console.error('Error analyzing company:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Research & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website (Optional)</label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyzeCompany}
            disabled={isAnalyzing || !companyName.trim()}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing Company...' : 'Analyze Company'}
          </Button>
        </CardContent>
      </Card>

      {researchData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Company Overview</span>
                <Badge variant="secondary">{researchData.industry}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{researchData.companyName}</p>
                <p className="text-sm text-muted-foreground">{researchData.website}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Estimated Size</p>
                <p className="text-sm text-muted-foreground">{researchData.estimatedSize}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Key Pain Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {researchData.painPoints.map((pain, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    <span className="text-sm">{pain}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {researchData.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <span className="text-sm">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {researchData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Analysis completed on {new Date(researchData.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};