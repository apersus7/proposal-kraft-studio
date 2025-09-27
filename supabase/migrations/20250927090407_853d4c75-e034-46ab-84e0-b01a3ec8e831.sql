-- Create RLS policies for proposal files (bucket already exists)
-- Check if policies exist and create them if they don't

-- Policy for uploading files
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own proposal files'
    ) THEN
        CREATE POLICY "Users can upload their own proposal files" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (
            bucket_id = 'proposals' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy for viewing files
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own proposal files'
    ) THEN
        CREATE POLICY "Users can view their own proposal files" 
        ON storage.objects 
        FOR SELECT 
        USING (
            bucket_id = 'proposals' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy for updating files
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own proposal files'
    ) THEN
        CREATE POLICY "Users can update their own proposal files" 
        ON storage.objects 
        FOR UPDATE 
        USING (
            bucket_id = 'proposals' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Policy for deleting files
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own proposal files'
    ) THEN
        CREATE POLICY "Users can delete their own proposal files" 
        ON storage.objects 
        FOR DELETE 
        USING (
            bucket_id = 'proposals' AND 
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;