import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Type, FileText, Clock, DollarSign, Trash2, MoveUp, MoveDown, CreditCard, Link2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  const [newSectionType, setNewSectionType] = useState('custom_text');

  const sectionTypes = [
    { value: 'objective', label: 'Project Objective' },
    { value: 'proposed_solution', label: 'Proposed Solution' },
    { value: 'scope_of_work', label: 'Scope of Work' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'payment_link', label: 'Payment Link' },
    { value: 'about_us', label: 'About Us' },
    { value: 'custom_text', label: 'Custom Text' },
  ];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    onSectionsUpdate(updatedItems);
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: newSectionType,
      title: sectionTypes.find(t => t.value === newSectionType)?.label || 'New Section',
      content: { text: '' },
      order: sections.length
    };
    onSectionsUpdate([...sections, newSection]);
    setSelectedSection(newSection);
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    onSectionsUpdate(updatedSections);
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
  };

  const updateSectionContent = (sectionId: string, updates: any) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsUpdate(updatedSections);
    
    // Update selected section if it's the one being edited
    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const items = Array.from(sections);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    onSectionsUpdate(updatedItems);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Drag to reorder sections or click to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-3 transition-all ${
                              selectedSection?.id === section.id ? 'ring-2 ring-primary' : ''
                            } ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer"
                                onClick={() => setSelectedSection(section)}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </div>
                                 {section.type === 'payment_link' ? 
                                   <CreditCard className="h-4 w-4" /> : 
                                   <FileText className="h-4 w-4" />
                                 }
                                <span className="font-medium">{section.title}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveSection(section.id, 'up')}
                                  disabled={index === 0}
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveSection(section.id, 'down')}
                                  disabled={index === sections.length - 1}
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSection(section.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <div className="flex space-x-2">
              <Select value={newSectionType} onValueChange={setNewSectionType}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addSection} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
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
                <Label>Section Type</Label>
                <Select 
                  value={selectedSection.type} 
                  onValueChange={(value) => updateSectionContent(selectedSection.id, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedSection.title}
                  onChange={(e) => updateSectionContent(selectedSection.id, { title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={selectedSection.content?.text || ''}
                  onChange={(e) => updateSectionContent(selectedSection.id, { 
                    content: { ...selectedSection.content, text: e.target.value } 
                  })}
                  placeholder="Enter content..."
                  className="min-h-[200px]"
                />
              </div>

              {selectedSection.type === 'pricing' && (
                <div className="space-y-4 border-t pt-4">
                  <Label>Pricing Details</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={selectedSection.content?.price || ''}
                        onChange={(e) => updateSectionContent(selectedSection.id, { 
                          content: { ...selectedSection.content, price: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={selectedSection.content?.currency || 'USD'} 
                        onValueChange={(value) => updateSectionContent(selectedSection.id, { 
                          content: { ...selectedSection.content, currency: value } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection.type === 'payment_link' && (
                <div className="space-y-4 border-t pt-4">
                  <Label>Payment Link Details</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={selectedSection.content?.amount || ''}
                        onChange={(e) => updateSectionContent(selectedSection.id, { 
                          content: { ...selectedSection.content, amount: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={selectedSection.content?.currency || 'USD'} 
                        onValueChange={(value) => updateSectionContent(selectedSection.id, { 
                          content: { ...selectedSection.content, currency: value } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      placeholder="Pay Now"
                      value={selectedSection.content?.buttonText || 'Pay Now'}
                      onChange={(e) => updateSectionContent(selectedSection.id, { 
                        content: { ...selectedSection.content, buttonText: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Link URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Paste your payment link here..."
                        value={selectedSection.content?.paymentUrl || ''}
                        onChange={(e) => updateSectionContent(selectedSection.id, { 
                          content: { ...selectedSection.content, paymentUrl: e.target.value } 
                        })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          // This would open the payment links dialog
                          console.log('Open payment links generator');
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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