# Payment Flow Testing Guide

## Prerequisites
1. Whop account with test mode enabled
2. Test user account in your app
3. Access to Supabase dashboard for checking logs/data

## Step-by-Step Testing Process

### 1. Create Test User
```bash
# Go to your app's auth page
https://[your-app-url]/auth

# Sign up with a test email (e.g., test@example.com)
# Note: Use a real email you can access for verification
```

### 2. Check Initial State
```sql
-- In Supabase SQL Editor, verify user exists but has no subscription
SELECT * FROM profiles WHERE email = 'test@example.com';
SELECT * FROM subscriptions WHERE user_id = '[user-id-from-above]';
```

### 3. Initiate Payment
```bash
# Navigate to pricing page
https://[your-app-url]/pricing

# Click on a plan (e.g., "Deal Closer")
# This should redirect to Whop checkout
```

### 4. Monitor Webhook (in separate terminal/tab)
```bash
# Open Supabase Function Logs
https://supabase.com/dashboard/project/kmgmjfifunncweqgnbvz/functions/whop-webhook/logs

# Look for:
# 🎯 WEBHOOK RECEIVED: {...}
# ✅ Processing: membership.went_valid
# Resolved user_id from email: [user-id]
# Subscription [inserted/updated] successfully
```

### 5. Complete Test Payment
In Whop checkout:
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- Complete the payment

### 6. Verify Subscription Creation
```sql
-- Check subscription was created/updated
SELECT 
  id,
  user_id,
  plan_type,
  status,
  current_period_end,
  created_at
FROM subscriptions 
WHERE user_id = '[user-id]'
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- status: 'active'
-- current_period_end: future date
-- plan_type: 'dealcloser' (or selected plan)
```

### 7. Verify Dashboard Access
```bash
# The dashboard should automatically refresh and grant access
# If not, manually refresh: https://[your-app-url]/dashboard

# User should NOT be redirected to /pricing
# User should see their dashboard with proposals
```

## Troubleshooting

### Issue: Webhook not received
**Check:**
1. Webhook URL in Whop dashboard is correct
2. Webhook is enabled for your plan
3. Check Whop webhook logs for delivery failures

**Webhook URL should be:**
```
https://kmgmjfifunncweqgnbvz.supabase.co/functions/v1/whop-webhook
```

### Issue: User redirected to pricing after payment
**Check:**
1. Subscription record in database (query above)
2. `current_period_end` is in the future
3. `status` is 'active'
4. Webhook logs show successful processing

**Debug query:**
```sql
-- Check what verify-whop-access would return
SELECT 
  CASE 
    WHEN status = 'active' 
      AND current_period_end > now() 
    THEN true 
    ELSE false 
  END as should_have_access,
  *
FROM subscriptions 
WHERE user_id = '[user-id]'
ORDER BY created_at DESC 
LIMIT 1;
```

### Issue: Webhook received but subscription not created
**Check logs for:**
- "No user_id or email in membership data"
- "Could not resolve user_id"
- Database constraint errors

**Fix:**
1. Ensure checkout passes `userId` in metadata
2. Ensure user's email in Whop matches profiles table
3. Check edge function logs for detailed errors

## Expected Timeline
1. Payment completed: 0s
2. Whop sends webhook: 1-3s
3. Webhook processes: 1-2s
4. Dashboard polls subscription: every 2s × 5 attempts
5. User sees dashboard: ~5-10s after payment

## Common Issues & Solutions

### "Subscription Not Activated" toast after 10s
**Cause:** Webhook didn't update database in time
**Solutions:**
- Check webhook was received (function logs)
- Manually verify subscription in database
- Check for email mismatch between Whop and profile

### Payment success but still on pricing page
**Cause:** Subscription record missing or invalid
**Solutions:**
- Check `current_period_end` is in future
- Verify `status = 'active'`
- Look for DB errors in webhook logs

### Multiple subscription records for same user
**Cause:** Webhook creating duplicates instead of updating
**Solution:**
- This is now fixed - webhook updates existing records by user_id
- Clean up duplicates manually if needed:
```sql
-- Keep only the most recent active subscription per user
DELETE FROM subscriptions 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM subscriptions
  ) t WHERE rn = 1
);
```

## Testing Checklist
- [ ] Test user created and verified
- [ ] Initial state: no subscription
- [ ] Payment initiated (redirects to Whop)
- [ ] Webhook logs show event received
- [ ] Subscription record created with correct data
- [ ] Dashboard grants access immediately (within 10s)
- [ ] No redirect to pricing page
- [ ] Success toast displayed

## Test Different Scenarios
1. **New user payment:** First-time subscriber
2. **Renewal:** User with expired subscription paying again
3. **Plan upgrade:** User switching from Deal Closer to Agency
4. **Failed payment:** Test with declined card to ensure no false positives
5. **Cancelled payment:** Close checkout window, verify no access granted
