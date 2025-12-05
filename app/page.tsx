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
import FormulaireJoueur from "@/components/FormulaireJoueur";
import Score from "@/components/Score";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [explication, setExplication] = useState("");
  const [afficherExplication, setAfficherExplication] = useState(false);
  const [joueurNom, setJoueurNom] = useState<string>('Sans nom');
  const [joueurPret, setJoueurPret] = useState(false);
  const question = questions[questionIndex];
  const [score, setScore] = useState(0);
  const [debut, setDebut] = useState<number | null>(null);

  useEffect(() => {
    // On ne lance la récupération que si joueurPret est passé à 'true'
    if (joueurPret) {
      const userId = localStorage.getItem("supabase_user_id");
      if (userId) {
        supabase
          .from("joueurs")
          .select("pseudo")
          .eq("user_id", userId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error("Erreur lors de la récupération du joueur :", error);
            } else if (data) {
              setJoueurNom(data.pseudo);
            }
          });
      }
    }
  }, [joueurPret]);

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
    setDebut(Date.now());
  }, []);

  function handleClick(rep: any) {
    if (!question || afficherExplication) return;

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

    if (rep.est_correcte) {
      setScore((prev) => prev + 1);
      enregistrerScore(score);
    }

  }

  async function enregistrerScore(score: number) {
  const joueurId = localStorage.getItem("joueur_id");
  if (!joueurId || debut === null) return;

  const temps = Math.floor((Date.now() - debut) / 1000);

  const { data: classementData, error: classementError } = await supabase
    .from("classement")
    .insert({
      score,
      temps,
      date_partie: new Date().toISOString().split("T")[0],
    })
    .select();

  if (classementError) {
    console.error("Erreur enregistrement score :", classementError);
    return;
  }

  const idClassement = classementData?.[0]?.id;

  if (idClassement) {
    await supabase.from("classement_joueur").insert({
      id_joueur: joueurId,
      id_classement: idClassement,
    });
  }
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
      {!joueurPret ? (
        <FormulaireJoueur onJoueurCree={() => setJoueurPret(true)} />
      ) : (
        <div>
          <Toaster />
          <Alert className="bg-green-50 border-green-300 text-green-800 max-w-xl mx-auto mt-6">
            <AlertTitle className="text-xl font-semibold">
              Bienvenue {joueurNom} !
            </AlertTitle>
            <AlertDescription>
              Préparez-vous à tester vos connaissances en cybersécurité.
            </AlertDescription>
          </Alert>
          <Score actuel={score} total={questions.length} />
          <Card>
            <div className='flex  flex-col md:flex-row'>
              <div className="w-full md:w-1/2 p-4">
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

              <div className="w-full md:w-1/2 p-4">
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
      )}
    </div>
  );
}