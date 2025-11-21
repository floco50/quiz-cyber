"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [question, setQuestion] = useState<any>(null);

  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id,
          texte,
          reponses:reponse (
            id,
            texte,
            est_correcte
          )
        `);

        console.log(data);
    }

    fetchQuestion();
  }, []);

  function handleClick(rep: any) {
    console.log("Réponse cliquée :", rep.texte);
  }

  return (
    <div>
      <Alert className="bg-blue-50 border-blue-300 text-blue-800 max-w-xl mx-auto mt-6">
        <AlertTitle className="text-xl font-semibold">Bienvenue sur CyberQuiz</AlertTitle>
        <AlertDescription>
          Un quiz pour tester vos connaissances en cybersécurité.
        </AlertDescription>
      </Alert>

      {question ? (
        <Card className="max-w-xl mx-auto mt-6">
          <CardHeader>
            <CardTitle>Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{question.texte}</p>

            {/* Affichage correct des réponses */}
            {question.reponses?.map((rep: any) => (
              <Button
                key={rep.id}
                className="w-full mt-2"
                onClick={() => handleClick(rep)}
              >
                {rep.texte}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="text-center mt-4">Chargement de la question...</p>
      )}
    </div>
  );
}
