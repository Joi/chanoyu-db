# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-06-rls-performance-fix/spec.md

> Created: 2025-09-06
> Version: 1.0.0

## Technical Requirements

### Current Performance Issues
- Supabase RLS engine evaluates multiple permissive policies for each query, causing unnecessary overhead
- `chakai_items` table has 3 overlapping policies that could be consolidated into 2 more efficient ones
- `local_classes` table has 2 policies with overlapping conditions that can be merged

### Performance Optimization Strategy
- **Policy Consolidation**: Merge overlapping conditions using OR logic within single policies rather than multiple separate policies
- **Query Path Optimization**: Reduce the number of policy evaluations per query from 3→2 for chakai_items and 2→1 for local_classes
- **Index Utilization**: Ensure consolidated policies maintain proper index usage patterns

### Access Control Preservation
- **Admin Access**: Maintain full read/write access for authenticated admin users
- **Public Read Access**: Preserve public read access where currently allowed
- **Security Boundaries**: Zero changes to who can access what data

## Approach

### Phase 1: Analysis and Testing
1. Document current policy logic and access patterns
2. Create test scenarios for all user roles (admin, authenticated, anonymous)
3. Develop consolidated policy logic with identical access patterns
4. Test locally against existing application flows

### Phase 2: Migration Implementation  
1. Create migration to drop existing policies
2. Implement consolidated replacement policies
3. Add rollback migration for safety
4. Test performance improvements with query analysis

### Phase 3: Deployment and Verification
1. Apply migration to local environment with full regression testing
2. Deploy to production during low-traffic period
3. Monitor query performance and error rates
4. Verify no access control regressions

## External Dependencies

- Supabase CLI for local testing and migration application
- PostgreSQL query analysis tools for performance measurement
- Existing test suite to verify no functional regressions
- Database backup and rollback procedures for safe deployment