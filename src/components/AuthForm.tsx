import React, { useState } from 'react';
import { useUserStore } from '../stores';
import { User, Lock, LogIn, UserPlus, Loader2, X } from 'lucide-react';

interface AuthFormProps {
  onClose?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, authError } = useUserStore();
  
  // Apple-style colors
  const appleColors = {
    blue: "#007AFF",
    red: "#FF3B30",
    green: "#34C759",
    gray: {
      light: "#F2F2F7",
      medium: "#E5E5EA",
      dark: "#8E8E93",
    },
  };
  
  const validateForm = () => {
    // Clear previous errors
    setValidationError(null);
    
    // Check for empty fields
    if (!username.trim()) {
      setValidationError("Username is required");
      return false;
    }
    
    if (!password) {
      setValidationError("Password is required");
      return false;
    }
    
    // Additional validations for signup
    if (!isLogin) {
      if (password.length < 6) {
        setValidationError("Password must be at least 6 characters");
        return false;
      }
      
      if (password !== confirmPassword) {
        setValidationError("Passwords don't match");
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let success = false;
      if (isLogin) {
        success = await login(username, password);
      } else {
        success = await signup(username, password);
      }
      
      // Close the form if authentication was successful
      if (success && onClose) {
        onClose();
        
        // Reset form fields on success
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setValidationError(null);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setValidationError(null); // Clear errors when switching modes
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Error display */}
      {(validationError || authError) && (
        <div 
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm"
        >
          {validationError || authError}
        </div>
      )}
      
      {/* Auth form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        {/* Confirm password field for signup */}
        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center"
          style={{ backgroundColor: appleColors.blue }}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : isLogin ? (
            <LogIn className="h-5 w-5 mr-2" />
          ) : (
            <UserPlus className="h-5 w-5 mr-2" />
          )}
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
        
        {/* Toggle between login and signup */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={toggleAuthMode}
            className="text-blue-600 text-sm hover:underline focus:outline-none"
            disabled={isSubmitting}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
