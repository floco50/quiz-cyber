"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FormulaireJoueur({ onJoueurCree }: { onJoueurCree: () => void }) {
  const [nom, setNom] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!nom.trim()) {
      setMessage("Veuillez entrer un pseudo.");
      setIsLoading(false);
      return;
    }

    // On s'authentifie anonymement en passant le pseudo dans les métadonnées
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          pseudo: nom,
        },
      },
    });

    if (authError) {
      setMessage(`Erreur: ${authError.message}`);
      console.error(authError);
    } else if (authData.user) {
      // Si l'authentification réussit, le trigger a déjà créé le joueur.
      // On stocke l'ID de l'utilisateur Supabase pour les futures requêtes.
      localStorage.setItem("supabase_user_id", authData.user.id);
      setMessage(`Bienvenue ${nom} !`);
      onJoueurCree();
    }
    
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <label className="block text-lg font-semibold">Pseudo</label>
      <Input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Choisissez un pseudo"
        disabled={isLoading}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion..." : "Commencer le quiz"}
      </Button>

      {message && (
        <Alert className="mt-4">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}