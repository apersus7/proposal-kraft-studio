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
    objective: true,
    proposed_solution: true,
    scope_of_work: true,
    pricing: true,
    terms: true,
    about_us: true,
  });

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Find the actual rendered proposal content
      const proposalContent = document.getElementById('proposal-preview-content');
      
      if (!proposalContent) {
        throw new Error('Proposal content not found');
      }

      // Generate PDF from the actual rendered content
      const canvas = await html2canvas(proposalContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
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

      // Download the PDF
      pdf.save(`${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.pdf`);

      toast({
        title: "Export Successful",
        description: "Your proposal has been exported as a PDF with exact styling"
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
      // Find the actual rendered proposal content
      const proposalContent = document.getElementById('proposal-preview-content');
      
      if (!proposalContent) {
        throw new Error('Proposal content not found');
      }

      // Generate image from the actual rendered content
      const canvas = await html2canvas(proposalContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Download as image
      const link = document.createElement('a');
      link.download = `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Export Successful",
        description: "Your proposal has been exported as an image with exact styling"
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