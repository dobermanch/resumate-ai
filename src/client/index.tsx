import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { createRoot } from 'react-dom/client';
import {
  Settings,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCcw,
  Wand2,
  Cpu,
} from 'lucide-react';

import type { AppSettings, ResumeVersion, LinkedinResult, InterviewItem, TunnelInfo } from '@/types';
import { DEFAULT_SETTINGS, MAIN_TABS } from '@/constants';
import { loadAllPrompts, useContentGeneration } from '@/hooks/useContentGeneration';
import {
  Header,
  Sidebar,
  VersionTimeline,
  SettingsModal,
  TunnelModal,
  EmptyStateCard,
  AnalysisCard,
  ActionButtons,
  SectionHeader,
} from '@/components';

const App = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [coverLetter, setCoverLetter] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedinResult | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'letter' | 'interview' | 'analysis' | 'linkedin'>('resume');
  const [showSettings, setShowSettings] = useState(false);
  const [showTunnel, setShowTunnel] = useState(false);
  const [isLocalAccess, setIsLocalAccess] = useState(false);
  const [tunnelDuration, setTunnelDuration] = useState(0);
  const [tunnelInfo, setTunnelInfo] = useState<TunnelInfo>({
    isLoading: false, isRunning: false, url: null, qrCode: null, error: null, expiresAt: null,
  });
  const [hasInitialAnalysisStarted, setHasInitialAnalysisStarted] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
      loadingEl.classList.add('fade-out');
      setTimeout(() => loadingEl.remove(), 350);
    }

    async function init() {
      const prompts = await loadAllPrompts();
      setSettings(prev => ({ ...prev, prompts }));
    }
    init();

    fetch('/api/tunnel/status')
      .then(r => r.json())
      .then(data => {
        const isPublic = data.url
          ? window.location.hostname === new URL(data.url).hostname
          : false;
        setIsLocalAccess(!isPublic);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (resumeText && versions.length === 0) {
      setVersions([{
        id: 'v0',
        timestamp: Date.now(),
        tailoredResume: resumeText,
        analysis: { score: 0, gaps: [], improvements: [], strengths: [] }
      }]);
      setCurrentIndex(0);
    } else if (resumeText && versions.length > 0 && currentIndex === 0) {
      const updated = [...versions];
      updated[0].tailoredResume = resumeText;
      setVersions(updated);
    }
  }, [resumeText]);

  const {
    handleInitialAnalysis,
    handleGenerateVersion,
    handleGenerateLetter,
    handleGenerateLinkedin,
    handleGeneratePrep,
    handleFetchUrlContent,
  } = useContentGeneration({
    resumeText,
    jobText,
    settings,
    versions,
    currentIndex,
    hasInitialAnalysisStarted,
    setVersions,
    setCurrentIndex,
    setCoverLetter,
    setLinkedinProfile,
    setInterviewPrep,
    setJobText,
    setIsGenerating,
    setHasInitialAnalysisStarted,
    setActiveTab,
  });

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const handleOpenTunnel = async () => {
    setShowTunnel(true);
    try {
      const res = await fetch('/api/tunnel/status');
      const data = await res.json();
      const qrCode = data.url ? await QRCode.toDataURL(data.url) : null;
      setTunnelInfo({ isLoading: false, isRunning: data.running, url: data.url ?? null, qrCode, error: null, expiresAt: data.expiresAt ?? null });
    } catch {
      setTunnelInfo(prev => ({ ...prev, isLoading: false, error: 'Failed to check tunnel status' }));
    }
  };

  const handleStartTunnel = async () => {
    setTunnelInfo(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/tunnel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: tunnelDuration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTunnelInfo(prev => ({ ...prev, isLoading: false, error: data.error ?? 'Failed to start tunnel' }));
      } else {
        const qrCode = await QRCode.toDataURL(data.url);
        setTunnelInfo({ isLoading: false, isRunning: true, url: data.url, qrCode, error: null, expiresAt: data.expiresAt ?? null });
      }
    } catch {
      setTunnelInfo(prev => ({ ...prev, isLoading: false, error: 'Network error starting tunnel' }));
    }
  };

  const handleStopTunnel = async () => {
    setTunnelInfo(prev => ({ ...prev, isLoading: true }));
    await fetch('/api/tunnel/stop', { method: 'POST' });
    setTunnelInfo({ isLoading: false, isRunning: false, url: null, qrCode: null, error: null, expiresAt: null });
  };

  const currentVersion = versions[currentIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Header onOpenSettings={() => setShowSettings(true)} onOpenTunnel={handleOpenTunnel} isLocalhost={isLocalAccess} />

      <main className="flex flex-1 overflow-hidden relative text-slate-900">
        <VersionTimeline versions={versions} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        <Sidebar resumeText={resumeText} setResumeText={setResumeText} jobText={jobText} setJobText={setJobText} onFetchUrl={handleFetchUrlContent} />

        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-2 bg-white border-b shrink-0 scrollbar-hide">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-8 relative">
            {!currentVersion ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200">
                  <Sparkles className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Start Your Optimization</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Enter your current resume and a target job description in the sidebar.
                    ResuMate AI will analyze the compatibility, suggest tailored improvements,
                    and help you generate professional cover letters and interview preparation materials.
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Click the Settings <Settings className="w-4 h-4 p-0 inline" /> icon in the top-right corner to fine-tune AI prompts for better results.
                  </p>
                  <p className="text-red-400 text-sm leading-relaxed font-bold">
                    WARNING: All results including settings will be lost if you reload the window.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6 pb-12">

                {/* Resume tab */}
                {activeTab === 'resume' && (
                  <div className="space-y-4">
                    <SectionHeader
                      title={currentIndex === 0 ? "Original Resume (V0)" : `Tailored Iteration ${currentIndex}`}
                      actions={
                        <button
                          onClick={() => copyToClipboard(currentVersion.tailoredResume)}
                          className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </button>
                      }
                    />
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 font-serif whitespace-pre-wrap leading-relaxed text-slate-800 text-[15px] min-h-[600px]">
                      {currentVersion.tailoredResume}
                    </div>
                  </div>
                )}

                {/* Analysis tab */}
                {activeTab === 'analysis' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
                      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-indigo-600 transition-all duration-1000" strokeWidth="3" strokeDasharray={`${currentVersion.analysis.score}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-slate-900">{currentVersion.analysis.score}%</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Match</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Compatibility Score</h4>
                      <p className="text-xs text-slate-500 leading-relaxed italic">Analysis for V{currentIndex}</p>
                    </div>
                    <div className="md:col-span-2 space-y-6 text-slate-900">
                      <AnalysisCard
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        title="Strong Areas"
                        items={currentVersion.analysis.strengths}
                        variant="success"
                        emptyMessage="No major strengths identified."
                      />
                      <AnalysisCard
                        icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                        title="Missing Qualifications"
                        items={currentVersion.analysis.gaps}
                        variant="warning"
                        emptyMessage="No major gaps identified."
                      />
                      <AnalysisCard
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        title="Optimization Roadmap"
                        items={currentVersion.analysis.improvements}
                        variant="steps"
                        emptyMessage="Resume is optimally tailored for this iteration."
                      />
                    </div>
                  </div>
                )}

                {/* Cover Letter tab */}
                {activeTab === 'letter' && (
                  <div className="space-y-4">
                    <SectionHeader
                      title="Cover Letter"
                      actions={coverLetter ? (
                        <ActionButtons
                          onRegenerate={handleGenerateLetter}
                          onCopy={() => copyToClipboard(coverLetter)}
                          isGenerating={isGenerating}
                        />
                      ) : undefined}
                    />
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[500px] font-serif relative">
                      {!coverLetter ? (
                        <EmptyStateCard
                          icon={<Wand2 className="w-12 h-12" />}
                          description="Need a persuasive cover letter for this role?"
                          actionLabel="Draft Cover Letter"
                          actionIcon={<Wand2 className="w-4 h-4" />}
                          onAction={handleGenerateLetter}
                          isLoading={isGenerating}
                        />
                      ) : (
                        <div className="max-w-2xl mx-auto whitespace-pre-wrap text-lg leading-loose text-slate-800">
                          {coverLetter}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interview Prep tab */}
                {activeTab === 'interview' && (
                  <div className="space-y-6">
                    <SectionHeader
                      title="Interview Preparation"
                      actions={interviewPrep.length > 0 ? (
                        <ActionButtons
                          onRegenerate={handleGeneratePrep}
                          onCopy={() => copyToClipboard(interviewPrep.map(i => `Q: ${i.question}\nA: ${i.answer}`).join('\n\n'))}
                          isGenerating={isGenerating}
                          copyLabel="Copy All"
                        />
                      ) : undefined}
                    />
                    {interviewPrep.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-20">
                        <EmptyStateCard
                          icon={<RefreshCcw className="w-12 h-12" />}
                          description="Generate practice questions based on the JD requirements."
                          actionLabel="Generate Prep Cards"
                          actionIcon={<RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
                          onAction={handleGeneratePrep}
                          isLoading={isGenerating}
                        />
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {interviewPrep.map((item, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-indigo-200 transition-colors group relative">
                            <button
                              onClick={() => copyToClipboard(`Q: ${item.question}\nA: ${item.answer}`)}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded text-slate-400"
                              title="Copy this question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex gap-4">
                              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                              <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 leading-tight pr-8">{item.question}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                  {item.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LinkedIn tab */}
                {activeTab === 'linkedin' && (
                  <div className="space-y-4">
                    <SectionHeader
                      title="LinkedIn Profile"
                      actions={linkedinProfile ? (
                        <ActionButtons
                          onRegenerate={handleGenerateLinkedin}
                          onCopy={() => linkedinProfile && copyToClipboard(`Headline\n${linkedinProfile.headline}\n\nSummary\n${linkedinProfile.summary}\n\nOpen To Work\n${linkedinProfile.openToWork}`)}
                          isGenerating={isGenerating}
                        />
                      ) : undefined}
                    />
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[500px] font-serif relative">
                      {!linkedinProfile ? (
                        <EmptyStateCard
                          icon={<Wand2 className="w-12 h-12" />}
                          description="Need a persuasive LinkedIn profile?"
                          actionLabel="Draft Profile Content"
                          actionIcon={<Wand2 className="w-4 h-4" />}
                          onAction={handleGenerateLinkedin}
                          isLoading={isGenerating}
                        />
                      ) : (
                        <div className="max-w-2xl mx-auto space-y-8 text-slate-800">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Headline</p>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap text-base leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                              {linkedinProfile.headline}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">About / Summary</p>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap text-base leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                              {linkedinProfile.summary}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Open to Work Post</p>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap text-base leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                              {linkedinProfile.openToWork}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="h-20 border-t bg-white flex items-center justify-between px-8 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isGenerating ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {isGenerating ? 'AI Engine Processing...' : 'Optimization Engine Ready'}
              </span>
              {versions.length > 0 && (
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Draft V{currentIndex} of {versions.length} versions</span>
              )}
            </div>
            {versions.length <= 1 && !hasInitialAnalysisStarted ? (
              <button
                onClick={handleInitialAnalysis}
                disabled={isGenerating || !resumeText || !jobText}
                className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
              >
                <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Initial Analysis
              </button>
            ) : (
              <button
                onClick={handleGenerateVersion}
                disabled={isGenerating || !resumeText || !jobText}
                className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
              >
                <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate Version {versions.length}
              </button>
            )}
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
      />

      <TunnelModal
        isOpen={showTunnel}
        onClose={() => setShowTunnel(false)}
        tunnelInfo={tunnelInfo}
        tunnelDuration={tunnelDuration}
        setTunnelDuration={setTunnelDuration}
        onStart={handleStartTunnel}
        onStop={handleStopTunnel}
      />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
