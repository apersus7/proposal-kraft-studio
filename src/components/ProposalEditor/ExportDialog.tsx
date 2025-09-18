import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Image, Share } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';

interface ExportDialogProps {
  proposal: any;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export default function ExportDialog({ proposal, trigger, defaultOpen = false }: ExportDialogProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'image'>('pdf');
  const [includeSections, setIncludeSections] = useState({
    cover: true,
    executive_summary: true,
    client_problem: true,
    proposed_solution: true,
    scope_of_work: true,
    pricing: true,
    terms: true,
    about_us: true,
  });

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Create a temporary div with the proposal content
      const exportDiv = document.createElement('div');
      exportDiv.style.position = 'absolute';
      exportDiv.style.left = '-9999px';
      exportDiv.style.width = '210mm'; // A4 width
      exportDiv.style.padding = '20mm';
      exportDiv.style.backgroundColor = 'white';
      exportDiv.style.fontFamily = 'Arial, sans-serif';
      exportDiv.style.fontSize = '12px';
      exportDiv.style.lineHeight = '1.6';
      
      // Build HTML content based on selected sections
      let htmlContent = '';
      
      if (includeSections.cover) {
        htmlContent += `
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #22c55e; padding-bottom: 20px;">
            <h1 style="font-size: 32px; color: #22c55e; margin-bottom: 10px;">${proposal.title}</h1>
            <h2 style="font-size: 20px; color: #666; margin-bottom: 20px;">Prepared for ${proposal.client_name}</h2>
            <p style="font-size: 14px; color: #888;">${proposal.content?.sections?.find((s: any) => s.type === 'cover_page')?.tagline || ''}</p>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        `;
      }

      const sections = proposal.content?.sections || [];
      
      sections.forEach((section: any) => {
        const sectionKey = section.type as keyof typeof includeSections;
        if (includeSections[sectionKey] && section.content) {
          const sectionTitle = section.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          htmlContent += `
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
              <h2 style="font-size: 18px; color: #22c55e; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                ${sectionTitle}
              </h2>
              <div style="white-space: pre-wrap; margin-bottom: 15px;">
                ${section.content}
              </div>
            </div>
          `;
        }
      });

      // Handle timeline separately if scope of work is included
      const scopeSection = sections.find((s: any) => s.type === 'scope_of_work');
      if (includeSections.scope_of_work && scopeSection?.timeline?.length > 0) {
        htmlContent += `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; color: #22c55e; margin-bottom: 15px;">Timeline & Milestones</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Phase</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Duration</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${scopeSection.timeline.map((phase: any) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${phase.phase || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${phase.duration || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${phase.description || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      exportDiv.innerHTML = htmlContent;
      document.body.appendChild(exportDiv);

      // Generate PDF
      const canvas = await html2canvas(exportDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      document.body.removeChild(exportDiv);

      // Download the PDF
      pdf.save(`${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.pdf`);

      toast({
        title: "Export Successful",
        description: "Your proposal has been exported as a PDF"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your proposal",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    setIsExporting(true);
    try {
      // Similar logic but export as PNG
      const exportDiv = document.createElement('div');
      exportDiv.style.position = 'absolute';
      exportDiv.style.left = '-9999px';
      exportDiv.style.width = '800px';
      exportDiv.style.padding = '40px';
      exportDiv.style.backgroundColor = 'white';
      exportDiv.style.fontFamily = 'Arial, sans-serif';
      exportDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; color: #22c55e;">${proposal.title}</h1>
          <h2 style="font-size: 20px; color: #666;">Prepared for ${proposal.client_name}</h2>
        </div>
      `;

      document.body.appendChild(exportDiv);

      const canvas = await html2canvas(exportDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(exportDiv);

      // Download as image
      const link = document.createElement('a');
      link.download = `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Export Successful",
        description: "Your proposal has been exported as an image"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your proposal",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportAsImage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Proposal</DialogTitle>
          <DialogDescription>
            Choose your export format and sections to include
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'image') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center">
                    <Image className="h-4 w-4 mr-2" />
                    PNG Image
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Include Sections</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeSections).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(checked) => 
                      setIncludeSections(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-sm capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting} 
            className="w-full"
          >
            {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}