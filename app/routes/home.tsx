import { Link } from "react-router";
import { Video, MessageSquare, Sparkles, Zap, Upload, ArrowRight, Music, Tv, Radio } from "lucide-react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
 return [
  { title: "VidTalk" },
  { name: "description", content: "VidTalk" }
 ];
};

export default function Home() {
 return (
  <div className="min-h-screen bg-[#FFF3E0] overflow-hidden relative">
   {/* Retro Pattern Background */}
   <div className="absolute inset-0 opacity-10">
    <div className="absolute inset-0" style={{
     backgroundImage: `repeating-linear-gradient(45deg, #FF6B35 0, #FF6B35 10px, transparent 10px, transparent 20px),
                       repeating-linear-gradient(-45deg, #8338EC 0, #8338EC 10px, transparent 10px, transparent 20px)`
    }} />
   </div>

   <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Hero Section */}
    <div className="text-center mb-16">
     <div className="flex justify-center mb-8">
      <div className="relative bounce-in">
       <div className="w-32 h-32 retro-gradient rounded-3xl flex items-center justify-center retro-shadow-lg retro-border transform rotate-3 float">
        <Tv className="w-20 h-20 text-white" />
       </div>
       <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FFBE0B] rounded-full flex items-center justify-center retro-border wiggle-hover">
        <Sparkles className="w-6 h-6 text-[#1A0033]" />
       </div>
      </div>
     </div>
     
     <h1 className="font-bungee-shade text-6xl md:text-8xl mb-4 text-[#1A0033] transform -rotate-2">
      VIDTALK
     </h1>
     
     <p className="font-bebas text-3xl text-[#FF006E] mb-2 tracking-wider">
      GET GROOVY WITH YOUR VIDEOS!
     </p>
     
     <p className="font-space-mono text-lg text-[#1A0033] max-w-2xl mx-auto mb-10 leading-relaxed">
      Upload, transcribe, and chat with your rad video collection using far-out AI technology!
     </p>
     
     <Link
      to="/videos"
      className="inline-flex items-center gap-3 px-10 py-5 bg-[#FF006E] text-white rounded-2xl retro-border retro-shadow-lg transform hover:scale-105 transition-all duration-200 wiggle-hover font-bungee text-xl"
     >
      Let's Boogie!
      <ArrowRight className="w-6 h-6" />
     </Link>
    </div>

    {/* Feature Cards */}
    <div className="grid md:grid-cols-3 gap-8 mb-16">
     <div className="relative group">
      <div className="absolute inset-0 bg-[#3A86FF] rounded-3xl retro-border transform rotate-3 group-hover:rotate-6 transition-transform duration-200" />
      <div className="relative bg-white rounded-3xl p-8 retro-border retro-shadow hover:translate-x-1 hover:translate-y-1 transition-transform duration-200">
       <div className="w-20 h-20 bg-[#FFBE0B] rounded-2xl flex items-center justify-center mb-6 retro-border transform -rotate-6">
        <Upload className="w-12 h-12 text-[#1A0033]" />
       </div>
       <h3 className="font-bungee text-2xl mb-3 text-[#1A0033]">Drop Beats</h3>
       <p className="font-space-mono text-[#1A0033]">
        Drag & drop your gnarly videos like it's 1985! We dig all the formats.
       </p>
      </div>
     </div>

     <div className="relative group">
      <div className="absolute inset-0 bg-[#FF6B35] rounded-3xl retro-border transform -rotate-3 group-hover:-rotate-6 transition-transform duration-200" />
      <div className="relative bg-white rounded-3xl p-8 retro-border retro-shadow hover:translate-x-1 hover:translate-y-1 transition-transform duration-200">
       <div className="w-20 h-20 bg-[#00F5FF] rounded-2xl flex items-center justify-center mb-6 retro-border transform rotate-6">
        <Radio className="w-12 h-12 text-[#1A0033]" />
       </div>
       <h3 className="font-bungee text-2xl mb-3 text-[#1A0033]">AI Magic</h3>
       <p className="font-space-mono text-[#1A0033]">
        Our groovy AI robots transcribe your videos with cosmic accuracy!
       </p>
      </div>
     </div>

     <div className="relative group">
      <div className="absolute inset-0 bg-[#8338EC] rounded-3xl retro-border transform rotate-3 group-hover:rotate-6 transition-transform duration-200" />
      <div className="relative bg-white rounded-3xl p-8 retro-border retro-shadow hover:translate-x-1 hover:translate-y-1 transition-transform duration-200">
       <div className="w-20 h-20 bg-[#FF006E] rounded-2xl flex items-center justify-center mb-6 retro-border transform -rotate-6">
        <MessageSquare className="w-12 h-12 text-white" />
       </div>
       <h3 className="font-bungee text-2xl mb-3 text-[#1A0033]">Chat Away</h3>
       <p className="font-space-mono text-[#1A0033]">
        Have a tubular conversation with AI about your radical video stash!
       </p>
      </div>
     </div>
    </div>

    {/* CTA Section */}
    <div className="text-center relative">
     <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
      <div className="font-bungee text-[#FFBE0B] text-6xl animate-pulse retro-text-shadow">
       ★
      </div>
     </div>
     
     <h2 className="font-bebas text-5xl mb-8 text-[#1A0033] tracking-wide">
      Ready to get down with your videos?
     </h2>
     
     <div className="flex flex-col sm:flex-row gap-6 justify-center">
      <Link
       to="/videos?upload=true"
       className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#8338EC] text-white rounded-2xl retro-border retro-shadow-lg hover:translate-x-1 hover:translate-y-1 transition-transform duration-200 font-bungee wiggle-hover"
      >
       <Upload className="w-6 h-6" />
       Upload First Video
      </Link>
      
      <Link
       to="/videos"
       className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#1A0033] rounded-2xl retro-border retro-shadow hover:translate-x-1 hover:translate-y-1 transition-transform duration-200 font-bungee"
      >
       <Music className="w-6 h-6" />
       Browse Library
      </Link>
     </div>

     {/* Decorative Elements */}
     <div className="mt-16 flex justify-center gap-8">
      <div className="w-16 h-16 bg-[#FF6B35] rounded-full retro-border animate-bounce" />
      <div className="w-16 h-16 bg-[#00F5FF] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.2s' }} />
      <div className="w-16 h-16 bg-[#FFBE0B] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.4s' }} />
     </div>
    </div>
   </div>
  </div>
 );
}