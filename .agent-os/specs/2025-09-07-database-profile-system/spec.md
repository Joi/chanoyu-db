# Spec Requirements Document

> Spec: Database Schema & Profile System
> Created: 2025-09-07

## Overview

Extend the user profile system with profile pictures and implement a friends/connection system to enhance social features. Additionally, clean up the database by removing the unused tag field and establishing proper media storage for profile images.

## User Stories

### Profile Pictures

As a user, I want to upload and display a profile picture, so that other members can easily recognize me and personalize my account presence.

I should be able to upload a profile picture that appears as a thumbnail next to my name throughout the application. Profile owners and admins should be able to manage these photos, and they should be visible to all users as part of the social aspect of the tea ceremony community.

### Friends & Connection System

As a user, I want to connect with other members I've met at chakai events, so that I can build relationships within the tea ceremony community.

When I attend a chakai with other members, I should be able to send connection requests to other attendees. Recipients can accept or decline these requests, and I should see pending requests on my profile page. This creates a social network within the tea ceremony community.

### Database Cleanup

As a system administrator, I want to remove unused database fields and properly structure media storage, so that the database remains clean and performant.

The unused tag field should be completely removed from the database schema, and profile pictures should be stored using a consistent media system with proper access controls.

## Spec Scope

1. **Profile Picture System** - Add profile_picture_id field to accounts table and implement upload/display functionality
2. **Friends Connection System** - Create friends table with connection requests, acceptance, and display of social connections
3. **Database Schema Cleanup** - Remove tag field from relevant tables and establish proper media storage structure
4. **Connection Request UI** - Add interface for sending, viewing, and managing friend requests on profile pages

## Out of Scope

- Advanced social features (messaging, groups, etc.)
- Photo tagging or recognition features
- Bulk connection imports
- Complex privacy controls beyond basic visibility
- Migration of existing tag data (field will be removed)

## Expected Deliverable

1. Users can upload and display profile pictures that appear as thumbnails throughout the application
2. Users can send and accept connection requests with other members, with requests managed through profile pages
3. Database schema is cleaned up with tag field removed and profile media properly structured
4. Social connections are visible and manageable through user interface