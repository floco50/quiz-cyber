"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FormulaireJoueur({ onJoueurCree }: { onJoueurCree: () => void }) {
  const [nom, setNom] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nom.trim()) {
      setMessage("Veuillez entrer votre nom.");
      return;
    }

    const { data, error } = await supabase.from("joueur").insert({
      pseudo: nom,
    }).select().single();

    if (error) {
      setMessage("Erreur lors de l'enregistrement.");
      console.error(error);
    } else {
      localStorage.setItem("joueur_id", data.id);
      setMessage("Bienvenue " + nom + " !");
      onJoueurCree();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <label className="block text-lg font-semibold">Nom et prénom</label>
      <Input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Votre nom complet"
      />
      <Button type="submit" className="w-full">Commencer le quiz</Button>

      {message && (
        <Alert className="mt-4">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}