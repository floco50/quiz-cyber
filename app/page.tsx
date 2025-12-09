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
  const [reponseCorrecte, setReponseCorrecte] = useState(false);
  const [joueurNom, setJoueurNom] = useState<string>('Sans nom');
  const [joueurPret, setJoueurPret] = useState(false);
  const question = questions[questionIndex];
  const [score, setScore] = useState(0);
  const [debut, setDebut] = useState<number | null>(null);
  const [quizTermine, setQuizTermine] = useState(false);

  useEffect(() => {
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
        `).order('id', { ascending: true });

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

  useEffect(() => {
    if (questionIndex >= questions.length && questions.length > 0 && !quizTermine) {
      setQuizTermine(true);
      enregistrerMeilleurScore();
    }
  }, [questionIndex, questions.length, quizTermine]);

  function handleClick(rep: any) {
    if (!question || afficherExplication) return;

    let message = "";
    const estCorrect = rep.est_correcte == 'true';
    
    if (estCorrect) {
      message = "Bonne réponse !";
    } else {
      message = "Mauvaise réponse !";
    }

    toast(message);
    const explicationTexte = message + " " + question.explication || message;

    setExplication(explicationTexte);
    setAfficherExplication(true);
    setReponseCorrecte(estCorrect);

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

  if (!question && questions.length > 0) {
    return (
      <div className="text-center mt-20 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-primary">Quiz terminé !</h2>

        <Card>
          <CardHeader>
            <CardTitle>Votre résultat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xl">
            <p>Score : <span className="font-bold text-green-600">{score}</span> / {questions.length}</p>
            <p className="text-muted-foreground">
              Temps : {debut ? Math.floor((Date.now() - debut) / 1000) : 0} secondes
            </p>
            {score === questions.length && (
              <p className="text-2xl">Parfait ! 100% de bonnes réponses !</p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <p className="text-lg mb-4">
            Merci {joueurNom} pour votre participation !
          </p>
        </div>
      </div>
    );
  }

  async function enregistrerMeilleurScore() {
    const userId = localStorage.getItem("supabase_user_id");
    if (!userId || debut === null || questions.length === 0) return;

    const tempsTotal = Math.floor((Date.now() - debut) / 1000);
    const scoreFinal = score;
    const aujourdHui = new Date().toISOString().split("T")[0];

    const { data: joueur, error } = await supabase
      .from("joueurs")
      .select("meilleur_score")
      .eq("user_id", userId)
      .single();

    if (error || !joueur) {
      console.error("Erreur récupération joueur :", error);
      return;
    }

    const ancienMeilleur = joueur.meilleur_score || 0;

    if (scoreFinal > ancienMeilleur) {
      const { error: updateError } = await supabase
        .from("joueurs")
        .update({
          meilleur_score: scoreFinal,
          meilleur_temps: tempsTotal,
          date_meilleur_score: aujourdHui,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Erreur mise à jour record :", updateError);
      } else {
        console.log("Nouveau record !", scoreFinal, "points en", tempsTotal, "s");
      }
    }
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
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Colonne Image */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  {question?.images ? (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={question.images}
                          alt={question.texte || "Illustration"}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                      {question.image_credit_nom && question.image_credit_url && (
                        <Link
                          href={question.image_credit_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary inline-block"
                        >
                          {question.image_credit_nom}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Aucune image disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Colonne Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {questionIndex + 1} / {questions.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.length > 0 ? (
                    <>
                      <p className="text-lg leading-relaxed">{question.texte}</p>
                      
                      <div className="space-y-3 pt-2">
                        {question.reponses?.map((rep: any) => (
                          <Button
                            key={rep.id}
                            className="w-full h-auto py-3 px-4 whitespace-normal text-left justify-start"
                            onClick={() => handleClick(rep)}
                            disabled={afficherExplication}
                            variant={afficherExplication ? "secondary" : "default"}
                          >
                            {rep.texte}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground">Chargement de la question...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {afficherExplication && (
              <Alert className={`mt-6 ${reponseCorrecte ? 'bg-green-50 border-green-300 text-green-800' : 'bg-yellow-50 border-yellow-300 text-yellow-800'}`}>
                <AlertTitle>Explication</AlertTitle>
                <AlertDescription>{explication}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
}