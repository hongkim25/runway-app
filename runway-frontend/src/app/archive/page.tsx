"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function ArchivePage() {
    const [goal, setGoal] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        // Check local storage for an existing Season 1
        const storedGoal = localStorage.getItem("runwayGoal") || "";
        const storedDate = localStorage.getItem("runwayDate") || "";

        if (storedGoal && storedDate) {
            setGoal(storedGoal);
            setTargetDate(storedDate);
            setHasData(true);
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col p-12 min-h-screen bg-black text-white relative">
            <h1 className="text-4xl font-thin tracking-widest uppercase mb-12 text-white border-b border-white/20 pb-4">
                Past Seasons
            </h1>

            {hasData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Season 1 Archive Card */}
                    <div className="border border-white/20 bg-black/40 p-8 hover:bg-white/5 transition-colors group cursor-pointer">
                        <h2 className="text-xs tracking-[0.3em] font-light uppercase text-white/50 mb-2">Season 1</h2>
                        <h3 className="text-2xl font-thin leading-tight text-white uppercase mb-6 truncate group-hover:text-gray-300">
                            The {goal} Collection
                        </h3>

                        <div className="flex justify-between items-end border-t border-white/10 pt-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Target Date</span>
                                <span className="text-xs font-mono text-white/80">{targetDate}</span>
                            </div>

                            <Link href="/dashboard" className="text-[10px] uppercase tracking-widest text-white border-b border-white hover:text-gray-400 transition-colors pb-1">
                                View Lookbook
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">Archive Currently Empty</p>
                </div>
            )}
        </div>
    );
}
