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
import { 
  Loader2, List, Plus, BarChart, LogOut, 
  CheckCircle, XCircle, Image as ImageIcon, MessageSquare, Shield, Trash2 
} from 'lucide-react';

// --- TYPES ---
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
  reponses: Reponse[];
}

interface Stat {
  question_id: number;
  success_rate: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [newQuestion, setNewQuestion] = useState("");
  const [newExplication, setNewExplication] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newAnswerTexts, setNewAnswerTexts] = useState<Record<number, string>>({});

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const adminStatus = localStorage.getItem("is_admin");
        if (adminStatus !== "true") {
          router.push("/admin");
          return;
        }

        setIsAuthorized(true);
        try {
          await Promise.all([fetchQuestions(), fetchStats()]);
        } catch (error) {
          console.error("Erreur:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    checkAuth();
  }, [router]);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select(`id, texte, explication, images, reponses:reponse(id, texte, est_correcte)`)
      .order("id", { ascending: false });
    if (!error) setQuestions(data as Question[]);
  };

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc("get_question_stats");
    if (!error && data) setStats(data as Stat[]);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return toast.error("Question vide");
    const { error } = await supabase.from("questions").insert({
      texte: newQuestion.trim(),
      explication: newExplication.trim() || null,
      images: newImage.trim() || null,
    });
    if (error) return toast.error("Erreur d'ajout");
    toast.success("Question ajoutée !");
    setNewQuestion("");
    setNewExplication("");
    setNewImage("");
    fetchQuestions();
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Supprimer cette question et toutes ses réponses ?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error("Erreur de suppression");
    toast.success("Question supprimée");
    fetchQuestions();
  };

  const handleAddAnswer = async (questionId: number, isCorrect: boolean) => {
    const texte = newAnswerTexts[questionId];
    if (!texte?.trim()) return toast.error("Texte manquant");
    const { error } = await supabase.from("reponse").insert({
      question_id: questionId,
      texte: texte.trim(),
      est_correcte: isCorrect,
    });
    if (error) return toast.error("Erreur");
    toast.success("Réponse ajoutée");
    setNewAnswerTexts(prev => ({ ...prev, [questionId]: "" }));
    fetchQuestions();
  };

  const handleDeleteAnswer = async (id: number) => {
    const { error } = await supabase.from("reponse").delete().eq("id", id);
    if (error) return toast.error("Erreur");
    toast.success("Option supprimée");
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="font-medium">Accès sécurisé en cours...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <Toaster position="top-right" richColors />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Shield className="text-blue-500 w-8 h-8" /> 
            CyberQuiz Admin
          </h1>
          <Button onClick={() => { localStorage.clear(); router.push("/admin"); }} variant="destructive" size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/10 p-1">
            <TabsTrigger value="list" className="px-6">Questions</TabsTrigger>
            <TabsTrigger value="add" className="px-6">Nouveau</TabsTrigger>
            <TabsTrigger value="stats" className="px-6">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {questions.length === 0 && <p className="text-center py-10 text-gray-500">Aucune question trouvée.</p>}
            {questions.map((q) => (
              <Card key={q.id} className="bg-white/5 border-white/10 text-white overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-white/5">
                  <CardTitle className="text-blue-400 text-lg pr-4">Q{q.id}: {q.texte}</CardTitle>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteQuestion(q.id)}>
                    <Trash2 size={18} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Options de réponse</p>
                      {q.reponses?.map((r) => (
                        <div key={r.id} className={`group p-3 rounded-lg text-sm flex items-center justify-between ${r.est_correcte ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          <span className="flex items-center gap-2">
                            {r.est_correcte ? <CheckCircle size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>} 
                            {r.texte}
                          </span>
                          <button onClick={() => handleDeleteAnswer(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase">Ajouter une option</p>
                      <Input 
                        placeholder="Texte de la réponse..." 
                        value={newAnswerTexts[q.id] || ""}
                        onChange={(e) => setNewAnswerTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="bg-gray-900 border-white/10 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAddAnswer(q.id, true)}>Correcte</Button>
                        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleAddAnswer(q.id, false)}>Fausse</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="add">
            <Card className="bg-white/5 border-white/10 text-white max-w-xl mx-auto backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="text-blue-500"/> Créer une question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Question</label>
                  <Textarea placeholder="Ex: Quel protocole est utilisé pour sécuriser le web ?" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="bg-gray-900 border-white/10 min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Explication pédagogique</label>
                  <Textarea placeholder="Sera affichée après la réponse..." value={newExplication} onChange={e => setNewExplication(e.target.value)} className="bg-gray-900 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">URL de l'image (optionnel)</label>
                  <Input placeholder="https://..." value={newImage} onChange={e => setNewImage(e.target.value)} className="bg-gray-900 border-white/10" />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg font-semibold mt-4" onClick={handleAddQuestion}>
                  Publier la Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stats.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">Aucune donnée statistique disponible.</p>}
              {stats.map(s => (
                <Card key={s.question_id} className="bg-white/5 border-white/10 text-white p-5 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">Analyse Question #{s.question_id}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold">{s.success_rate}%</p>
                    <p className="text-xs text-gray-400">de réussite</p>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${s.success_rate}%` }}
                    ></div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}