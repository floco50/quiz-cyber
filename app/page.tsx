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
// Ajout d'une icône pour le style
import { ShieldCheck, PlayCircle, Trophy } from 'lucide-react';

export default function Home() {
  // --- ÉTATS ---
  const [quizLance, setQuizLance] = useState(false); // Nouvel état pour la page d'accueil
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

  // 1. CHARGEMENT DES QUESTIONS (Au montage du composant)
  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id, texte, images, image_credit_nom, image_credit_url, explication,
          reponses:reponse!inner (id, texte, est_correcte)
        `)
        .order("id", { ascending: true })
        .order("texte", { foreignTable: "reponse" });

      if (error) console.error("Erreur Supabase :", error);
      if (data) setQuestions(data);
    }
    fetchQuestion();
  }, []);

  // 2. RÉCUPÉRATION DU NOM DU JOUEUR (Quand il a validé son pseudo)
  useEffect(() => {
    if (joueurPret) {
      setDebut(Date.now()); // On démarre le chrono ici !
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

  // 3. LOGIQUE DU QUIZ (Réponse, Score, Fin)
  function handleClick(rep: any) {
    if (!question || afficherExplication) return;
    
    // Correction ici : Supabase peut renvoyer un string ou boolean selon ta config
    const estCorrect = String(rep.est_correcte) === 'true' || rep.est_correcte === true;
    const message = estCorrect ? "Bonne réponse !" : "Mauvaise réponse !";

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

  // Enregistrement final quand l'index dépasse la longueur
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

  // --- RENDU ---

  // A. ÉCRAN DE FIN
  if (quizTermine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <h2 className="text-4xl font-bold mb-8 text-primary">Félicitations !</h2>
        <Card className="w-full max-w-md mb-8">
          <CardHeader><CardTitle className="text-center">Ton Résultat</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-5xl font-bold text-blue-600">{score} / {questions.length}</p>
            <p className="text-muted-foreground italic">Bravo {joueurNom} !</p>
          </CardContent>
        </Card>
        <Classement />
        <Button onClick={() => window.location.reload()} className="mt-8">Rejouer</Button>
      </div>
    );
  }

  // B. ÉCRAN 1 : PAGE D'ACCUEIL
  if (!quizLance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black text-white p-6">
        <ShieldCheck className="w-24 h-24 text-blue-400 mb-6 animate-pulse" />
        <h1 className="text-5xl font-extrabold mb-4 text-center tracking-tight">QUIZ CYBER</h1>
        <p className="text-xl text-blue-100 mb-12 text-center max-w-lg">
          Testez vos réflexes face aux menaces numériques. Serez-vous à la hauteur pour protéger vos données ?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl">
          <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
            <Trophy className="mx-auto mb-2 text-yellow-400" />
            <p className="text-sm">Gagnez des points</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
            <PlayCircle className="mx-auto mb-2 text-green-400" />
            <p className="text-sm">{questions.length} Questions</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
            <ShieldCheck className="mx-auto mb-2 text-blue-400" />
            <p className="text-sm">Apprenez en jouant</p>
          </div>
        </div>
        <Button 
          size="lg" 
          onClick={() => setQuizLance(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-8 text-2xl rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
        >
          COMMENCER L'ENTRAINEMENT
        </Button>
      </div>
    );
  }

  // C. ÉCRAN 2 : PSEUDO
  if (!joueurPret) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <FormulaireJoueur onJoueurCree={() => setJoueurPret(true)} />
      </div>
    );
  }

  // D. ÉCRAN 3 : LE QUIZ
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Toaster />
      <Alert className="bg-blue-600 text-white border-none rounded-none py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
           <div>
             <AlertTitle className="text-lg">Agent : {joueurNom}</AlertTitle>
             <AlertDescription className="text-blue-100 opacity-80">Mission de sécurisation en cours...</AlertDescription>
           </div>
           <div className="text-right">
             <p className="text-sm font-bold uppercase opacity-60">Score actuel</p>
             <p className="text-2xl font-black">{score} / {questions.length}</p>
           </div>
        </div>
      </Alert>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Illustration */}
          <Card className="overflow-hidden border-none shadow-xl">
            <CardContent className="p-0 relative aspect-video bg-gray-200">
              {question?.images ? (
                <Image src={question.images} alt="Cyber security" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Pas d'image</div>
              )}
            </CardContent>
          </Card>

          {/* Question & Réponses */}
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex justify-between items-center">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Question {questionIndex + 1}
                </span>
                <span className="text-gray-400 text-sm italic">Cyber Quiz v1.0</span>
              </div>
              <CardTitle className="text-2xl mt-4 leading-snug">{question?.texte}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {question?.reponses?.map((rep: any) => (
                <Button
                  key={rep.id}
                  variant={afficherExplication ? "outline" : "default"}
                  className={`w-full h-auto py-5 px-6 text-lg justify-start text-left whitespace-normal transition-all ${
                    afficherExplication && rep.est_correcte ? "border-green-500 bg-green-50 text-green-700" : ""
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

        {/* Explication */}
        {afficherExplication && (
          <Alert className={`mt-8 animate-in slide-in-from-bottom-4 duration-500 ${
            reponseCorrecte ? 'bg-green-100 border-green-400 text-green-900' : 'bg-red-100 border-red-400 text-red-900'
          }`}>
            <AlertTitle className="font-bold flex items-center gap-2">
              {reponseCorrecte ? "✅ Excellent !" : "❌ Analyse de l'erreur"}
            </AlertTitle>
            <AlertDescription className="text-lg mt-2">{explication}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}