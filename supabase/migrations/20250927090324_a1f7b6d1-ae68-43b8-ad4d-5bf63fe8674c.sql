-- Create proposals storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proposals', 'proposals', true);

-- Create RLS policies for proposal files
CREATE POLICY "Users can upload their own proposal files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'proposals' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own proposal files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'proposals' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own proposal files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'proposals' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own proposal files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'proposals' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);