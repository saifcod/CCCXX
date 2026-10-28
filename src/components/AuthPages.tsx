import React, { useState, useEffect } from 'react';
import { useRouter } from '../router';
import { useAuth } from '../context/AuthContext';
import { BRAND_CONFIG } from '../data/products';
import { getCustomerOrders, SavedOrder } from '../lib/firebase';
import {
  User as UserIcon,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShoppingBag,
  Clock,
  Truck,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Custom error message translator for Firebase Auth codes
 */
function getAuthErrorMessage(err: any): string {
  const code = err?.code || '';
  const message = err?.message || '';

  if (code === 'auth/unauthorized-domain') {
    return 'This domain (coreluxbd.netlify.app) is not authorized in Firebase Console. Please go to Authentication > Settings > Authorized domains and add it.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site or try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long.';
  }
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password authentication must be enabled in your Firebase Project Console (Authentication -> Sign-in method -> Email/Password). You can also sign in with Google directly below.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completion.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please verify your internet connection.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily disabled due to too many failed attempts. Please try again later or reset your password.';
  }
  return message || 'An unexpected error occurred during authentication. Please try again.';
}

/**
 * SIGN IN VIEW
 */
export const SignInView: React.FC = () => {
  const { navigate } = useRouter();
  const { signInWithEmail, signInWithGoogle, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, redirect to account
  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      navigate('/account');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/account');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E8E2D5] shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-lg bg-[#FAF8F5] border border-[#EBE5DB] p-1.5 items-center justify-center mx-auto">
            <img
              src={BRAND_CONFIG.logo}
              alt="CORELUX"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C2024] font-display">
            Sign In to CORELUX
          </h2>
          <p className="text-xs text-[#6A717B]">
            Access your orders, track deliveries, and manage your account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-3 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <Mail className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1C2024]">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-[#143D2B] hover:text-[#0E2E20] font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-10 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <Lock className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#707780] hover:text-[#1C2024] p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || googleSubmitting}
            className={`w-full min-h-[44px] px-4 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E8E2D5] w-full" />
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#8F969E] absolute">
            or continue with
          </span>
        </div>

        {/* Google One-Click Sign In */}
        <button
          type="button"
          disabled={isSubmitting || googleSubmitting}
          onClick={handleGoogleSignIn}
          className="w-full min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-medium rounded-md flex items-center justify-center gap-2.5 transition-colors shadow-xs active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleSubmitting ? 'Connecting...' : 'Sign In with Google'}</span>
        </button>

        {/* Footer Link to Register */}
        <div className="pt-2 text-center text-xs text-[#6A717B]">
          Don't have an account yet?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="font-semibold text-[#143D2B] hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SIGN UP VIEW
 */
export const SignUpView: React.FC = () => {
  const { navigate } = useRouter();
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, redirect to account
  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signUpWithEmail(fullName, email, password);
      navigate('/account');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/account');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E8E2D5] shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-lg bg-[#FAF8F5] border border-[#EBE5DB] p-1.5 items-center justify-center mx-auto">
            <img
              src={BRAND_CONFIG.logo}
              alt="CORELUX"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C2024] font-display">
            Create Customer Account
          </h2>
          <p className="text-xs text-[#6A717B]">
            Join CORELUX to save orders, track delivery parcels, and checkout faster.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Tanvir Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-3 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <UserIcon className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-3 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <Mail className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
              Password <span className="text-red-500">*</span> (min 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-10 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <Lock className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#707780] hover:text-[#1C2024] p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-10 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
              />
              <Lock className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-[#707780] hover:text-[#1C2024] p-0.5"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || googleSubmitting}
            className={`w-full min-h-[44px] px-4 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E8E2D5] w-full" />
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#8F969E] absolute">
            or sign up with
          </span>
        </div>

        {/* Google One-Click Sign In */}
        <button
          type="button"
          disabled={isSubmitting || googleSubmitting}
          onClick={handleGoogleSignUp}
          className="w-full min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-medium rounded-md flex items-center justify-center gap-2.5 transition-colors shadow-xs active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        {/* Footer Link to Sign In */}
        <div className="pt-2 text-center text-xs text-[#6A717B]">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/signin')}
            className="font-semibold text-[#143D2B] hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * FORGOT PASSWORD VIEW
 */
export const ForgotPasswordView: React.FC = () => {
  const { navigate } = useRouter();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E8E2D5] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-lg bg-[#FAF8F5] border border-[#EBE5DB] p-1.5 items-center justify-center mx-auto text-[#143D2B]">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C2024] font-display">
            Reset Password
          </h2>
          <p className="text-xs text-[#6A717B]">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-[#EAF5EF] border border-[#BDE8C9] rounded-lg text-xs text-[#143D2B] space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Password Reset Email Sent</span>
            </div>
            <p>
              We've dispatched password reset instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/signin')}
                className="w-full py-2 bg-[#143D2B] text-white font-semibold rounded text-xs"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#D5CDC0] rounded-md pl-9 pr-3 py-2.5 text-xs text-[#1C2024] placeholder-[#9CA3AF] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                />
                <Mail className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full min-h-[44px] px-4 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all shadow-xs ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? <span>Sending Link...</span> : <span>Send Reset Link</span>}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="text-xs font-medium text-[#7A828B] hover:text-[#1C2024]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * CUSTOMER ACCOUNT VIEW
 */
export const AccountView: React.FC = () => {
  const { navigate } = useRouter();
  const { user, customerProfile, logout, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Load orders for this specific customer
  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      if (!user) {
        setOrdersLoading(false);
        return;
      }
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const data = await getCustomerOrders(user.uid);
        if (isMounted) {
          setOrders(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setOrdersError('Could not retrieve orders at this time.');
        }
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadOrders();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // If not signed in and auth finished loading
  if (!authLoading && !user) {
    return (
      <div className="min-h-[70vh] py-16 px-4 bg-[#FAF8F5] flex items-center justify-center text-center">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E8E2D5] p-8 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center mx-auto text-[#143D2B]">
            <UserIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1C2024] font-display">
            Customer Account
          </h2>
          <p className="text-xs text-[#6A717B] leading-relaxed">
            Please sign in to view your account details, track delivery status, and review order history.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/signin')}
              className="flex-1 min-h-[44px] px-4 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex-1 min-h-[44px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = customerProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Valued Customer';
  const email = user?.email || customerProfile?.email || '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF7EE] text-[#14532D] border border-[#BDE8C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Delivered
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Confirmed
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF9EE] text-[#8C6D2D] border border-[#F0DFBE]">
            <Clock className="w-3 h-3" />
            Pending Confirmation
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF5EF] text-[#143D2B] border border-[#C6E4D1] flex items-center justify-center font-display text-xl font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1C2024] font-display">
                  {displayName}
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded text-[#8C6D2D]">
                  Customer
                </span>
              </div>
              <p className="text-xs text-[#6A717B] mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8C6D2D]" />
                <span>{email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1C2024] font-display">
                My Orders
              </h2>
              <p className="text-xs text-[#6A717B]">
                Track all purchases linked to your customer account.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#143D2B]">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </div>
          </div>

          {/* Loading state */}
          {ordersLoading && (
            <div className="p-12 text-center bg-white rounded-xl border border-[#E8E2D5] text-xs text-[#7A828B] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#143D2B]" />
              <span>Loading your orders securely from database...</span>
            </div>
          )}

          {/* Error state */}
          {ordersError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {ordersError}
            </div>
          )}

          {/* Empty state */}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-[#E8E2D5] space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center mx-auto text-[#9CA3AF]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#1C2024]">No Orders Placed Yet</h3>
                <p className="text-xs text-[#6A717B] max-w-sm mx-auto">
                  When you complete an order while signed in with your account, it will automatically appear here with real-time delivery status.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="min-h-[42px] px-5 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          )}

          {/* Orders List */}
          {!ordersLoading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl border border-[#E8E2D5] overflow-hidden shadow-xs"
                >
                  {/* Order Top Bar */}
                  <div className="bg-[#FAF8F5] px-5 py-3.5 border-b border-[#EAE3D5] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <span className="text-[#7A828B]">Order Ref: </span>
                        <strong className="text-[#1C2024] font-mono">{ord.orderNumber}</strong>
                      </div>
                      <span className="text-stone-300">|</span>
                      <div className="text-[#6A717B]">
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  {/* Order Items Body */}
                  <div className="p-5 space-y-4">
                    <div className="divide-y divide-[#F0EBE1]">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-semibold text-[#1C2024] font-sans">
                              {item.productName}
                            </h4>
                            <div className="text-[11px] text-[#7A828B]">
                              {item.size && <span>Size: {item.size} · </span>}
                              {item.color && <span>Color: {item.color} · </span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-[#143D2B]">
                              ৳{item.lineTotal.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-[#9CA3AF]">
                              ৳{item.unitPrice} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Financial & Delivery Breakdown */}
                    <div className="pt-3 border-t border-[#F0EBE1] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 text-[#6A717B]">
                        <div>
                          <strong className="text-[#1C2024]">Recipient:</strong> {ord.customerName} ({ord.customerPhone})
                        </div>
                        <div>
                          <strong className="text-[#1C2024]">Delivery Address:</strong> {ord.deliveryAddress}
                        </div>
                        <div>
                          <strong className="text-[#1C2024]">Payment Method:</strong>{' '}
                          {ord.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash / Mobile Wallet'}
                        </div>
                      </div>

                      <div className="space-y-1 md:text-right text-[#525A62]">
                        <div className="flex justify-between md:justify-end md:gap-4">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-[#1C2024]">৳{ord.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between md:justify-end md:gap-4">
                          <span>Delivery ({ord.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
                          <span className="font-semibold text-[#143D2B]">৳{ord.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between md:justify-end md:gap-4 text-sm font-bold text-[#1C2024] pt-1 border-t border-[#F0EBE1]">
                          <span>Total Amount:</span>
                          <span className="text-[#143D2B]">৳{ord.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
