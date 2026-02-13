import React, { useState, useEffect } from 'react';
import { Subject, GradeLevel, HomeReviewRequest, GeneratedLessonPlan } from '../types';
import { generateHomeReviewAI } from '../services/geminiService';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ClipboardDocumentIcon, CheckIcon, DevicePhoneMobileIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface HomeReviewGeneratorProps {
  linkedPlan: GeneratedLessonPlan | null;
}

export const HomeReviewGenerator: React.FC<HomeReviewGeneratorProps> = ({ linkedPlan }) => {
  const [loading, setLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastPlanId, setLastPlanId] = useState<string | null>(null);

  const [formData, setFormData] = useState<HomeReviewRequest>({
    subject: Subject.MATHEMATICS,
    grade: GradeLevel.FIFTH,
    topic: ''
  });

  // Auto-fill from linked plan
  useEffect(() => {
    if (linkedPlan && linkedPlan.id !== lastPlanId) {
      setFormData({
        // Try to match string to Enum, fallback to direct string if needed (though types say Enum)
        subject: linkedPlan.generalData.subject as Subject,
        grade: linkedPlan.generalData.grade as GradeLevel,
        topic: linkedPlan.generalData.contentConceptual || linkedPlan.generalData.unit
      });
      setLastPlanId(linkedPlan.id);
      // Optional: Auto-generate immediately if desired. 
      // Uncomment the line below to auto-generate:
      // generateReview({ ...formData, topic: linkedPlan.generalData.contentConceptual });
    }
  }, [linkedPlan, lastPlanId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateReview = async (data: HomeReviewRequest) => {
    setLoading(true);
    setGeneratedMessage(null);
    try {
      const result = await generateHomeReviewAI(data);
      setGeneratedMessage(result.message);
    } catch (error) {
      alert("Error generating review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReview(formData);
  };

  const copyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-full">
      {/* Input Section */}
      <div className="xl:w-1/3 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-green-600" />
            Repaso para WhatsApp
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Genera un mensaje atractivo y breve para enviar a los padres o estudiantes, con un resumen de la clase y un desafío práctico.
          </p>
          
          {linkedPlan && (
            <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2 animate-fade-in">
                <ArrowPathIcon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                    Datos cargados automáticamente del plan: <strong>{linkedPlan.generalData.contentConceptual}</strong>
                </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
              <select 
                name="grade" 
                value={formData.grade} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              >
                {Object.values(GradeLevel).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignatura</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              >
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tema Visto</label>
              <input 
                type="text" 
                name="topic" 
                value={formData.topic} 
                onChange={handleChange}
                placeholder="Ej. Suma de fracciones, El ciclo del agua..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-all transform active:scale-95 flex justify-center items-center ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30'
              }`}
            >
              {loading ? (
                <>
                  <PaperAirplaneIcon className="w-5 h-5 mr-2 animate-bounce" />
                  Redactando...
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Generar Mensaje
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Result Section (Phone Preview) */}
      <div className="xl:w-2/3 w-full flex items-center justify-center p-4">
        {generatedMessage ? (
          <div className="relative w-full max-w-sm mx-auto bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Phone Notch/Header */}
            <div className="absolute top-0 w-full h-8 bg-slate-800 z-20 flex justify-center">
                <div className="w-24 h-4 bg-slate-900 rounded-b-xl"></div>
            </div>
            
            {/* WhatsApp Header Mock */}
            <div className="bg-[#075E54] p-4 pt-10 text-white flex items-center shadow-md z-10 relative">
               <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 overflow-hidden">
                 <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-xs font-bold">P</div>
               </div>
               <div>
                 <p className="font-semibold text-sm">Padres {formData.grade}</p>
                 <p className="text-[10px] opacity-80">en línea</p>
               </div>
            </div>

            {/* Chat Area */}
            <div className="bg-[#E5DDD5] h-[500px] overflow-y-auto p-4 flex flex-col relative bg-opacity-90">
                <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
                
                <div className="self-end bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[90%] mb-4 text-sm text-slate-800 relative z-10 whitespace-pre-line">
                   {generatedMessage}
                   <div className="flex justify-end mt-1 space-x-1">
                      <span className="text-[10px] text-gray-500">10:42 AM</span>
                      <span className="text-blue-400 text-[10px]">✓✓</span>
                   </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-white p-4 border-t border-gray-200">
               <button 
                 onClick={copyToClipboard}
                 className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold transition-colors"
               >
                 {copied ? (
                   <>
                     <CheckIcon className="w-5 h-5" />
                     <span>¡Copiado!</span>
                   </>
                 ) : (
                   <>
                     <ClipboardDocumentIcon className="w-5 h-5" />
                     <span>Copiar Texto</span>
                   </>
                 )}
               </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 opacity-50">
             <DevicePhoneMobileIcon className="w-32 h-32 mb-4" />
             <p>El mensaje aparecerá aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};