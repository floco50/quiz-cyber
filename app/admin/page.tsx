"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Erreur auth:', authError);
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur de connexion');
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: joueurData, error: joueurError } = await supabase
        .from('joueurs')
        .select('est_admin, pseudo')
        .eq('user_id', authData.user.id)
        .single();

      if (joueurError) {
        console.error('Erreur joueur:', joueurError);
        setError('Utilisateur non trouvé dans la base de données');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!joueurData.est_admin) {
        setError('Accès refusé. Vous n\'êtes pas administrateur.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Connexion réussie
      toast.success(`Bienvenue ${joueurData.pseudo} !`);
      
      // Stocker l'info admin dans localStorage
      localStorage.setItem('is_admin', 'true');
      localStorage.setItem('admin_pseudo', joueurData.pseudo);

      // Redirection vers le dashboard
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <Toaster />
      
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Connexion Administrateur
          </CardTitle>
          <p className="text-gray-300 text-sm mt-2">
            CyberQuiz Dashboard Admin
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-500/20 border-red-500 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="admin@cyberquiz.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-200 text-xs text-center">
                🔒 Accès réservé aux administrateurs uniquement
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              ← Retour au quiz
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Coins décoratifs */}
      <div className="fixed top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-br-full blur-3xl"></div>
      <div className="fixed bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-tl-full blur-3xl"></div>
    </div>
  );
}