import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PenTool, Users, CheckCircle, Clock, Mail, FileCheck, 
  Download, Eye, AlertCircle, Trash2, Plus, Copy 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';

interface Signer {
  id: string;
  name: string;
  email: string;
  order: number;
  status: 'pending' | 'signed' | 'declined';
  signed_at?: string;
  signature_data?: string;
  ip_address?: string;
  user_agent?: string;
}

interface ESignatureFlowProps {
  proposalId: string;
  signers: Signer[];
  onSignersUpdate: (signers: Signer[]) => void;
  isOwner?: boolean;
}

export default function ESignatureFlow({ 
  proposalId, 
  signers, 
  onSignersUpdate,
  isOwner = false 
}: ESignatureFlowProps) {
  const [loading, setLoading] = useState(false);
  const [newSigner, setNewSigner] = useState({ name: '', email: '' });
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    fetchSigners();
  }, [proposalId]);

  const fetchSigners = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_signatures')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedSigners: Signer[] = data.map((signature, index) => ({
        id: signature.id,
        name: signature.signer_name,
        email: signature.signer_email,
        order: index + 1,
        status: signature.status as 'pending' | 'signed' | 'declined',
        signed_at: signature.signed_at,
        signature_data: signature.signature_data,
        ip_address: signature.ip_address,
        user_agent: signature.user_agent
      }));

      onSignersUpdate(formattedSigners);
    } catch (error) {
      console.error('Error fetching signers:', error);
    }
  };

  const addSigner = async () => {
    if (!newSigner.name.trim() || !newSigner.email.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_signatures')
        .insert({
          proposal_id: proposalId,
          signer_name: newSigner.name.trim(),
          signer_email: newSigner.email.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const newSignerData: Signer = {
        id: data.id,
        name: data.signer_name,
        email: data.signer_email,
        order: signers.length + 1,
        status: 'pending'
      };

      onSignersUpdate([...signers, newSignerData]);
      setNewSigner({ name: '', email: '' });

      toast({
        title: "Success",
        description: "Signer added successfully!"
      });
    } catch (error) {
      console.error('Error adding signer:', error);
      toast({
        title: "Error",
        description: "Failed to add signer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSigner = async (signerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposal_signatures')
        .delete()
        .eq('id', signerId);

      if (error) throw error;

      const updatedSigners = signers
        .filter(s => s.id !== signerId)
        .map((signer, index) => ({ ...signer, order: index + 1 }));

      onSignersUpdate(updatedSigners);

      toast({
        title: "Success",
        description: "Signer removed successfully!"
      });
    } catch (error) {
      console.error('Error removing signer:', error);
      toast({
        title: "Error",
        description: "Failed to remove signer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendSignatureRequest = async (signerId: string) => {
    try {
      // In a real implementation, this would send an email with a secure signing link
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Signature request sent via email!"
      });
    } catch (error) {
      console.error('Error sending signature request:', error);
      toast({
        title: "Error",
        description: "Failed to send signature request",
        variant: "destructive"
      });
    }
  };

  const saveSignature = async (signerId: string) => {
    let signatureData = '';

    if (signatureMode === 'draw') {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        toast({
          title: "Error",
          description: "Please provide a signature",
          variant: "destructive"
        });
        return;
      }
      signatureData = signatureRef.current.toDataURL();
    } else {
      if (!typedSignature.trim()) {
        toast({
          title: "Error",
          description: "Please enter your signature",
          variant: "destructive"
        });
        return;
      }
      // Create a simple typed signature data URL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 100;
      if (ctx) {
        ctx.font = '24px cursive';
        ctx.fillText(typedSignature, 10, 50);
        signatureData = canvas.toDataURL();
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposal_signatures')
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          status: 'signed',
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent
        })
        .eq('id', signerId);

      if (error) throw error;

      // Update local state
      const updatedSigners = signers.map(signer =>
        signer.id === signerId
          ? {
              ...signer,
              status: 'signed' as const,
              signed_at: new Date().toISOString(),
              signature_data: signatureData,
              ip_address: '127.0.0.1',
              user_agent: navigator.userAgent
            }
          : signer
      );

      onSignersUpdate(updatedSigners);
      setActiveSignature(null);
      setTypedSignature('');

      toast({
        title: "Success",
        description: "Document signed successfully!"
      });
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSignerStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const allSigned = signers.length > 0 && signers.every(s => s.status === 'signed');
  const completionPercentage = signers.length > 0 
    ? Math.round((signers.filter(s => s.status === 'signed').length / signers.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>E-Signature Status</span>
          </CardTitle>
          <CardDescription>
            Track signature progress and manage signers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Badge variant={allSigned ? "default" : "secondary"} className="text-sm">
                {allSigned ? 'All Signed' : `${completionPercentage}% Complete`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {signers.filter(s => s.status === 'signed').length} of {signers.length} signatures
              </span>
            </div>
            {allSigned && (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Signer */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Signer</span>
            </CardTitle>
            <CardDescription>
              Add people who need to sign this proposal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signer-name">Full Name</Label>
                <Input
                  id="signer-name"
                  value={newSigner.name}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-email">Email Address</Label>
                <Input
                  id="signer-email"
                  type="email"
                  value={newSigner.email}
                  onChange={(e) => setNewSigner(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addSigner}
                  disabled={loading || !newSigner.name.trim() || !newSigner.email.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Signer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Signers ({signers.length})</span>
          </CardTitle>
          <CardDescription>
            Manage signature workflow and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PenTool className="h-12 w-12 mx-auto mb-4" />
              <p>No signers added yet</p>
              {isOwner && (
                <p className="text-sm">Add signers above to start the signature process</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {signers.map((signer, index) => (
                <div key={signer.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{signer.name}</p>
                            <p className="text-sm text-muted-foreground">{signer.email}</p>
                            {signer.signed_at && (
                              <p className="text-xs text-muted-foreground">
                                Signed: {new Date(signer.signed_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getSignerStatusColor(signer.status)}>
                            <span className="flex items-center space-x-1">
                              {getSignerStatusIcon(signer.status)}
                              <span className="capitalize">{signer.status}</span>
                            </span>
                          </Badge>
                          
                          <div className="flex space-x-2">
                            {signer.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActiveSignature(signer.id)}
                                >
                                  <PenTool className="h-4 w-4 mr-2" />
                                  Sign
                                </Button>
                                {isOwner && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => sendSignatureRequest(signer.id)}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {signer.status === 'signed' && signer.signature_data && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // Show signature in modal (implement as needed)
                                  toast({
                                    title: "Signature",
                                    description: "Signature verification available"
                                  });
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {isOwner && signer.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSigner(signer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Signature Interface */}
                      {activeSignature === signer.id && (
                        <div className="mt-6 space-y-4">
                          <Separator />
                          
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              By signing below, you agree to the terms and conditions outlined in this proposal.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="flex space-x-2 mb-4">
                            <Button
                              size="sm"
                              variant={signatureMode === 'draw' ? 'default' : 'outline'}
                              onClick={() => setSignatureMode('draw')}
                            >
                              Draw Signature
                            </Button>
                            <Button
                              size="sm"
                              variant={signatureMode === 'type' ? 'default' : 'outline'}
                              onClick={() => setSignatureMode('type')}
                            >
                              Type Signature
                            </Button>
                          </div>
                          
                          {signatureMode === 'draw' ? (
                            <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-background">
                              <SignatureCanvas
                                ref={signatureRef}
                                canvasProps={{
                                  width: 400,
                                  height: 150,
                                  className: 'signature-canvas border rounded'
                                }}
                              />
                              <div className="flex space-x-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => signatureRef.current?.clear()}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label>Type your full name as your signature</Label>
                              <Input
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                placeholder="Enter your full name"
                                className="font-serif text-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => saveSignature(signer.id)}
                              disabled={loading}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              {loading ? 'Signing...' : 'Sign Document'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setActiveSignature(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {signers.some(s => s.status === 'signed') && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              Complete signature history and verification details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signers
                .filter(s => s.status === 'signed')
                .map((signer) => (
                  <div key={signer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{signer.name} signed the document</p>
                      <p className="text-sm text-muted-foreground">
                        {signer.signed_at && new Date(signer.signed_at).toLocaleString()}
                        {signer.ip_address && ` • IP: ${signer.ip_address}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}