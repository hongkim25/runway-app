"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

type RoadmapStage = {
    target_percentage: number;
    milestone_task: string;
    clothing_item: string;
};

export default function DashboardPage() {
    const [goal, setGoal] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [roadmap, setRoadmap] = useState<RoadmapStage[]>([]);
    const [images, setImages] = useState<string[]>([]);

    // Array of custom typed strings for each of the 4 items
    const [customTasks, setCustomTasks] = useState<string[]>(["", "", "", ""]);

    // Array of index numbers representing completed stages
    const [checkedMilestones, setCheckedMilestones] = useState<number[]>([]);
    const percentage = (roadmap.length > 0 && checkedMilestones.length > 0)
        ? Math.min(100, Math.round((checkedMilestones.length / roadmap.length) * 100))
        : 0;

    const [showFinale, setShowFinale] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [generatingFinal, setGeneratingFinal] = useState(false);

    useEffect(() => {
        // Load data from persistent storage
        const storedGoal = localStorage.getItem("runwayGoal") || "";
        const storedDate = localStorage.getItem("runwayDate") || "";
        const campaignId = localStorage.getItem("runwayCampaignId");

        setGoal(storedGoal);
        setTargetDate(storedDate);

        if (campaignId) {
            fetch(`/api/campaign/${campaignId}`)
                .then(res => res.json())
                .then(parsed => {
                    setRoadmap(parsed.roadmap || []);
                    setImages(parsed.images || []);
                })
                .catch(e => console.error("Failed to fetch runway data", e));
        }

        // Load checked milestones
        const savedChecks = localStorage.getItem("runwayChecks");
        if (savedChecks) {
            try {
                setCheckedMilestones(JSON.parse(savedChecks));
            } catch (e) {
                console.error("Failed to parse checked milestones", e);
            }
        }
    }, [percentage, finalImage, generatingFinal]);

    const handleCustomTaskChange = (idx: number, val: string) => {
        const newTasks = [...customTasks];
        newTasks[idx] = val;
        setCustomTasks(newTasks);
        localStorage.setItem("runwayCustomTasks", JSON.stringify(newTasks));
    };

    const toggleMilestone = (idx: number) => {
        let newChecks = [...checkedMilestones];
        if (newChecks.includes(idx)) {
            newChecks = newChecks.filter(i => i !== idx); // Uncheck
        } else {
            newChecks.push(idx); // Check
        }
        setCheckedMilestones(newChecks);
        localStorage.setItem("runwayChecks", JSON.stringify(newChecks));
    };

    useEffect(() => {
        if (percentage >= 100) {
            if (!finalImage && !generatingFinal) {
                setGeneratingFinal(true);
                const campaignId = localStorage.getItem("runwayCampaignId");
                fetch("/api/generate-final-look", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ campaign_id: campaignId })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.image) setFinalImage(data.image);
                        setGeneratingFinal(false);
                    })
                    .catch(e => {
                        console.error("Failed final generation", e);
                        setGeneratingFinal(false);
                    });
            }
        } else {
            setFinalImage(null);
            setShowFinale(false);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [percentage, finalImage, generatingFinal]);

    const daysCountdown = React.useMemo(() => {
        if (!targetDate) return 0;
        const t = new Date(targetDate);
        const today = new Date();
        const diff = t.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    }, [targetDate]);

    if (!goal || roadmap.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <p className="text-white/50 tracking-[0.2em] uppercase text-xs mb-8">No Active Campaign</p>
                <Link href="/" className="border border-white/20 px-8 py-3 text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-colors">
                    Start Season 1
                </Link>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-8 py-12 animate-fade-in relative z-10 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 h-full">

                {/* Left Column: Mannequin/Final Synthesis */}
                <div className="col-span-1 lg:col-span-4 flex flex-col border-r border-white/20 pr-8 min-h-[800px]">

                    {/* Mannequin Image Stack / Final Look */}
                    <div className="w-full h-full min-h-[800px] relative overflow-hidden bg-white border border-white/20 shadow-2xl flex items-center justify-center">

                        {generatingFinal && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 text-white">
                                <div className="w-12 h-12 border-t-2 border-l-2 border-white rounded-full animate-spin mb-6"></div>
                                <p className="tracking-[0.3em] uppercase text-[10px] font-light text-white/50">Synthesizing Final Look...</p>
                            </div>
                        )}

                        {finalImage ? (
                            <>
                                <img src={finalImage} alt="Final Look" className="absolute inset-0 w-full h-full object-cover z-20 animate-fade-in" />
                                <button
                                    onClick={() => {
                                        setShowFinale(true);
                                        if (videoRef.current) videoRef.current.play();
                                    }}
                                    className="absolute bottom-12 z-40 bg-black text-white px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors border border-white/20 shadow-2xl"
                                >
                                    Play Runway Finale
                                </button>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-black pointer-events-none transition-opacity duration-1000 z-0">
                                <svg className="w-2/3 h-5/6" viewBox="0 0 200 400" stroke="currentColor" strokeWidth="1">
                                    {/* Head & Neck (Look 4/Accessory) */}
                                    <path d="M100 20 C110 20, 115 30, 115 45 C115 60, 105 70, 100 75 C95 70, 85 60, 85 45 C85 30, 90 20, 100 20 Z"
                                        fill={checkedMilestones.includes(3) ? "currentColor" : "transparent"}
                                        className="transition-colors duration-1000" />
                                    {/* Torso & Legs (Looks 1, 2, 3) */}
                                    <path d="M70 85 C85 80, 115 80, 130 85 C145 90, 150 110, 150 140 C150 190, 140 210, 130 220 L130 380 L110 380 L110 230 L90 230 L90 380 L70 380 L70 220 C60 210, 50 190, 50 140 C50 110, 55 90, 70 85 Z"
                                        fill={checkedMilestones.length >= 2 ? "currentColor" : "transparent"}
                                        className="transition-colors duration-1000" />
                                </svg>
                            </div>
                        )}

                        {(!images || images.length === 0 || images.every(img => !img || img === "None" || img.length < 50)) && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-black/40 z-10 pointer-events-none">
                                Awaiting Assets
                            </div>
                        )}

                        {/* Minimal overlays */}
                        {!finalImage && !generatingFinal && (
                            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-widest text-white/80">
                                MANNEQUIN ({percentage}%)
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Context & The Collection */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 pl-4">

                    {/* Header Context (Moved from Left) */}
                    <div className="mb-4 flex flex-col items-end text-right border-b border-black/10 pb-6 pr-4">
                        <h2 className="text-[10px] tracking-[0.4em] font-serif italic text-black/40 mb-1">Season 1</h2>
                        <h3 className="text-2xl font-light tracking-wide text-black uppercase mb-4">The {goal} Collection</h3>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] tracking-[0.2em] uppercase text-black/40 mb-1">Campaign Progress</p>
                                <p className="text-lg font-thin text-black">{percentage}% <span className="text-[10px] text-black/30">({checkedMilestones.length}/{roadmap.length})</span></p>
                            </div>
                            <div className="w-[1px] h-8 bg-black/20"></div>
                            <div className="text-left">
                                <p className="text-[9px] tracking-[0.2em] uppercase text-black/40 mb-1">Target Date</p>
                                <p className="text-lg font-thin text-black">T-{daysCountdown}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-[10px] tracking-[0.4em] font-light uppercase text-black/50 mb-2">The Collection Grid</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
                        {roadmap.map((stage, idx) => {
                            const imgBase64 = images && images[idx] && images[idx] !== "None" && images[idx].length > 50 ? images[idx] : null;
                            const isChecked = checkedMilestones.includes(idx);
                            const isRevealed = percentage >= stage.target_percentage;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => toggleMilestone(idx)}
                                    className={`bg-white p-4 pb-6 flex flex-col gap-4 shadow-xl transition-all duration-700 cursor-pointer border hover:border-black
                    ${isRevealed ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'} ${isChecked ? 'border-black' : 'border-transparent'}`}
                                >
                                    {/* The Generated Image (Polaroid style) */}
                                    <div className="w-full h-40 xl:h-48 bg-white border-b border-black/10 relative overflow-hidden group flex items-center justify-center">
                                        {imgBase64 ? (
                                            <img
                                                src={imgBase64}
                                                alt={stage.clothing_item}
                                                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-[2s] group-hover:scale-105 p-2"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-black/40 p-2 text-center uppercase tracking-widest">
                                                Polaroid Processing...
                                            </div>
                                        )}

                                        {/* Hover check hint overlay */}
                                        {!isChecked && (
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
                                                <span className="text-[10px] tracking-[0.3em] uppercase text-black opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">Mark Complete</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Polaroid Text Area */}
                                    <div className="text-black pt-2 border-t border-black/10">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] tracking-[0.3em] uppercase text-black/50">Item {idx + 1}</span>

                                            {/* High Fashion Custom Checkbox */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase tracking-widest text-black/40 bg-black/5 px-2 py-0.5 mr-2">{stage.target_percentage}%</span>
                                                <div
                                                    className={`w-4 h-4 flex items-center justify-center transition-colors
                                                  ${isChecked ? 'bg-black border-black' : 'border border-black/20 bg-transparent'}`}
                                                >
                                                    {isChecked && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-medium leading-tight mb-4 tracking-wide uppercase">{stage.clothing_item}</h4>

                                        <div className="w-full">
                                            <textarea
                                                className="w-full bg-black/5 border border-black/10 p-3 text-xs font-serif italic text-black focus:outline-none focus:border-black/40 resize-none min-h-[60px] transition-colors placeholder:text-black/30"
                                                placeholder={`Action required for ${stage.clothing_item.toLowerCase()}?`}
                                                value={customTasks[idx] || ""}
                                                onChange={(e) => handleCustomTaskChange(idx, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FINALE VIDEO MODAL */}
            <div
                className={`fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center transition-opacity duration-1000 ${showFinale ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                <video
                    ref={videoRef}
                    src="/finale.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={false}
                    playsInline
                />

                <button
                    onClick={() => {
                        setShowFinale(false);
                        if (videoRef.current) { videoRef.current.pause(); }
                    }}
                    className="absolute top-8 right-8 text-white uppercase text-xs tracking-widest z-50 hover:underline bg-black/40 px-6 py-2 backdrop-blur-sm"
                >
                    Exit Runway
                </button>
            </div>

        </main>
    );
}
