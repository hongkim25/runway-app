"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntakeForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [vibe, setVibe] = useState("");
  const [color, setColor] = useState("");
  const [designer, setDesigner] = useState("");
  const [image64, setImage64] = useState("");

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

    setLoading(true);

    try {
      const res = await fetch("/api/generate-runway", {
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

      // Save campaign pointer data to localStorage to bypass the 5MB browser quota limit
      localStorage.setItem("runwayCampaignId", data.campaign_id);
      localStorage.setItem("runwayGoal", goal);
      localStorage.setItem("runwayDate", targetDate);

      // Navigate to Dashboard
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Failed to generate runway. Make sure backend is running.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden">
        <div
          className="fixed inset-0 z-0 opacity-20 mix-blend-luminosity"
          style={{ backgroundImage: 'url("/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
        ></div>
        <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        <div className="z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-t-2 border-l-2 border-white rounded-full animate-spin mb-8"></div>
          <p className="tracking-[0.3em] uppercase text-xs font-light text-white/50">Consulting The Creative Director...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-luminosity will-change-transform"
        style={{ backgroundImage: 'url("/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      ></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-8 animate-fade-in relative z-10 w-full min-h-screen bg-black/60">
        <div className="mb-20 text-center">
          <h2 className="text-6xl md:text-8xl font-thin tracking-tighter mb-6 text-white drop-shadow-lg">Life is a runway.</h2>
          <p className="text-white/60 tracking-[0.4em] uppercase text-[10px] font-medium">The Casting Call</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-5xl space-y-16 bg-black/80 backdrop-blur-2xl p-12 md:p-16 border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left Column */}
            <div className="space-y-12">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Life Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Launching a startup"
                  className="w-full border-b border-white/20 py-2 bg-transparent text-sm font-light focus:outline-none focus:border-white transition-colors text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full border-b border-white/20 py-2 bg-transparent text-sm font-light focus:outline-none focus:border-white transition-colors text-white"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Aesthetic Style</label>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full border-b border-white/20 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer text-white"
                >
                  <option value="" disabled className="text-black">Select Style...</option>
                  <option value="Avant-Garde" className="text-black">Avant-Garde</option>
                  <option value="Quiet Luxury" className="text-black">Quiet Luxury</option>
                  <option value="Dark Academia" className="text-black">Dark Academia</option>
                  <option value="Streetwear Goth" className="text-black">Streetwear Goth</option>
                  <option value="Y2K Cyber" className="text-black">Y2K Cyber</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-12">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Designer</label>
                <select
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
                  className="w-full border-b border-white/20 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer text-white"
                >
                  <option value="" disabled className="text-black">Select...</option>
                  <option value="Alexander McQueen" className="text-black">Alexander McQueen</option>
                  <option value="Rick Owens" className="text-black">Rick Owens</option>
                  <option value="Maison Margiela" className="text-black">Maison Margiela</option>
                  <option value="Phoebe Philo" className="text-black">Phoebe Philo</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Color Palette</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full border-b border-white/20 py-2 bg-transparent text-sm font-light appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer text-white"
                >
                  <option value="" disabled className="text-black">Select Palette...</option>
                  <option value="Onyx Black & Slate" className="text-black">Onyx Black & Slate</option>
                  <option value="Crimson & Bone" className="text-black">Crimson & Bone</option>
                  <option value="Midnight Navy & Silver" className="text-black">Midnight Navy & Silver</option>
                  <option value="Emerald & Olive" className="text-black">Emerald & Olive</option>
                  <option value="Monochrome White" className="text-black">Monochrome White</option>
                  <option value="Earthy Neutrals (Taupe/Sand)" className="text-black">Earthy Neutrals (Taupe/Sand)</option>
                  <option value="Cyberpunk Neon Accents" className="text-black">Cyberpunk Neon Accents</option>
                  <option value="Pastel Lilac & Dust" className="text-black">Pastel Lilac & Dust</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">Texture / Concept Source</label>
                <div className="border border-white/20 p-8 flex flex-col items-center justify-center relative hover:border-white transition-colors h-32 group bg-black/50">
                  {image64 ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                      <img src={image64} alt="Preview" className="max-h-full max-w-full object-contain grayscale opacity-80" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white">Replace File</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Upload Texture Config</span>
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
              className="bg-white text-black px-12 py-4 tracking-[0.3em] uppercase text-[10px] hover:bg-white/80 transition-colors"
            >
              Assemble Collection
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
