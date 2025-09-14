# Supabase Setup Guide

To complete the authentication setup, you need to configure your Supabase project and update the configuration.

## 1. Supabase Project Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to Settings > API
3. Copy your:
   - Project URL
   - Anon public key

## 2. Update Configuration

Edit `/utils/supabase.js` and replace the placeholder values:

```javascript
// Replace these with your actual Supabase values
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon public key
```

## 3. Configure Email Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email provider
3. Configure email templates if needed
4. Optionally configure custom SMTP settings

## 4. Authentication Flow

The implemented authentication flow works as follows:

1. **Login/Register**: User enters email on LoginScreen or RegisterScreen
2. **OTP Sent**: Supabase sends a 6-digit OTP to the user's email
3. **OTP Verification**: User enters OTP on OTPScreen
4. **Authentication**: On successful verification, user is authenticated and redirected to the main app
5. **Token Storage**: Authentication tokens are stored securely using Zustand with AsyncStorage
6. **Auto-Login**: On app restart, the app checks for existing valid tokens and auto-logs in the user

## 5. Screens Created

- `screens/auth/LoginScreen.js` - Email input for existing users
- `screens/auth/RegisterScreen.js` - Email input for new users
- `screens/auth/OTPScreen.js` - OTP verification screen

## 6. Navigation Structure

- `navigations/AuthStackNavigator.js` - Handles auth flow navigation
- `navigations/AppNavigator.js` - Main app navigator that switches between auth and main app

## 7. State Management

- `stores/authStore.js` - Zustand store for authentication state management
- Handles tokens, user data, login/logout, and session validation

## 8. Testing

1. Update the Supabase configuration
2. Run the app: `npm start` or `yarn start`
3. Try the registration flow with a valid email address
4. Check your email for the OTP
5. Complete the verification process
6. Test logout from Settings screen
7. Close and reopen the app to test auto-login

## Notes

- The app will show the auth screens until a user successfully authenticates
- Tokens are automatically refreshed by Supabase
- The Settings screen includes a logout option for testing
- All authentication state is persisted across app restarts