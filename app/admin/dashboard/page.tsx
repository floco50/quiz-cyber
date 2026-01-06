"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import { Loader2, List, Plus, BarChart, LogOut, Zap, CheckCircle, XCircle } from 'lucide-react';

// --- INTERFACES TYPESCRIPT ---
interface Reponse {
  id: number;
  texte: string;
  est_correcte: boolean;
}

interface Question {
  id: number;
  texte: string;
  explication: string | null;
  images: string | null;
  image_credit_nom: string | null;
  image_credit_url: string | null;
  reponses: Reponse[];
}

interface Stat {
  question_id: number;
  success_rate: number;
}

export default function AdminDashboard() {
  // --- ÉTATS TYPÉS ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const [newQuestion, setNewQuestion] = useState("");
  const [newExplication, setNewExplication] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newImageCreditName, setNewImageCreditName] = useState("");
  const [newImageCreditURL, setNewImageCreditURL] = useState("");

  // Record<number, string> signifie que la clé est l'ID (number) et la valeur le texte (string)
  const [newAnswerTexts, setNewAnswerTexts] = useState<Record<number, string>>({});

  // ----------------------------------------------------
  // I. AUTHENTIFICATION & REDIRECTION
  // ----------------------------------------------------
  useEffect(() => {
    if (localStorage.getItem("is_admin") !== "true") {
      router.push("/admin/"); 
      return;
    }
    setIsAdmin(true);
    
    const fetchData = async () => {
        await Promise.all([loadQuestions(), loadStats()]);
        setLoading(false);
    }
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("is_admin");
    localStorage.removeItem("admin_email");
    toast.info("Déconnexion réussie !");
    setTimeout(() => {
        router.push("/");
    }, 500);
  };

  // ----------------------------------------------------
  // II. FONCTIONS DE GESTION DE SUPABASE
  // ----------------------------------------------------

  const loadQuestions = async () => {
    const { data, error } = await supabase.from("questions").select(`
      id,
      texte,
      explication,
      images,
      image_credit_nom,
      image_credit_url,
      reponses:reponse(id, texte, est_correcte)
    `).order("id", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des questions.");
      return;
    }

    // On force le cast si nécessaire, mais avec l'interface c'est plus propre
    setQuestions(data as Question[]);
  };

  const loadStats = async () => {
    const { data, error } = await supabase.rpc("get_question_stats");
    if (error) {
        console.error("Erreur RPC get_question_stats:", error);
        toast.error("Erreur lors du chargement des statistiques.");
    }
    else setStats(data as Stat[]);
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return toast.error("La question est vide");

    const { error } = await supabase.from("questions").insert({
      texte: newQuestion.trim(),
      explication: newExplication.trim() || null,
      images: newImage.trim() || null,
      image_credit_nom: newImageCreditName.trim() || null,
      image_credit_url: newImageCreditURL.trim() || null,
    });

    if (error) {
        console.error("Erreur ajout question :", error);
        return toast.error("Erreur lors de l'ajout de la question");
    }

    toast.success("Question ajoutée avec succès !");
    setNewQuestion("");
    setNewExplication("");
    setNewImage("");
    setNewImageCreditName("");
    setNewImageCreditURL("");
    loadQuestions(); 
  };

  const handleAnswerInputChange = (questionId: number, value: string) => {
    setNewAnswerTexts(prev => ({
        ...prev,
        [questionId]: value,
    }));
  };

  const addAnswer = async (questionId: number, est_correcte: boolean) => {
    const texte = newAnswerTexts[questionId];
    if (!texte || texte.trim() === "") return toast.error("Réponse vide");
    
    const sanitizedText = texte.trim(); 

    const { error } = await supabase.from("reponse").insert({
      question_id: questionId,
      texte: sanitizedText,
      est_correcte,
    });

    if (error) {
        console.error("Erreur ajout réponse :", error);
        return toast.error("Erreur ajout réponse");
    }
    
    toast.success(`Réponse ${est_correcte ? 'correcte' : 'fausse'} ajoutée !`);
    
    setNewAnswerTexts(prev => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
    });
    loadQuestions(); 
  };
  
  // ----------------------------------------------------
  // III. AFFICHAGE
  // ----------------------------------------------------
  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="mt-3">Chargement du Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900 p-6 text-white">
      <Toaster />

      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <h1 className="text-4xl font-extrabold flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-500"/> CyberQuiz Admin
        </h1>
        <Button onClick={handleLogout} variant="ghost" className="text-gray-300 hover:bg-white/10 hover:text-white">
            <LogOut className="w-5 h-5 mr-2" /> Déconnexion
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 text-white border border-white/20">
            <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <List className="w-4 h-4 mr-2" /> Questions
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Plus className="w-4 h-4 mr-2" /> Ajouter
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart className="w-4 h-4 mr-2" /> Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Liste des Questions ({questions.length})</h2>
            {questions.map((q) => (
              <Card key={q.id} className="mb-4 bg-white/5 border-white/20">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Q{q.id} — {q.texte}</CardTitle>
                </CardHeader>
                <CardContent>
                  {q.images && (
                    <img src={q.images} alt="" className="w-full max-w-xs h-auto rounded mb-3 border border-white/10 object-cover" />
                  )}
                  {q.explication && <p className="text-sm opacity-90 mb-4 bg-gray-700/50 p-3 rounded border border-gray-600/50 text-gray-300"><span className="font-bold">Explication :</span> {q.explication}</p>}
                  
                  <h3 className="font-semibold mb-2 text-lg text-gray-200">Réponses :</h3>
                  <ul className="space-y-2">
                    {q.reponses?.map((r) => (
                        <li key={r.id} className={`p-3 rounded flex items-center justify-between ${r.est_correcte ? "bg-green-700/40 border border-green-600/50" : "bg-red-700/40 border border-red-600/50"}`}>
                          <span className="flex items-center">
                            {r.est_correcte ? <CheckCircle className="w-4 h-4 mr-2 text-green-300" /> : <XCircle className="w-4 h-4 mr-2 text-red-300" />}
                            {r.texte}
                          </span>
                        </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Input
                      placeholder="Texte de la nouvelle réponse"
                      value={newAnswerTexts[q.id] || ""}
                      onChange={(e) => handleAnswerInputChange(q.id, e.target.value)}
                      className="mb-3 bg-gray-800 border-gray-700 text-white"
                    />
                    <div className="flex gap-3">
                      <Button onClick={() => addAnswer(q.id, true)} disabled={!newAnswerTexts[q.id]} className="flex-1 bg-green-600">Bonne réponse</Button>
                      <Button onClick={() => addAnswer(q.id, false)} disabled={!newAnswerTexts[q.id]} className="flex-1 bg-red-600">Mauvaise réponse</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card className="bg-white/5 border-white/20">
              <CardContent className="space-y-4 pt-6">
                <Textarea placeholder="Texte de la question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                <Textarea placeholder="Explication détaillée" value={newExplication} onChange={(e) => setNewExplication(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                <Input placeholder="URL de l'image" value={newImage} onChange={(e) => setNewImage(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                <Button className="w-full bg-blue-600" onClick={addQuestion} disabled={!newQuestion.trim()}>Ajouter la Question</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <Card className="bg-white/5 border-white/20">
              <CardContent className="pt-6">
                {stats.map((s) => (
                  <div key={s.question_id} className="mb-3 p-3 rounded bg-gray-700/30 border border-gray-600/50">
                    <p className="font-bold">Question ID: {s.question_id} - Réussite : {s.success_rate}%</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}