# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-07-database-profile-system/spec.md

## Database Changes

### New Column: accounts.profile_picture_id
```sql
ALTER TABLE accounts 
ADD COLUMN profile_picture_id UUID REFERENCES media(id);
```

### New Table: friends
```sql
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, recipient_id)
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_friends_requester_id ON friends(requester_id);
CREATE INDEX idx_friends_recipient_id ON friends(recipient_id);
CREATE INDEX idx_friends_status ON friends(status);
```

### Remove Tag Field
```sql
ALTER TABLE objects DROP COLUMN IF EXISTS tag;
```

### RLS Policies for Friends
```sql
-- Users can see their own friend requests and connections
CREATE POLICY "Users can view their own friends" ON friends
FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = recipient_id
);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON friends
FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update friend requests they received
CREATE POLICY "Users can respond to friend requests" ON friends
FOR UPDATE USING (auth.uid() = recipient_id);
```

## Rationale

- **Profile Pictures**: Using existing media table maintains consistency with current media handling system
- **Friends Table**: Simple status-based system allows for request workflow while keeping schema clean
- **Unique Constraint**: Prevents duplicate friend requests between same users
- **RLS Policies**: Ensures users can only see and manage their own social connections
- **Indexes**: Optimizes common queries for finding friends and managing requests
- **Tag Field Removal**: Cleans up unused database column that was temporarily hidden in UI