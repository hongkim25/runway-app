"use client";

import React, { useState, useRef, useEffect } from "react";

// Types matching the backend response
type RoadmapStage = {
  target_percentage: number;
  milestone_task: string;
  clothing_item: string;
};

export default function Home() {
  const [view, setView] = useState<"intake" | "loading" | "dashboard">("intake");

  // Form State
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [vibe, setVibe] = useState("");
  const [color, setColor] = useState("");
  const [designer, setDesigner] = useState("");
  const [image64, setImage64] = useState("");

  // Dashboard State
  const [roadmap, setRoadmap] = useState<RoadmapStage[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [grindNotes, setGrindNotes] = useState("");

  // Gamification State
  const [currentScore, setCurrentScore] = useState(0);
  const [showFinale, setShowFinale] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Calculate percentage safely
  const percentage = Math.min(100, Math.max(0, currentScore));

  useEffect(() => {
    if (percentage >= 100 && view === "dashboard") {
      setShowFinale(true);
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Video auto-play blocked", e));
      }
    } else {
      setShowFinale(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [percentage, view]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImage64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !targetDate || !color || !designer || !image64) {
      alert("Please fill all fields and upload an image.");
      return;
    }

    setView("loading");

    try {
      const res = await fetch("http://localhost:8000/api/generate-runway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          target_date: targetDate,
          vibe,
          color,
          designer,
          inspiration_image_base64: image64
        })
      });

      if (!res.ok) {
        throw new Error(`Server Error: ${res.status}`);
      }

      const data = await res.json();
      setRoadmap(data.roadmap || []);
      setImages(data.images || []);

      setCurrentScore(0);
      setView("dashboard");
    } catch (err) {
      console.error(err);
      setView("intake");
      alert("Failed to generate runway. Make sure backend is running.");
    }
  };

  const daysCountdown = React.useMemo(() => {
    if (!targetDate) return 0;
    const t = new Date(targetDate);
    const today = new Date();
    const diff = t.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [targetDate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950 flex flex-col relative overflow-x-hidden">

      {/* Background Image Layer */}
      {view === "intake" && (
        <>
          <div
            className="fixed inset-0 z-0 opacity-30 mix-blend-luminosity will-change-transform"
            style={{ backgroundImage: 'url("/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
          ></div>
          <div className="fixed inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </>
      )}

      {/* HEADER */}
      <header className="w-full py-8 px-12 flex justify-between items-center z-40 relative border-b border-zinc-900/50 backdrop-blur-sm">
        <h1 className="text-xl tracking-[0.4em] font-light uppercase text-zinc-100">RUNWAY</h1>
        {view === "dashboard" && (
          <button
            onClick={() => setView("intake")}
            className="text-[10px] tracking-widest uppercase hover:text-zinc-400 transition-colors border-b border-zinc-600 pb-1"
          >
            Start Over
          </button>
        )}
      </header>

      {/* VIEW 1: INTAKE FORM */}
      {view === "intake" && (
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-8 animate-fade-in relative z-10 w-full">
          <div className="mb-20 text-center">
            <h2 className="text-6xl md:text-8xl font-thin tracking-tighter mb-6 text-zinc-100 drop-shadow-lg">My life is a runway.</h2>
            <p className="text-zinc-400 tracking-[0.4em] uppercase text-[10px] font-medium">The Casting Call</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-5xl space-y-16 bg-zinc-950/40 backdrop-blur-2xl p-12 md:p-16 border border-zinc-800/50 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

              {/* Left Column */}
              <div className="space-y-12">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Life Goal</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Launching a startup"
                    className="w-full border-b border-zinc-800 py-2 bg-transparent text-sm font-light focus:outline-none focus:border-zinc-100 transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border-b border-zinc-800 py-2 bg-transparent text-sm font-light focus:outline-none focus:border-zinc-100 transition-colors text-zinc-300"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Aesthetic Style</label>
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full border-b border-zinc-800 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-zinc-100 transition-colors cursor-pointer text-zinc-300"
                  >
                    <option value="" disabled className="text-zinc-950">Select Style...</option>
                    <option value="Avant-Garde" className="text-zinc-950">Avant-Garde</option>
                    <option value="Quiet Luxury" className="text-zinc-950">Quiet Luxury</option>
                    <option value="Dark Academia" className="text-zinc-950">Dark Academia</option>
                    <option value="Streetwear Goth" className="text-zinc-950">Streetwear Goth</option>
                    <option value="Y2K Cyber" className="text-zinc-950">Y2K Cyber</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-12">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Designer</label>
                  <select
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
                    className="w-full border-b border-zinc-800 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-zinc-100 transition-colors cursor-pointer text-zinc-300"
                  >
                    <option value="" disabled className="text-zinc-950">Select...</option>
                    <option value="Alexander McQueen" className="text-zinc-950">Alexander McQueen</option>
                    <option value="Rick Owens" className="text-zinc-950">Rick Owens</option>
                    <option value="Maison Margiela" className="text-zinc-950">Maison Margiela</option>
                    <option value="Phoebe Philo" className="text-zinc-950">Phoebe Philo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Color Palette</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full border-b border-zinc-800 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-zinc-100 transition-colors cursor-pointer text-zinc-300"
                  >
                    <option value="" disabled className="text-zinc-950">Select Palette...</option>
                    <option value="Onyx Black & Slate" className="text-zinc-950">Onyx Black & Slate</option>
                    <option value="Crimson & Bone" className="text-zinc-950">Crimson & Bone</option>
                    <option value="Midnight Navy & Silver" className="text-zinc-950">Midnight Navy & Silver</option>
                    <option value="Emerald & Olive" className="text-zinc-950">Emerald & Olive</option>
                    <option value="Monochrome White" className="text-zinc-950">Monochrome White</option>
                    <option value="Earthy Neutrals (Taupe/Sand)" className="text-zinc-950">Earthy Neutrals (Taupe/Sand)</option>
                    <option value="Cyberpunk Neon Accents" className="text-zinc-950">Cyberpunk Neon Accents</option>
                    <option value="Pastel Lilac & Dust" className="text-zinc-950">Pastel Lilac & Dust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Texture / Concept Source</label>
                  <div className="border border-zinc-800 p-8 flex flex-col items-center justify-center relative hover:border-zinc-500 transition-colors h-32 group bg-zinc-900/50">
                    {image64 ? (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                        <img src={image64} alt="Preview" className="max-h-full max-w-full object-contain grayscale opacity-80" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white">Replace File</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Upload Texture Config</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 flex justify-center">
              <button
                type="submit"
                className="bg-zinc-100 text-zinc-950 px-12 py-4 tracking-[0.3em] uppercase text-[10px] hover:bg-zinc-300 transition-colors"
              >
                Assemble Collection
              </button>
            </div>
          </form>
        </main>
      )}

      {/* LOADING STATE */}
      {view === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 border-t-2 border-l-2 border-zinc-100 rounded-full animate-spin mb-8"></div>
          <p className="tracking-[0.3em] uppercase text-xs font-light text-zinc-400">Consulting The Creative Director...</p>
        </div>
      )}

      {/* VIEW 2: RUNWAY DASHBOARD */}
      {view === "dashboard" && (
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-full">

            {/* Left Column: The Blueprint */}
            <div className="flex flex-col gap-8 border-r border-zinc-800 pr-12">
              <div>
                <h2 className="text-sm tracking-[0.3em] font-light uppercase text-zinc-500 mb-2">Season 1</h2>
                <h3 className="text-3xl font-thin leading-tight text-zinc-100 uppercase">The {goal} Collection</h3>
              </div>

              <div className="py-8 border-y border-zinc-800">
                <p className="text-7xl font-thin tracking-tighter text-zinc-100">{daysCountdown}</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-4">Days Until The Show</p>
              </div>

              <div className="flex-1 flex flex-col pt-4">
                <label className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">The Grind (Daily Notes)</label>
                <textarea
                  className="flex-1 w-full bg-zinc-900/50 border border-zinc-800 p-4 text-sm font-light text-zinc-300 focus:outline-none focus:border-zinc-500 resize-none min-h-[200px]"
                  placeholder="Log your daily progress here..."
                  value={grindNotes}
                  onChange={(e) => setGrindNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Center Column: The Silhouette */}
            <div className="flex flex-col items-center border-r border-zinc-800 pr-12">
              <div className="w-full flex justify-between items-center mb-12">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Campaign Progress</span>
                <span className="text-lg font-thin">{Math.round(percentage)}%</span>
              </div>

              <div className="w-full mb-12">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Number(e.target.value))}
                  className="w-full h-[1px] bg-zinc-800 appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              {/* SVG Silhouette */}
              <div className="w-[300px] h-[600px] flex items-center justify-center relative">
                <svg viewBox="0 0 200 600" className="w-full h-full mix-blend-screen opacity-80">
                  {/* Head @ 100% */}
                  <circle cx="100" cy="55" r="15"
                    fill={percentage >= 100 ? "white" : "transparent"}
                    stroke="white" strokeWidth="1"
                    className="transition-all duration-1000"
                  />

                  {/* Shirt @ 75% */}
                  <path
                    className="transition-all duration-1000"
                    fill={percentage >= 75 ? "white" : "transparent"}
                    stroke="white" strokeWidth="1"
                    d="M 60 110 L 140 110 L 145 150 L 130 150 L 125 280 Q 100 290 75 280 L 70 150 L 55 150 Z"
                  />

                  {/* Pants @ 50% */}
                  <path
                    className="transition-all duration-1000"
                    fill={percentage >= 50 ? "white" : "transparent"}
                    stroke="white" strokeWidth="1"
                    d="M 75 290 Q 100 300 125 290 L 135 500 L 115 500 L 100 350 L 85 500 L 65 500 Z"
                  />

                  {/* Shoes @ 25% */}
                  <path
                    className="transition-all duration-1000"
                    fill={percentage >= 25 ? "white" : "transparent"}
                    stroke="white" strokeWidth="1"
                    d="M 60 510 L 90 510 L 95 540 L 55 540 Z M 110 510 L 140 510 L 145 540 L 105 540 Z"
                  />

                  {/* Base Grid Connectors for aesthetic vibe */}
                  <line x1="100" y1="0" x2="100" y2="600" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="5,5" />
                  <line x1="0" y1="300" x2="200" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="5,5" />
                </svg>
              </div>
            </div>

            {/* Right Column: The Collection */}
            <div className="flex flex-col gap-6">
              <h3 className="text-[10px] tracking-[0.4em] font-light uppercase text-zinc-500 mb-2">The Collection</h3>

              <div className="space-y-8 overflow-y-auto max-h-[800px] pr-4 custom-scrollbar">
                {roadmap.map((stage, idx) => {
                  const imgBase64 = images[idx];
                  const isActive = percentage >= stage.target_percentage;

                  return (
                    <div
                      key={idx}
                      className={`bg-white p-4 pb-6 flex flex-col gap-4 shadow-xl transition-all duration-700
                        ${isActive ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}
                    >
                      {/* The Generated Image (Polaroid style) */}
                      <div className="w-full aspect-[3/4] bg-zinc-100 relative overflow-hidden">
                        {imgBase64 ? (
                          <img
                            src={imgBase64}
                            alt={stage.clothing_item}
                            className="w-full h-full object-cover mix-blend-multiply"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 p-2 text-center uppercase tracking-widest">
                            Polaroid Processing...
                          </div>
                        )}
                      </div>

                      {/* Polaroid Text Area */}
                      <div className="text-zinc-900 pt-2 border-t border-zinc-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">Look {idx + 1}</span>
                          <span className="text-xs font-mono text-zinc-400">{stage.target_percentage}%</span>
                        </div>
                        <h4 className="text-lg font-medium leading-tight mb-2 tracking-wide uppercase">{stage.clothing_item}</h4>
                        <p className="text-[11px] leading-relaxed text-zinc-600 font-serif italic">
                          "{stage.milestone_task}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      )}

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

        {/* Overlay Close Button */}
        <button
          onClick={() => {
            setShowFinale(false);
            if (videoRef.current) { videoRef.current.pause(); }
          }}
          className="absolute top-8 right-8 text-white uppercase text-xs tracking-widest z-50 hover:underline"
        >
          Exit Runway
        </button>
      </div>

    </div>
  );
}
