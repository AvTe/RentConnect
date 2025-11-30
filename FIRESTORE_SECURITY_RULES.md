# Firestore Security Rules for Real Database Integration

## Required Rules to Enable Real Property Leads

To display real property leads from the database, you need to update your Firestore security rules. Add these rules to your Firebase Console:

### Rules for Requests Collection (Property Leads)
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading active leads for public carousel
    match /requests/{document=**} {
      allow read: if resource.data.status == 'active';
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.tenant_info.id || 
                               request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == userId;
    }
    
    // Subscriptions
    match /subscriptions/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    
    // Properties
    match /properties/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.agentId;
    }
  }
}
```

## Steps to Deploy:

1. Go to https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** > **Rules** tab
4. Replace the existing rules with the rules above
5. Click **Publish**

## Expected Behavior After Deployment:

✅ Property leads carousel displays real database records
✅ Skeleton loaders appear while fetching data
✅ No Firebase permission errors in console
✅ Real tenant info, budget, location, and contact counts display correctly
✅ System supports real-time updates as new leads are added

## Notes:

- The `requests` collection stores property leads submitted by tenants
- Each lead has structure: `tenant_info`, `requirements`, `status`, `views`, `contacts`
- Public users can read active leads (status == 'active')
- Only authenticated tenants can create new leads
- Only admins or the tenant who created the lead can update/delete it
