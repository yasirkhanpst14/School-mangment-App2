import React, { useState, useEffect } from 'react';
import { School, Lock, User, ArrowRight, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';
import { getAdminCredentials, saveAdminCredentials } from '../services/storageService';

interface LoginProps {
  onLogin: (status: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      const creds = await getAdminCredentials();
      if (!creds) {
        setIsSignUp(true);
      }
      setIsLoading(false);
    };
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      if (password.length < 4) {
           setError('Password must be at least 4 characters long.');
           setIsLoading(false);
           return;
      }
      if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
      }
      
      await saveAdminCredentials({ username, password });
      onLogin(true);
    } else {
      const creds = await getAdminCredentials();
      if (creds && username.toLowerCase() === creds.username.toLowerCase() && password === creds.password) {
          onLogin(true);
      } else {
          setError('Invalid credentials. Please try again.');
          setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-3xl animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/30">
            <School size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{SCHOOL_NAME}</h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            {isSignUp ? "Create Admin Account" : "Secure School Management System"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                placeholder={isSignUp ? "Choose a username" : "Enter username"}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                placeholder={isSignUp ? "Create a password" : "Enter password"}
                required
              />
            </div>
          </div>

          {isSignUp && (
             <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                    placeholder="Repeat password"
                    required
                />
                </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <>
                  {isSignUp ? (
                    <>Create Account <UserPlus size={18} /></>
                  ) : (
                    <>Sign In Dashboard <ArrowRight size={18} /></>
                  )}
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secured by Firebase Admin</span>
          </div>
          
          {!isSignUp ? (
            <button 
                onClick={() => setIsSignUp(true)} 
                className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
            >
                <RefreshCw size={12} /> Reset / Create New Account
            </button>
          ) : (
             <button 
                onClick={async () => {
                    const creds = await getAdminCredentials();
                    if(creds) setIsSignUp(false);
                }} 
                className={`text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100`}
            >
                Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};