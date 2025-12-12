// components/Classement.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaMedal } from "react-icons/fa"; // npm install react-icons

type Joueur = {
    id: number;
    pseudo: string;
    meilleur_score: number;
    meilleur_temps: number;
    date_meilleur_score: string;
};

export default function Classement() {
    const [joueurs, setJoueurs] = useState<Joueur[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchClassement = async () => {
        setRefreshing(true);

        const { data, error } = await supabase
            .from("joueurs")
            .select("id, pseudo, meilleur_score, meilleur_temps, date_meilleur_score")
            .gt("meilleur_score", 0) // score > 0
            .order("meilleur_score", { ascending: false })
            .order("meilleur_temps", { ascending: true })
            .limit(10);

        if (error) {
            console.error("Erreur récupération classement :", error);
        } else {
            setJoueurs(data || []);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchClassement();
    }, []);

    const getMedal = (index: number) => {
        const medals = [
            { color: "text-yellow-500", title: "Or" },
            { color: "text-gray-400", title: "Argent" },
            { color: "text-orange-500", title: "Bronze" },
        ];
        if (index < 3) {
            return (
                <FaMedal
                    className={`w-5 h-5 ${medals[index].color}`}
                    title={`Médaille ${medals[index].title}`}
                />
            );
        }
        return <span>{index + 1}</span>;
    };

    if (loading) {
        return <p className="text-center mt-10 text-gray-500">Chargement du classement...</p>;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Classement</h2>
                <button
                    onClick={fetchClassement}
                    disabled={refreshing}
                    className="px-5 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
                </button>
            </div>

            <div className="overflow-x-auto shadow rounded-lg">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rang</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pseudo</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Temps (s)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {joueurs.map((joueur, index) => (
                            <tr
                                key={joueur.id}
                                className="border-t border-gray-200 hover:bg-gray-50 transition"
                            >
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {getMedal(index)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">{joueur.pseudo}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{joueur.meilleur_score}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                    {joueur.meilleur_temps ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                    {joueur.date_meilleur_score
                                        ? new Date(joueur.date_meilleur_score).toLocaleDateString("fr-FR")
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}