import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Plus, Type, FileText, Clock, DollarSign } from 'lucide-react';

interface Section {
  id: string;
  type: string;
  title: string;
  content: any;
  order: number;
}

interface DragDropEditorProps {
  sections: Section[];
  onSectionsUpdate: (sections: Section[]) => void;
}

export default function DragDropEditor({ sections, onSectionsUpdate }: DragDropEditorProps) {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const addSection = (type: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: type,
      title: `New ${type.replace('_', ' ')} Section`,
      content: { text: '' },
      order: sections.length
    };
    onSectionsUpdate([...sections, newSection]);
  };

  const updateSectionContent = (sectionId: string, content: any) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    );
    onSectionsUpdate(updatedSections);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Manage your proposal structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sections.map((section) => (
              <Card 
                key={section.id}
                className={`cursor-pointer p-3 ${selectedSection?.id === section.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSection(section)}
              >
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-4 w-4" />
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{section.title}</span>
                </div>
              </Card>
            ))}
            <Button onClick={() => addSection('custom_text')} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            {selectedSection ? `Edit: ${selectedSection.title}` : 'Select a section to edit'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedSection ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedSection.title}
                  onChange={(e) => {
                    const updated = { ...selectedSection, title: e.target.value };
                    setSelectedSection(updated);
                    updateSectionContent(selectedSection.id, selectedSection.content);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={selectedSection.content.text || ''}
                  onChange={(e) => updateSectionContent(selectedSection.id, { text: e.target.value })}
                  placeholder="Enter content..."
                  className="min-h-[150px]"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Type className="h-8 w-8 mx-auto mb-2" />
              <p>Select a section to start editing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}