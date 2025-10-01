-- Add content_snapshot column to secure_proposal_shares to freeze proposal content at share time
ALTER TABLE secure_proposal_shares 
ADD COLUMN content_snapshot jsonb DEFAULT NULL;

COMMENT ON COLUMN secure_proposal_shares.content_snapshot IS 'Snapshot of proposal content at the time of sharing, so links show the exact version that was shared';