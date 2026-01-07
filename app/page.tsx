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
import Classement from "@/components/Classement";
import { ShieldCheck, PlayCircle, Trophy, ExternalLink } from 'lucide-react';

export default function Home() {
  // --- ÉTATS ---
  const [quizLance, setQuizLance] = useState(false);
  const [joueurPret, setJoueurPret] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [explication, setExplication] = useState("");
  const [afficherExplication, setAfficherExplication] = useState(false);
  const [reponseCorrecte, setReponseCorrecte] = useState(false);
  const [joueurNom, setJoueurNom] = useState<string>('Sans nom');
  const [score, setScore] = useState(0);
  const [debut, setDebut] = useState<number | null>(null);
  const [quizTermine, setQuizTermine] = useState(false);

  const question = questions[questionIndex];

  // 1. CHARGEMENT DES QUESTIONS + STATISTIQUES
  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id, texte, images, image_credit_nom, image_credit_url, explication,
          nb_reussites, nb_echecs,
          reponses:reponse!inner (id, texte, est_correcte)
        `)
        .order("id", { ascending: true })
        .order("texte", { foreignTable: "reponse" });

      if (error) console.error("Erreur Supabase :", error);
      if (data) setQuestions(data);
    }
    fetchQuestion();
  }, []);

  useEffect(() => {
    if (joueurPret) {
      setDebut(Date.now());
      const userId = localStorage.getItem("supabase_user_id");
      if (userId) {
        supabase
          .from("joueurs")
          .select("pseudo")
          .eq("user_id", userId)
          .single()
          .then(({ data }) => {
            if (data) setJoueurNom(data.pseudo);
          });
      }
    }
  }, [joueurPret]);

  // 2. GESTION DU CLIC ET MISE À JOUR DES STATS
  async function handleClick(rep: any) {
    if (!question || afficherExplication) return;

    const estCorrect = String(rep.est_correcte) === 'true' || rep.est_correcte === true;
    const message = estCorrect ? "Bonne réponse !" : "Mauvaise réponse !";

    // Mise à jour des statistiques dans la base de données
    const columnToUpdate = estCorrect ? 'nb_reussites' : 'nb_echecs';
    
    // On lance l'update en arrière-plan sans bloquer l'UI
    supabase.rpc(estCorrect ? 'increment_reussite' : 'increment_echec', { 
      question_id: question.id 
    }).then(({ error }) => {
        if (error) console.error("Erreur stats:", error);
    });

    toast(message, { icon: estCorrect ? "✅" : "❌" });
    setExplication(message + " " + (question.explication || ""));
    setAfficherExplication(true);
    setReponseCorrecte(estCorrect);

    if (estCorrect) setScore((prev) => prev + 1);

    setTimeout(() => {
      setAfficherExplication(false);
      setQuestionIndex((prev) => prev + 1);
    }, 4000);
  }

  useEffect(() => {
    if (questionIndex >= questions.length && questions.length > 0 && !quizTermine) {
      setQuizTermine(true);
      enregistrerMeilleurScore();
    }
  }, [questionIndex]);

  async function enregistrerMeilleurScore() {
    const userId = localStorage.getItem("supabase_user_id");
    if (!userId || !debut) return;
    const tempsTotal = Math.floor((Date.now() - debut) / 1000);

    const { data: joueur } = await supabase.from("joueurs").select("meilleur_score").eq("user_id", userId).single();
    if (joueur && score > (joueur.meilleur_score || 0)) {
      await supabase.from("joueurs").update({
        meilleur_score: score,
        meilleur_temps: tempsTotal,
        date_meilleur_score: new Date().toISOString().split("T")[0],
      }).eq("user_id", userId);
    }
  }

  if (quizTermine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white p-6 text-center">
        <h2 className="text-4xl font-bold mb-8">Félicitations !</h2>
        <Card className="w-full max-w-md mb-8 bg-white/10 border-white/20 text-white backdrop-blur-md">
          <CardHeader><CardTitle>Ton Résultat</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-5xl font-bold text-blue-400">{score} / {questions.length}</p>
            <p className="italic opacity-80">Bravo {joueurNom} !</p>
          </CardContent>
        </Card>
        <Classement />
        <Button onClick={() => window.location.reload()} className="mt-8 bg-blue-600 hover:bg-blue-500">Rejouer</Button>
      </div>
    );
  }

  if (!quizLance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white p-6">
        <ShieldCheck className="w-24 h-24 text-blue-400 mb-6 animate-pulse" />
        <h1 className="text-5xl font-extrabold mb-4 text-center tracking-tight">QUIZ CYBER</h1>
        <p className="text-xl text-blue-100 mb-12 text-center max-w-lg">
          Testez vos réflexes face aux menaces numériques.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl text-center">
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <Trophy className="mx-auto mb-2 text-yellow-400" />
            <p className="text-sm">Points & Records</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <PlayCircle className="mx-auto mb-2 text-green-400" />
            <p className="text-sm">{questions.length} Questions</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <ShieldCheck className="mx-auto mb-2 text-blue-400" />
            <p className="text-sm">Sécurité</p>
          </div>
        </div>
        <Button size="lg" onClick={() => setQuizLance(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-8 text-2xl rounded-full transition-all hover:scale-105">
          COMMENCER
        </Button>
      </div>
    );
  }

  if (!joueurPret) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white p-6">
        <FormulaireJoueur onJoueurCree={() => setJoueurPret(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 to-black text-white">
      <Toaster />
      <div className="bg-blue-600/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div>
            <p className="text-xs uppercase font-bold opacity-60 tracking-wider">Agent</p>
            <p className="text-lg font-bold">{joueurNom}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold opacity-60 tracking-wider">Progression</p>
            <p className="text-xl font-black">{score} / {questions.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Illustration & Crédits */}
          <div className="space-y-4">
            <Card className="rounded-xl overflow-hidden border-none shadow-2xl bg-gray-950 w-full p-0">
              <CardContent className="p-0 m-0 w-full relative">
                {question?.images ? (
                  <Image
                    src={question.images}
                    alt="Cyber security"
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto' }}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-white/20">
                    Pas d'image
                  </div>
                )}
              </CardContent>
            </Card>

            {question?.image_credit_nom && (
              <div className="flex items-center justify-end gap-2 text-xs text-white/50 italic px-2">
                <span>Crédit image : </span>
                {question.image_credit_url ? (
                  <Link
                    href={question.image_credit_url}
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {question.image_credit_nom} <ExternalLink size={10} />
                  </Link>
                ) : (
                  <span>{question.image_credit_nom}</span>
                )}
              </div>
            )}
          </div>

          {/* Question & Réponses */}
          <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-xl text-white">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Question {questionIndex + 1} / {questions.length}
                </span>
              </div>
              <CardTitle className="text-2xl leading-snug">{question?.texte}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {question?.reponses?.map((rep: any) => (
                <Button
                  key={rep.id}
                  variant="outline"
                  className={`w-full h-auto py-5 px-6 text-lg justify-start text-left whitespace-normal transition-all border-white/10 hover:bg-white/10 bg-transparent text-white ${afficherExplication && (String(rep.est_correcte) === 'true' || rep.est_correcte === true)
                    ? "border-green-500 bg-green-500/20 text-green-300"
                    : ""
                    }`}
                  onClick={() => handleClick(rep)}
                  disabled={afficherExplication}
                >
                  {rep.texte}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Explication + Statistiques */}
        {afficherExplication && (
          <Alert className={`mt-12 animate-in slide-in-from-bottom-4 duration-500 border-none backdrop-blur-md ${reponseCorrecte ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
            <AlertTitle className="font-bold flex items-center gap-2 text-xl">
              {reponseCorrecte ? "✅ Excellent !" : "❌ Analyse de l'erreur"}
            </AlertTitle>
            <AlertDescription className="text-lg mt-2 opacity-90">
              <p>{explication}</p>
              <div className="mt-4 pt-4 border-t border-white/10 text-sm flex gap-4 opacity-70">
                 <span>Statistiques mondiales :</span>
                 <span className="text-green-400">{question.nb_reussites || 0} réussites</span>
                 <span className="text-red-400">{question.nb_echecs || 0} échecs</span>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}