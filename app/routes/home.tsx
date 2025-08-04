import { Link } from "react-router";
import { Video, MessageSquare, Sparkles, Zap, Upload, ArrowRight } from "lucide-react";

export default function Home() {
 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <div className="text-center mb-16">
     <div className="flex justify-center mb-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl">
       <Zap className="w-12 h-12 text-white" />
      </div>
     </div>
     
     <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
      Welcome to VidTalk
     </h1>
     
     <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
      Transform your videos into intelligent conversations. Upload, transcribe, and chat with your video content using the power of AI.
     </p>
     
     <Link
      to="/videos"
      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-xl text-lg font-semibold"
     >
      Get Started
      <ArrowRight className="w-5 h-5" />
     </Link>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mb-16">
     <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
       <Upload className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">Upload Videos</h3>
      <p className="text-gray-600">
       Easily upload your videos with our drag-and-drop interface. Support for all major video formats.
      </p>
     </div>

     <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center mb-4">
       <Video className="w-8 h-8 text-teal-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">AI Transcription</h3>
      <p className="text-gray-600">
       Get accurate, time-synced transcriptions powered by advanced AI technology.
      </p>
     </div>

     <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4">
       <Sparkles className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">Smart Chat</h3>
      <p className="text-gray-600">
       Chat with AI about your videos individually or across your entire collection.
      </p>
     </div>
    </div>

    <div className="text-center">
     <h2 className="text-3xl font-bold mb-8 text-gray-900">Ready to transform your videos?</h2>
     <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
       to="/videos?upload=true"
       className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
       <Upload className="w-5 h-5" />
       Upload Your First Video
      </Link>
      <Link
       to="/videos"
       className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
      >
       <Video className="w-5 h-5" />
       Browse Library
      </Link>
     </div>
    </div>
   </div>
  </div>
 );
}