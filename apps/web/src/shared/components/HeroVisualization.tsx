import { FileText, ArrowRight, Wand2 } from 'lucide-react';

export function HeroVisualization() {
  return (
    <div className="relative w-full h-[420px] sm:h-[500px] rounded-xl overflow-hidden bg-slate-50/50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-sm">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.3
      }}></div>

      {/* Content Container */}
      <div
        className="absolute inset-0 flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 overflow-hidden"
      >
        <div
          className="hero-scene flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-4 sm:gap-4 md:gap-5 origin-top text-center w-full max-w-[620px] sm:max-w-[720px]"
        >
          
          {/* Left: Documents */}
          <div className="flex flex-col items-center justify-center gap-3 shrink-0 doc-float min-h-[180px] sm:min-h-[200px] w-[92px] sm:w-[104px]">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 blur-2xl bg-primary/10 scale-125" aria-hidden />
              {/* Back doc */}
              <div className="absolute -left-3 -top-3 w-24 h-28 sm:w-28 sm:h-32 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md transform -rotate-6"></div>
              {/* Front doc */}
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-3.5 transition-transform hover:scale-[1.02]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-3/4 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-5/6 bg-slate-100 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 text-center">
              Unstructured Docs
            </span>
          </div>

          {/* Middle: Transformation */}
          <div className="relative flex flex-col items-center justify-center gap-3 text-black z-10 shrink-0 min-h-[150px] w-[96px] sm:w-[108px]">
            <div className="relative">
              <div className="absolute inset-[-14px] sm:inset-[-18px] rounded-full bg-black/15 blur-xl" aria-hidden />
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-500/30 flex items-center justify-center shadow-lg shadow-slate-500/25">
                <Wand2 className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
              </div>
            </div>
            <div className="relative h-[3px] w-20 sm:w-24 overflow-visible">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-black/0 via-black/70 to-black/0 rounded-full blur-[1px]" />
              <div
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-black/10 via-black/80 to-black/10 rounded-full"
                style={{ backgroundSize: '200% 100%', animation: 'flowLine 1.8s linear infinite' }}
              />
              <ArrowRight className="absolute right-0 -mr-2 sm:-mr-1 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-6 sm:h-6 text-black" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 text-center">
              Process Wizard
            </span>
          </div>

          {/* Right: BPMN Model */}
          <div className="flex flex-col items-center justify-center gap-4 shrink-0 process-float min-h-[200px] sm:min-h-[220px]">
            <div className="relative w-[190px] sm:w-[220px] md:w-[250px] h-[130px] sm:h-[150px] md:h-[170px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 p-3 sm:p-4 flex items-center justify-center transition-transform hover:scale-[1.01] overflow-hidden">
              {/* Simple CSS BPMN Diagram */}
              <div
                className="relative h-[88%] sm:h-[90%] flex items-center justify-center gap-1 sm:gap-[6px] md:gap-2 px-2 sm:px-3"
              >
                 {/* Start Event */}
                 <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-900/20 shrink-0 shadow-sm"></div>
                 
                 {/* Line */}
                 <div className="h-0.5 bg-slate-300 shrink-0" style={{ width: 'clamp(10px, 2vw, 16px)' }}></div>
                 
                 {/* Task */}
                 <div className="w-[52px] sm:w-[60px] md:w-[66px] h-[40px] sm:h-[44px] md:h-[48px] rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 shadow-sm">
                   <div className="space-y-1">
                     <div className="w-10 sm:w-11 md:w-12 h-1 bg-blue-200 dark:bg-blue-800 rounded"></div>
                     <div className="w-7 sm:w-8 md:w-9 h-1 bg-blue-200 dark:bg-blue-800 rounded mx-auto"></div>
                   </div>
                 </div>

                 {/* Line */}
                 <div className="h-0.5 bg-slate-300 shrink-0" style={{ width: 'clamp(10px, 2vw, 16px)' }}></div>

                 {/* Gateway */}
                 <div
                   className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 transform rotate-45 border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 shrink-0 shadow-sm"
                   style={{ marginTop: 0, marginBottom: 0 }}
                 ></div>

                 {/* Line */}
                 <div className="h-0.5 bg-slate-300 shrink-0" style={{ width: 'clamp(10px, 2vw, 16px)' }}></div>

                 {/* End Event */}
                 <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 rounded-full border-[3px] border-red-500 bg-red-50 dark:bg-red-900/20 shrink-0 shadow-sm"></div>
              </div>
              
              {/* Floating Label */}
              <div className="absolute right-4 sm:right-5 top-3 sm:top-4 inline-flex items-center justify-center whitespace-nowrap bg-slate-200/90 text-slate-700 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1 rounded-full shadow-sm dark:bg-slate-700 dark:text-slate-100">
                BPMN 2.0
              </div>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 text-center">
              Structured Model
            </span>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes docFloat {
          0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
          25% { transform: translateX(6px) translateY(-4px) rotate(-3deg); opacity: 1; }
          50% { transform: translateX(12px) translateY(2px) rotate(-1deg); opacity: 0.95; }
          75% { transform: translateX(6px) translateY(-2px) rotate(-2deg); opacity: 1; }
          100% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
        }

        @keyframes processFloat {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-4px) translateY(3px); }
          50% { transform: translateX(4px) translateY(-2px); }
          75% { transform: translateX(-2px) translateY(2px); }
          100% { transform: translateX(0) translateY(0); }
        }

        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pingSlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        .doc-float {
          animation: docFloat 4s ease-in-out infinite;
        }

        .process-float {
          animation: processFloat 4s ease-in-out infinite;
        }

        .flow-line {
          box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.5);
        }

        .animate-flow {
          animation: flow 2.4s linear infinite;
        }

        @keyframes flowLine {
          0% { background-position: 0 0; }
          100% { background-position: -200% 0; }
        }

        .animate-ping-slow {
          animation: pingSlow 2.4s ease-in-out infinite;
        }

        .hero-scene {
          width: 100%;
          max-width: 100%;
          transform: none;
        }
      `}</style>
    </div>
  );
}

