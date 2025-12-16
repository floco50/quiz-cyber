"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from 'lucide-react';
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPseudo, setAdminPseudo] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    // Si on est sur la page de login, ne pas vérifier
    if (pathname === '/admin') {
      setLoading(false);
      return;
    }

    try {
      // Vérifier la session Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('Pas de session active');
        router.push('/admin');
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: joueur, error: joueurError } = await supabase
        .from('joueurs')
        .select('est_admin, pseudo')
        .eq('user_id', session.user.id)
        .single();

      if (joueurError) {
        console.error('Erreur récupération joueur:', joueurError);
        router.push('/admin');
        return;
      }

      if (!joueur || !joueur.est_admin) {
        console.log('Utilisateur non admin');
        toast.error('Accès refusé : droits administrateur requis');
        await supabase.auth.signOut();
        router.push('/admin');
        return;
      }

      // Utilisateur est admin
      setIsAdmin(true);
      setAdminPseudo(joueur.pseudo);
      localStorage.setItem('is_admin', 'true');
      localStorage.setItem('admin_pseudo', joueur.pseudo);
      
    } catch (err) {
      console.error('Erreur vérification admin:', err);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('is_admin');
      localStorage.removeItem('admin_pseudo');
      toast.success('Déconnexion réussie');
      router.push('/admin');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Page de login (pas de protection)
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  // Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Non autorisé
  if (!isAdmin) {
    return null;
  }

  // Admin autorisé - afficher avec header
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header Admin */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">CyberQuiz Admin</h1>
                <p className="text-gray-400 text-xs">Connecté en tant que {adminPseudo}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Voir le Quiz
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main>{children}</main>
    </div>
  );
}