# Manual Testing Guide - Kelen Platform

> **Date:** April 9, 2026  
> **Version:** feat/professional-dashboard branch  
> **Total Fixes Applied:** 25/39 (64%)  
> **Build Status:** ✅ PASSED  
> **Focus:** Critical functionality and user flows  

---

## 🎯 **Testing Priorities**

### **P0 - CRITICAL (Must Test Before Every Deploy)**
1. Authentication flows
2. Project creation & editing
3. Journal log creation with photos
4. Offline draft sync
5. Payment/subscription flows

### **P1 - HIGH (Test Weekly)**
6. Dashboard data accuracy
7. Recommendation/signal management
8. Profile editing + AI copywriting
9. Analytics display
10. Export functionality

### **P2 - MEDIUM (Test Bi-Weekly)**
11. Dark mode across all pages
12. Notification system
13. Search & filtering
14. Responsive design (mobile/tablet)

---

## 📋 **Test Scenarios**

### **1. Authentication & Onboarding**

#### 1.1 Professional Registration
```
Steps:
1. Navigate to /pro/inscription
2. Fill all required fields:
   - Email: test-pro-{timestamp}@example.com
   - Password: Test123456!
   - Business name: Test Construction Pro
   - Category: Construction
   - City: Dakar
   - Country: Sénégal
3. Submit form

Expected Result:
✅ Account created successfully
✅ Redirect to email confirmation OR /pro/dashboard
✅ Toast: "Compte créé avec succès"
✅ Professional slug auto-generated

Database Checks:
- [ ] users table has new record with role='pro_africa' or similar
- [ ] professionals table has linked record with correct user_id
- [ ] Professional slug follows pattern: {name}-{category}-{city}
```

#### 1.2 Professional Login
```
Steps:
1. Navigate to /pro/connexion
2. Enter registered email + password
3. Submit

Expected Result:
✅ Session created
✅ Redirect to /pro/dashboard
✅ ProSidebar shows business name
✅ All dashboard stats load (not hardcoded)

Browser DevTools Checks:
- [ ] Open Application → Cookies → Check supabase-auth-token exists
- [ ] Open Console → No auth errors
- [ ] Network tab → dashboard-stats server action returns real data
```

#### 1.3 Password Reset Flow
```
Steps:
1. Go to /mot-de-passe
2. Enter registered email
3. Check email for reset link
4. Click link (should go to /auth/callback then reset page)
5. Enter new password: NewPass123!
6. Submit

Expected Result:
✅ Password reset email received
✅ Link redirects correctly (no 404)
✅ Password updated successfully
✅ Redirect to /pro/dashboard (for pros) or /dashboard (for clients)
✅ Can login with new password

⚠️ KNOWN: Requires email provider configured in Supabase
```

---

### **2. Professional Dashboard**

#### 2.1 Real Data Display
```
Prerequisites:
- Logged in as professional with existing data
- Have at least 1 recommendation, 1 signal, some profile views

Steps:
1. Navigate to /pro/dashboard
2. Verify all stats

Expected Result:
✅ Business name displays (not "Mon profil" fallback)
✅ StatusBadge shows correct tier (Gold/Silver/White/Red/Black)
✅ Recommendation count matches database
✅ Signal count matches database
✅ Monthly views shows real number (last 30 days)
✅ Subscription shows "Premium" or "Gratuit" correctly

Database Verification:
```sql
SELECT 
  p.business_name,
  p.status,
  p.recommendation_count,
  p.signal_count,
  (SELECT COUNT(*) FROM profile_views 
   WHERE professional_id = p.id 
   AND created_at > NOW() - INTERVAL '30 days') as monthly_views
FROM professionals p
WHERE p.user_id = '<user_id>';
```

Check Each Stat:
- [ ] Business name matches professionals table
- [ ] Status matches (gold/silver/white/red/black)
- [ ] Recommendation count is accurate
- [ ] Signal count is accurate  
- [ ] Monthly views is accurate
- [ ] Subscription tier is correct
```

#### 2.2 Pending Actions
```
Prerequisites:
- Create a pending recommendation or signal

Steps:
1. View /pro/dashboard
2. Check "Actions requises" section

Expected Result:
✅ Shows count of pending items
✅ "Voir" link goes to /pro/recommandations
✅ "Répondre" link goes to /pro/signal
✅ If no pending: "Aucune action requise pour le moment."
```

---

### **3. Projects Management**

#### 3.1 Create Project
```
Steps:
1. Navigate to /pro/projets
2. Click "Nouveau projet"
3. Fill form:
   - Title: Test Project {timestamp}
   - Description: This is a test project for QA purposes...
   - Category: Construction
   - Location: Cocody, Abidjan
   - Start date: Today
   - Budget: 5000000
   - Currency: XOF
   - Toggle "Afficher sur mon portfolio" ON
4. Submit

Expected Result:
✅ Project created in pro_projects table
✅ Redirect to /pro/projets/{id}
✅ Toast: "Projet créé"
✅ Project appears in projects list
✅ is_public = true in database

Database Check:
```sql
SELECT * FROM pro_projects 
WHERE title LIKE 'Test Project%' 
ORDER BY created_at DESC LIMIT 1;
```
```

#### 3.2 Edit Project (CRITICAL FIX)
```
Steps:
1. From project detail page, click "Modifier" button
2. Update fields:
   - Title: Updated Test Project
   - Budget: 6000000
   - Status: Terminé
3. Save

Expected Result:
✅ Edit page loads at /pro/projets/{id}/edit
✅ Form pre-fills with existing data
✅ Updates save successfully
✅ Toast: "Projet mis à jour avec succès"
✅ Redirect to /pro/projets/{id}
✅ Changes reflect on detail page

⚠️ THIS WAS A 404 BEFORE FIX - VERIFY IT WORKS NOW
```

#### 3.3 Toggle Public/ Private
```
Steps:
1. Go to /pro/projets
2. Click eye icon on any project
3. Verify toast message
4. Check project in list updates

Expected Result:
✅ Toast: "Projet ajouté au portfolio" or "Projet retiré du portfolio"
✅ Icon changes (Eye ↔ EyeOff)
✅ Database updates: is_public field toggled
✅ List refreshes automatically

Database Check:
```sql
SELECT is_public FROM pro_projects WHERE id = '<project_id>';
```
```

---

### **4. Daily Journal**

#### 4.1 Create Log with Photos
```
Steps:
1. Navigate to /pro/projets/{id}/journal
2. Click "Nouveau rapport"
3. Fill form:
   - Date: Today
   - Title: Rapport de test {timestamp}
   - Description: This is a test log to verify journal functionality...
   - Money spent: 150000
   - Currency: XOF
   - Upload 2-3 photos
4. Click "Publier le rapport"

Expected Result:
✅ Log created in project_logs table
✅ Photos uploaded to log-media storage bucket
✅ Redirect to journal list
✅ Toast: "Rapport publié avec succès"
✅ Log appears in timeline
✅ Photos display correctly with signed URLs

Database Checks:
```sql
-- Check log
SELECT * FROM project_logs 
WHERE title LIKE 'Rapport de test%' 
ORDER BY created_at DESC LIMIT 1;

-- Check media
SELECT * FROM project_log_media 
WHERE log_id = '<log_id>';
```

Storage Check:
- [ ] Open Supabase Dashboard → Storage → log-media bucket
- [ ] Verify files exist with correct paths
```

#### 4.2 Offline Draft Sync (CRITICAL FIX)
```
Steps:
1. Open Chrome DevTools → Network tab
2. Set throttling to "Offline"
3. Navigate to journal page
4. Create a log (fill all fields EXCEPT photos)
5. Click "Brouillon" (draft) button
6. Go back online (remove throttling)
7. Refresh page
8. Verify OfflineIndicator shows pending drafts
9. Click "Synchroniser" button

Expected Result:
✅ Draft saves to IndexedDB while offline
✅ OfflineIndicator appears when back online
✅ Shows count: "X brouillon(s) en attente de synchronisation"
✅ Sync button visible and clickable
✅ On sync: draft uploaded to server
✅ Toast: "X brouillon(s) synchronisé(s)"
✅ Draft removed from IndexedDB
✅ Log appears in journal timeline

Browser DevTools Checks:
- [ ] Application → IndexedDB → Verify draft stored while offline
- [ ] After sync: IndexedDB cleared
- [ ] Network tab: createLog server action called successfully

⚠️ KNOWN LIMITATION: Photos from offline drafts are NOT preserved
```

#### 4.3 Log Approval/Contestation
```
Prerequisites:
- Create a log as professional
- Login as client who owns the project (or professional for pro projects)

Steps:
1. Navigate to project journal
2. Click on log to view details
3. Click "Approuver" or "Contester"
4. Enter comment
5. Submit

Expected Result:
✅ Approval/contest recorded in project_log_comments table
✅ Log status updates (approved/contested)
✅ Toast confirmation
✅ UI updates to show new status
✅ Email notification sent to log author

Database Check:
```sql
SELECT * FROM project_log_comments 
WHERE log_id = '<log_id>' 
ORDER BY created_at DESC;

SELECT status FROM project_logs WHERE id = '<log_id>';
```

⚠️ THIS WAS BROKEN FOR PRO PROJECTS BEFORE - VERIFY IT WORKS NOW
```

---

### **5. Profile Management**

#### 5.1 Edit Profile
```
Steps:
1. Navigate to /pro/profil
2. Edit fields:
   - Description: Update bio
   - Services: Add new services
   - WhatsApp: +225 07 00 00 00 00
   - Hero image: Upload new image
   - Tagline: "Expert construction depuis 10 ans"
3. Submit

Expected Result:
✅ Professionals table updated
✅ Toast: "Profil mis à jour avec succès"
✅ Changes reflect on public profile /professionnels/{slug}
✅ Images upload to correct storage bucket

Database Check:
```sql
SELECT description, whatsapp_number, hero_image_url 
FROM professionals 
WHERE user_id = '<user_id>';
```
```

#### 5.2 AI Copywriting (CRITICAL FIX - Auth Added)
```
Prerequisites:
- ANTHROPIC_API_KEY configured in environment
- Logged in as professional

Steps:
1. Navigate to /pro/profil
2. Click "Générer avec l'IA"
3. Complete 4-step questionnaire:
   - Step 1: Select 2-3 personal values
   - Step 2: Select 2-3 professional qualities
   - Step 3: Select relationship style + communication frequency
   - Step 4: Review answers
4. Click "Générer mes textes"
5. Wait for generation (30-60 seconds)

Expected Result:
✅ Dialog progresses through 4 steps
✅ API call to Anthropic Claude Sonnet 4
✅ On success: bio_accroche and about_text populated
✅ Toast: "Textes générérés avec succès !"
✅ Hero tagline and about text update in form
✅ Profile page shows new AI-generated text

⚠️ REQUIRES: ANTHROPIC_API_KEY in .env.local
❌ WITHOUT API KEY: Toast "Clé API non configurée"

Security Check:
- [ ] Unauthenticated users CANNOT call generateBioCopy
- [ ] Non-professionals CANNOT access this feature
```

---

### **6. Recommendations & Signals**

#### 6.1 View Recommendations
```
Steps:
1. Navigate to /pro/recommandations
2. Verify list loads

Expected Result:
✅ Loading skeleton appears, then loads
✅ Shows all recommendations linked to professional
✅ Each item: project type, location, client name, date, status badge
✅ "Lier au profil" button for unlinked recommendations
✅ "Publié" badge for linked recommendations
✅ "Copier mon lien Pro" button works (copies URL to clipboard)

Test Copy Link:
- [ ] Click button
- [ ] Paste in text editor (Ctrl+V)
- [ ] URL should be: https://kelen.africa/professionnels/{slug}
```

#### 6.2 Respond to Signal
```
Steps:
1. Navigate to /pro/signal
2. Find a signal with countdown > 0
3. Fill response textarea
4. Click "Envoyer ma réponse"

Expected Result:
✅ Response saved in signals table
✅ pro_response, pro_responded_at, status='disputed' updated
✅ Toast confirmation
✅ Response displayed in "Ma réponse publiée" section
✅ Countdown stops (responded)

Database Check:
```sql
SELECT pro_response, pro_responded_at, status 
FROM signals 
WHERE id = '<signal_id>';
```
```

---

### **7. Subscription & Payments**

#### 7.1 View Subscription Status
```
Steps:
1. Navigate to /pro/abonnement
2. Verify subscription card

Expected Result:
✅ Shows current plan name (Premium Kelen / Premium Europe / Gratuit)
✅ Shows status (active/inactive)
✅ Shows renewal date (correct date, not 24h from now)
✅ Free vs Premium pricing comparison visible
✅ Billing history section shows (empty if no invoices)

⚠️ CRITICAL FIX: Subscription period end date should be accurate
   (Was using session.expires_at instead of subscription.current_period_end)
```

#### 7.2 Subscribe via Stripe
```
Prerequisites:
- STRIPE_SECRET_KEY configured
- STRIPE_PRICE_PRO_AFRICA or STRIPE_PRICE_PRO_EUROPE configured

Steps:
1. Click "S'abonner maintenant"
2. Verify redirect to Stripe Checkout
3. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
4. Verify redirect back to /pro/abonnement?success=true

Expected Result:
✅ Redirect to Stripe hosted checkout
✅ Test payment processes successfully
✅ Webhook fires → subscriptions table updated
✅ Professional tier changes to active
✅ Toast: "Abonnement activé avec succès"

Stripe Dashboard Checks:
- [ ] Checkout session created
- [ ] Webhook delivered successfully
- [ ] Subscription record created with correct current_period_end

Database Check:
```sql
SELECT * FROM subscriptions 
WHERE professional_id = '<pro_id>' 
ORDER BY created_at DESC LIMIT 1;
```

⚠️ REQUIRES: Stripe API keys and price IDs in environment
```

---

### **8. Analytics**

#### 8.1 View Analytics Dashboard
```
Steps:
1. Navigate to /pro/analytique
2. Verify all charts and stats load

Expected Result:
✅ Loading skeletons display, then real data loads
✅ Stats cards: total views, monthly views, search appearances, interactions
✅ Bar chart: last 6 months of profile views
✅ Traffic sources: breakdown by source
✅ All numbers match database (not hardcoded zeros)

Database Verification:
```sql
SELECT 
  COUNT(*) as total_views,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_views
FROM profile_views 
WHERE professional_id = '<pro_id>';
```

⚠️ KNOWN: No date range selector - always shows last 6 months
```

---

### **9. Dark Mode**

#### 9.1 Theme Toggle
```
Steps:
1. Click theme toggle in Navbar
2. Switch between Light → Dark → System
3. Navigate through all pages

Expected Result:
✅ Light mode: bg-surface = #f9f9f8, text dark
✅ Dark mode: bg-surface = dark, text light
✅ System mode: follows OS preference
✅ Preference persists in localStorage
✅ All dashboard pages render correctly

Critical Pages to Test:
- [ ] /pro/dashboard
- [ ] /pro/projets
- [ ] /pro/projets/{id}/journal
- [ ] /pro/profil
- [ ] /pro/analytique
- [ ] /pro/recommandations
- [ ] /pro/signal
- [ ] /pro/abonnement

Components to Verify:
- [ ] StatusBadge (gold/silver/white/red/black all visible)
- [ ] ProjectTimeline (all status states)
- [ ] RealizationCommentThread
- [ ] LikeButton (liked/unliked states)
- [ ] RecommandationScrollRow
- [ ] LocationSearch
- [ ] LogStatusBadge
```

---

### **10. Export Functionality**

#### 10.1 PDF Export
```
Steps:
1. Navigate to /pro/projets/{id}
2. Click "Exporter" dropdown
3. Click "Rapport PDF (.pdf)"

Expected Result:
✅ Loading state: button shows "Génération..."
✅ PDF downloads: kelen-projet-{title}.pdf
✅ PDF contents verify:
   - Cover page: Kelen header (green), project name, date
   - Project overview: category, location, client, status, budget
   - Journal logs table: Date, Titre, Auteur, Dépenses, Photos, Statut
   - Financial summary: total budget, total spent, remaining
   - Footer: "Propulsé par Kelen — page X/Y"

Open PDF and Verify:
- [ ] All sections render correctly
- [ ] French characters display properly (é, à, è, etc.)
- [ ] Tables are formatted correctly
- [ ] No missing data
```

#### 10.2 Excel Export
```
Steps:
1. Same as above, click "Tableau Excel (.xlsx)"

Expected Result:
✅ Excel file downloads
✅ 4 sheets present:
   - **Résumé**: project overview (key-value pairs)
   - **Étapes**: steps with budget, expenditure, assigned pros
   - **Journal**: all logs with dates, descriptions, money, photos
   - **Finances**: budget summary, step count, log count, total photos

Open Excel and Verify:
- [ ] All 4 sheets exist
- [ ] Data matches database records
- [ ] French formatting (date format: DD/MM/YYYY)
- [ ] Numbers formatted correctly
```

---

## 🐛 **Known Issues to Verify Fixed**

### ✅ **FIXED - Must Test**
- [ ] `/auth/callback` route works (no 404 on email verification)
- [ ] `/pro/projets/{id}/edit` loads (no 404 on "Modifier")
- [ ] LogForm redirects to `/pro/projets/...` (not `/projets/...`)
- [ ] UpdatePasswordForm redirects pros to `/pro/dashboard`
- [ ] Log approval works for pro projects (not just client projects)
- [ ] OfflineIndicator shows pending drafts + sync button works
- [ ] Project toggle uses server action (not direct Supabase call)
- [ ] ProfessionalCard has no nested buttons (valid HTML)

---

## 🔒 **Security Tests**

### Authentication Checks
- [ ] Unauthenticated user CANNOT access `/pro/dashboard` (redirects to login)
- [ ] Unauthenticated user CANNOT call `updateProjectStatus`
- [ ] Unauthenticated user CANNOT call `generateBioCopy`
- [ ] Unauthenticated user CANNOT call `recalculateStatus`
- [ ] Regular user CANNOT access admin taxonomy CRUD
- [ ] Non-admin CANNOT call `recalculateStatus`
- [ ] User CANNOT update another user's project status

### Input Validation
- [ ] Log comment max 5000 chars (Zod validation)
- [ ] Email format validated in shareLog
- [ ] Phone format validated in shareLog
- [ ] Hex color format validated in saveBrandColors
- [ ] UUID format validated for all IDs

---

## 📱 **Responsive Design Tests**

### Mobile (375px width)
- [ ] Navbar collapses to hamburger
- [ ] ProSidebar becomes drawer
- [ ] Forms stack vertically
- [ ] Tables scroll horizontally
- [ ] Charts resize correctly
- [ ] All buttons are tappable (min 44x44px)

### Tablet (768px width)
- [ ] Grid layouts adjust to 2 columns
- [ ] Navigation remains accessible
- [ ] Forms layout changes to multi-column
- [ ] Charts resize appropriately

### Desktop (1440px width)
- [ ] All layouts use full width
- [ ] Sidebars visible and functional
- [ ] Multi-column grids display correctly
- [ ] Hover states work on interactive elements

---

## 📊 **Test Results Summary**

| Category | Total Tests | Passed | Failed | Notes |
|----------|------------|--------|--------|-------|
| Authentication | 3 | __ | __ | |
| Dashboard | 2 | __ | __ | |
| Projects | 3 | __ | __ | |
| Journal | 3 | __ | __ | |
| Profile | 2 | __ | __ | |
| Recommendations | 1 | __ | __ | |
| Signals | 1 | __ | __ | |
| Subscription | 2 | __ | __ | |
| Analytics | 1 | __ | __ | |
| Dark Mode | 1 | __ | __ | |
| Export | 2 | __ | __ | |
| Security | 7 | __ | __ | |
| Responsive | 3 | __ | __ | |
| **TOTAL** | **31** | __ | __ | |

---

## 🚨 **Critical Bugs Found During Testing**

| Severity | Issue | Steps to Reproduce | Expected | Actual | Status |
|----------|-------|-------------------|----------|--------|--------|
| | | | | | |

---

## 📝 **Testing Checklist Before Production Deploy**

### Pre-Deploy
- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] No critical bugs found
- [ ] Security tests pass
- [ ] Build succeeds with 0 errors
- [ ] TypeScript compilation passes
- [ ] Environment variables configured

### Post-Deploy
- [ ] Smoke test production (registration → login → create project)
- [ ] Verify email delivery works
- [ ] Verify Stripe webhooks fire correctly
- [ ] Verify PDF/Excel downloads work
- [ ] Verify dark mode works
- [ ] Check Sentry/error tracking (if configured)
- [ ] Monitor server logs for 500 errors

---

## 🎯 **Next Testing Session Recommendations**

1. **Edge Case Testing:**
   - Test with 0 recommendations
   - Test with 0 signals
   - Test with 0 projects
   - Test with empty journal
   - Test with very large datasets (100+ logs)

2. **Performance Testing:**
   - Measure page load times
   - Check for memory leaks in long sessions
   - Test offline sync with 10+ drafts
   - Test large file uploads (10MB photos)

3. **Cross-Browser Testing:**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
   - Mobile Safari (iOS)
   - Mobile Chrome (Android)

---

**Tester:** _________________  
**Date:** _________________  
**Environment:** Development / Staging / Production  
**Browser:** _________________  
**Result:** PASS / FAIL  
**Notes:** _________________
