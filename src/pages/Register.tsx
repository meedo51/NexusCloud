import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HardDrive } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-space-dark text-[#E0E0E0]">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00F0FF] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6B6B] rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
           <div className="w-12 h-12 bg-gradient-to-br from-[#00F0FF] to-[#FF6B6B] rounded-xl shadow-lg shadow-[#00F0FF]/20 flex items-center justify-center">
             <HardDrive className="h-6 w-6 text-white" />
           </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Create Account</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Join NexusCloud today</p>

          {error && <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] text-sm rounded-xl p-3 mb-6">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0B0F19]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all text-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0B0F19]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all text-white"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] px-6 py-3 text-sm font-bold text-[#0B0F19] hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 shadow-lg shadow-[#00F0FF]/20"
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-[#00F0FF] hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
