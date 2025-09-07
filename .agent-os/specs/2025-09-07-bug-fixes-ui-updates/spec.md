# Spec Requirements Document

> Spec: Bug Fixes and UI Updates
> Created: 2025-09-07

## Overview

Fix critical bugs in local class creation and improve user experience by unmasking price fields during editing, fixing input spacing issues in media forms, and temporarily hiding the tag field. These changes will resolve form submission failures and improve data entry workflow for authorized users.

## User Stories

### Local Class Creation Fix

As an admin, I want to successfully create local classes with or without parent categories, so that I can properly organize tea ceremony items without encountering silent failures.

When I fill out the local class creation form and click "create", the form should either successfully create the class and redirect me to a confirmation page, or show me a clear error message explaining what went wrong. Currently, the form shows "error" in the URL but stays on the creation page with no feedback.

### Price Field Editing

As an item owner or admin, I want to see the actual price numbers when I'm editing price fields, so that I can accurately update pricing without guessing what I'm typing.

When I click on a price field that I have permission to edit, the masking dots should disappear and show the actual numbers, making it easy to see and edit the current value without making mistakes.

### Tag Field Cleanup

As a user, I want a cleaner interface without confusing unused fields, so that I can focus on the relevant item information.

The tag field should be hidden from the item editing interface until we implement proper tagging functionality in a future update.

### Media Form Spacing Fix

As a user editing media information, I want proper spacing between field labels and input boxes, so that I can easily read and interact with form fields without visual crowding.

In both media edit and media list views, the input boxes for copyright owner, rights note, and object token are too close to their labels, making the forms difficult to read and use.

## Spec Scope

1. **Local Class Creation Debug** - Investigate and fix the form submission error that prevents local class creation and provides no user feedback
2. **Price Field Unmasking** - Modify price input component to show actual values when user has edit permissions and is actively editing
3. **Media Form Spacing** - Fix spacing between labels and input boxes in media edit and list views for copyright owner, rights note, and object token fields
4. **Tag Field Hiding** - Temporarily hide tag field from item editing UI without removing from database schema

## Out of Scope

- Database schema changes (will be handled in separate database update spec)
- Complete tag field removal from database
- Profile picture functionality
- Friends system implementation
- Item list categorization
- New item creation routing

## Expected Deliverable

1. Local class creation form successfully creates classes and provides proper feedback on success or failure
2. Price fields show actual numeric values when authorized users click to edit them
3. Media forms have proper spacing between labels and input fields for better readability
4. Tag field is hidden from item editing interface while preserving existing database data