"use client"

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [question, setQuestion] = useState<any>(null);

  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from('questions')
        .select('*');

      if (error) console.error(error);
      else setQuestion(data[0]); // On stocke la première question dans l’état
    }

    fetchQuestion();
  }, []);

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
            <p>{question.texte}</p>
          </CardContent>
        </Card>
      ) : (
        <p>Chargement de la question...</p>
      )}

    </div>
  );
}