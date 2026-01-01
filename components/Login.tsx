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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-3xl"></div>
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-emerald-100 p-8 md:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/20 border-2 border-amber-400">
            <School size={40} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-emerald-950 tracking-tight">{SCHOOL_NAME}</h1>
          <div className="h-1 w-16 bg-amber-500 mx-auto mt-2 rounded-full"></div>
          <p className="text-slate-500 font-bold mt-4 text-xs uppercase tracking-widest">
            {isSignUp ? "Admin Registration Portal" : "School Management System"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Admin Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                placeholder={isSignUp ? "Set Admin Username" : "Username"}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Access Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                placeholder={isSignUp ? "Set Password" : "Password"}
                required
              />
            </div>
          </div>

          {isSignUp && (
             <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                    placeholder="Repeat password"
                    required
                />
                </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-900 hover:bg-emerald-950 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-900/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border-b-4 border-emerald-950"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <>
                  {isSignUp ? (
                    <>Register Account <UserPlus size={18} /></>
                  ) : (
                    <>Login to Dashboard <ArrowRight size={18} /></>
                  )}
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <ShieldCheck size={14} className="text-amber-500" />
            <span>Secure System Access</span>
          </div>
          
          <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-xs text-emerald-800 font-black hover:underline flex items-center gap-1 opacity-80 hover:opacity-100 uppercase tracking-tight"
            >
                {isSignUp ? "Already have an account? Sign In" : <><RefreshCw size={12} /> Reset / Create Account</>}
          </button>
        </div>
      </div>
    </div>
  );
};