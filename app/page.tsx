"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import Link from "next/link";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [explication, setExplication] = useState("");
  const [afficherExplication, setAfficherExplication] = useState(false);

  const question = questions[questionIndex];

  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id,
          texte,
          images,
          image_credit_nom,
          image_credit_url,
          explication,
          reponses:reponse (
            id,
            texte,
            est_correcte
          )
        `).order('id');

      if (error) {
        console.error("Erreur Supabase :", error);
        return;
      }

      if (data && data.length > 0) {
        console.log(data);
        setQuestions(data || []);
      }
    }

    fetchQuestion();
  }, []);

  function handleClick(rep: any) {
    if (!question || afficherExplication) return;

    console.log(rep.est_correcte);

    let message = "";
    if (rep.est_correcte == 'true') {
      message = "Bonne réponse !";
    } else {
      message = "Mauvaise réponse !";
    }

    toast(message);
    const explicationTexte = message + " " + question.explication || message;

    setExplication(explicationTexte);
    setAfficherExplication(true);

    setTimeout(() => {
      setAfficherExplication(false);
      setExplication("");
      setQuestionIndex((prev) => prev + 1);
    }, 5000);
  }

  if (!question) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">Quiz terminé !</h2>
        <p className="mt-4 text-muted-foreground">Merci d’avoir participé.</p>
      </div>
    );
  }

  return (
    <div>
      <Toaster />
      <Alert className="bg-blue-50 border-blue-300 text-blue-800 max-w-xl mx-auto mt-6">
        <AlertTitle className="text-xl font-semibold">Bienvenue sur CyberQuiz</AlertTitle>
        <AlertDescription>
          Un quiz pour tester vos connaissances en cybersécurité.
        </AlertDescription>
      </Alert>
      <Card>
      <div className='flex'>
        <div className="w-1/2">
          <Alert className="mt-4 text-sm text-muted-foreground">
            <AlertDescription>
              {question?.images ? (
                <>
                  <Image
                    src={question.images}
                    alt={question.texte || "Illustration"}
                    width={400}
                    height={300}
                    className="rounded"
                  />

                  {/* Crédit image dynamique */}
                  {question.image_credit_nom && question.image_credit_url && (
                    <Link
                      href={question.image_credit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-primary block mt-2"
                    >
                      {question.image_credit_nom}
                    </Link>
                  )}
                </>
              ) : (
                <p>Aucune image disponible</p>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="w-1/2">
          {/* {'/images/' + question.images} */}
          {questions.length > 0 ? (
            <Card className="max-w-xl mx-auto mt-6">
              <CardHeader>
                <CardTitle>Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{question.texte}</p>

                {question.reponses?.map((rep: any) => (
                  <Button
                    key={rep.id}
                    className="w-full mt-2"
                    onClick={() => handleClick(rep)}
                    disabled={afficherExplication}
                  >
                    {rep.texte}
                  </Button>
                ))}
                <p className="text-sm text-muted-foreground mb-2">
                  Question {questionIndex + 1} sur {questions.length}
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center mt-4">Chargement de la question...</p>
          )}
        </div>
      </div>
      {afficherExplication && (
        <Alert className="mt-6 bg-yellow-50 border-yellow-300 text-yellow-800">
          <AlertTitle>Explication</AlertTitle>
          <AlertDescription>{explication}</AlertDescription>
        </Alert>
      )}
    </Card>
    </div>
  
  );
}