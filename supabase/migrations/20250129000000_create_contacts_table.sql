-- Create contacts table for contact-centric lending
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_contacts_owner_user_id ON contacts(owner_user_id);
CREATE INDEX idx_contacts_linked_user_id ON contacts(linked_user_id);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view/modify their own contacts
CREATE POLICY "Users can view their own contacts"
  ON contacts
  FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts
  FOR DELETE
  USING (auth.uid() = owner_user_id);
