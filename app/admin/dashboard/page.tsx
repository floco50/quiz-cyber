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

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // --- Formulaire d'ajout de question ---
  const [newQuestion, setNewQuestion] = useState("");
  const [newExplication, setNewExplication] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newImageCreditName, setNewImageCreditName] = useState("");
  const [newImageCreditURL, setNewImageCreditURL] = useState("");

  // --- Gestion des Inputs de réponse dynamiques ---
  // On utilise Map ou un objet avec des IDs de question comme clés
  const [newAnswerTexts, setNewAnswerTexts] = useState({});

  // ----------------------------------------------------
  // I. AUTHENTIFICATION & REDIRECTION
  // ----------------------------------------------------
  useEffect(() => {
    // Vérification rapide de l'authentification basée sur localStorage
    if (localStorage.getItem("is_admin") !== "true") {
      // Pour éviter un flash de contenu, on laisse le Loader2 si non authentifié.
      router.push("/admin/"); 
      return;
    }
    setIsAdmin(true);
    
    // Charger les données une fois l'admin vérifié
    const fetchData = async () => {
        // Chargement simultané pour la rapidité
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

  // Charger questions
  const loadQuestions = async () => {
    // Utilisation de l'alias 'reponses' pour une meilleure clarté dans le state.
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

    setQuestions(data);
  };

  // Charger statistiques (nécessite une fonction RPC 'get_question_stats' dans Supabase)
  const loadStats = async () => {
    const { data, error } = await supabase.rpc("get_question_stats");
    if (error) {
        console.error("Erreur RPC get_question_stats:", error);
        toast.error("Erreur lors du chargement des statistiques.");
    }
    else setStats(data);
  };

  // Ajouter une question
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
    // Réinitialisation des champs et rechargement
    setNewQuestion("");
    setNewExplication("");
    setNewImage("");
    setNewImageCreditName("");
    setNewImageCreditURL("");
    // Recharger uniquement les questions, les stats peuvent être chargées plus tard ou manuellement.
    loadQuestions(); 
  };

  // Gestionnaire pour l'ajout de réponse (Input dynamique)
  const handleAnswerInputChange = (questionId, value) => {
    setNewAnswerTexts(prev => ({
        ...prev,
        [questionId]: value,
    }));
  };

  // Ajouter réponse
  const addAnswer = async (questionId, est_correcte) => {
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
    
    // Effacer l'input et recharger la liste
    setNewAnswerTexts(prev => {
        const newState = { ...prev };
        delete newState[questionId]; // Supprime la clé spécifique
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

      {/* En-tête du Dashboard */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <h1 className="text-4xl font-extrabold flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-500"/> CyberQuiz Admin Dashboard
        </h1>
        <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="text-gray-300 hover:bg-white/10 hover:text-white"
        >
            <LogOut className="w-5 h-5 mr-2" />
            Déconnexion
        </Button>
      </div>

      {/* Contenu principal (Tabs) */}
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

          {/* LISTE DES QUESTIONS */}
          <TabsContent value="questions" className="mt-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-200">Liste des Questions ({questions.length})</h2>
            {questions.length === 0 && <p className="text-gray-400">Aucune question n'a été trouvée.</p>}
            {questions.map((q) => (
              <Card key={q.id} className="mb-4 bg-white/5 border-white/20">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Q{q.id} — {q.texte}</CardTitle>
                </CardHeader>
                <CardContent>
                  {q.images && (
                    <>
                    <img 
                      src={q.images} 
                      alt={`Image pour Q${q.id}`} 
                      className="w-full max-w-xs h-auto rounded mb-3 border border-white/10 object-cover" 
                    />
                    {(q.image_credit_nom || q.image_credit_url) && (
                        <p className="text-xs italic mb-2 text-gray-400">
                          Crédit : 
                          {q.image_credit_url ? (
                              <a href={q.image_credit_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">
                                  {q.image_credit_nom || q.image_credit_url}
                              </a>
                          ) : (
                              q.image_credit_nom
                          )}
                        </p>
                    )}
                    </>
                  )}
                  {/* Utilisation de <p> avec style au lieu de ** pour la mise en forme Markdown dans JSX */}
                  {q.explication && <p className="text-sm opacity-90 mb-4 bg-gray-700/50 p-3 rounded border border-gray-600/50 text-gray-300"><span className="font-bold">Explication :</span> {q.explication}</p>}
                  
                  <h3 className="font-semibold mb-2 text-lg text-gray-200">Réponses ({q.reponses?.length || 0}) :</h3>
                  <ul className="space-y-2">
                    {/* S'assurer que q.reponses est un tableau avant de mapper */}
                    {q.reponses && q.reponses.length > 0 ? (
                        q.reponses.map((r) => (
                            <li 
                                key={r.id} 
                                className={`p-3 rounded flex items-center justify-between ${r.est_correcte ? "bg-green-700/40 border border-green-600/50" : "bg-red-700/40 border border-red-600/50"}`}
                            >
                              <span className="flex items-center">
                                {r.est_correcte ? <CheckCircle className="w-4 h-4 mr-2 text-green-300" /> : <XCircle className="w-4 h-4 mr-2 text-red-300" />}
                                {r.texte}
                              </span>
                              <span className="text-xs font-bold opacity-70">
                                ({r.est_correcte ? "Correcte" : "Fausse"})
                              </span>
                            </li>
                        ))
                    ) : (
                        <p className="text-yellow-500 italic text-sm">Aucune réponse associée à cette question.</p>
                    )}
                  </ul>

                  {/* Ajouter une réponse */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                      <h4 className="font-medium mb-2 text-gray-300">Ajouter une réponse :</h4>
                    <Input
                      placeholder="Texte de la nouvelle réponse"
                      value={newAnswerTexts[q.id] || ""}
                      onChange={(e) => handleAnswerInputChange(q.id, e.target.value)}
                      className="mb-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => addAnswer(q.id, true)}
                        // Désactivation si l'input pour cet ID est vide
                        disabled={!newAnswerTexts[q.id] || newAnswerTexts[q.id].trim() === ""}
                        className="flex-1 bg-green-600 hover:bg-green-700 font-semibold"
                      >
                        Bonne réponse
                      </Button>

                      <Button
                        onClick={() => addAnswer(q.id, false)}
                        // Désactivation si l'input pour cet ID est vide
                        disabled={!newAnswerTexts[q.id] || newAnswerTexts[q.id].trim() === ""}
                        className="flex-1 bg-red-600 hover:bg-red-700 font-semibold"
                      >
                        Mauvaise réponse
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* AJOUTER QUESTION */}
          <TabsContent value="add" className="mt-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-300">📝 Ajouter une Nouvelle Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Texte de la question" 
                    value={newQuestion} 
                    onChange={(e) => setNewQuestion(e.target.value)} 
                    className="bg-gray-800 border-gray-700 min-h-[100px] text-white placeholder-gray-500"
                />
                <Textarea 
                    placeholder="Explication détaillée (optionnel)" 
                    value={newExplication} 
                    onChange={(e) => setNewExplication(e.target.value)} 
                    className="bg-gray-800 border-gray-700 min-h-[150px] text-white placeholder-gray-500"
                />
                <Input 
                    placeholder="URL de l'image (optionnel)" 
                    value={newImage} 
                    onChange={(e) => setNewImage(e.target.value)} 
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                />
                <Input 
                    placeholder="Nom du créditeur de l'image (optionnel)" 
                    value={newImageCreditName} 
                    onChange={(e) => setNewImageCreditName(e.target.value)} 
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                />
                <Input 
                    placeholder="URL du crédit (optionnel)" 
                    value={newImageCreditURL} 
                    onChange={(e) => setNewImageCreditURL(e.target.value)} 
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                />

                <Button 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-semibold text-lg" 
                    onClick={addQuestion}
                    // Désactivation si la question est vide après trim()
                    disabled={!newQuestion.trim()}
                >
                    Ajouter la Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTIQUES */}
          <TabsContent value="stats" className="mt-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-300">📊 Statistiques des Questions</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.length === 0 && <p className="text-yellow-400">Aucune donnée statistique pour le moment. (Vérifiez la fonction Supabase RPC 'get_question_stats')</p>}
                {stats.map((s) => (
                  <div key={s.question_id} className="mb-3 p-3 rounded bg-gray-700/30 border border-gray-600/50">
                    <p className="font-bold text-lg text-gray-200">Question ID: {s.question_id}</p>
                    <p className="text-sm text-gray-300">Taux de réussite : 
                      <span className={`ml-2 font-semibold ${s.success_rate > 70 ? 'text-green-400' : s.success_rate > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {s.success_rate}%
                      </span>
                    </p>
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