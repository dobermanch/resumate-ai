import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { createRoot } from 'react-dom/client';
import {
  FileText,
  Briefcase,
  Settings,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  History,
  LayoutDashboard,
  User,
  MessageSquare,
  FileEdit,
  Sparkles,
  X,
  RefreshCcw,
  Wand2,
  Globe,
  Cpu,
  Upload
} from 'lucide-react';

// --- Types ---

interface ResumeVersion {
  id: string;
  timestamp: number;
  tailoredResume: string;
  analysis: {
    strengths: string[];
    score: number;
    gaps: string[];
    improvements: string[];
  };
}

interface InterviewItem {
  question: string;
  answer: string;
}

interface LinkedinResult {
  headline: string;
  summary: string;
  openToWork: string;
}

interface PromptConfig {
  system: string;
  user: string;
}

interface AppSettings {
  model: string;
  provider: 'google' | 'openai' | 'anthropic';
  prompts: {
    tailoredResume: PromptConfig;
    coverLetter: PromptConfig;
    interviewPrep: PromptConfig;
    matchAnalysis: PromptConfig;
    jobParsing: PromptConfig;
    linkedin: PromptConfig;
  };
}

// --- Default Prompts ---

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gpt-4o-mini',
  provider: 'openai',
  prompts: {
    tailoredResume: {
      system: "You are an expert resume writer.",
      user: "Based on the job description and my current resume, generate a NEW TAILORED VERSION of the resume that highlights my most relevant achievements for this specific role.\n\nJOB:\n{{jobText}}\n\nRESUME:\n{{resumeText}}\n\nPREVIOUS FEEDBACK:\n{{improvements}}"
    },
    coverLetter: {
      system: "You are a professional career coach writing a persuasive cover letter.",
      user: "Write a compelling cover letter for this job role based on my background.\n\nRESUME:\n{{resumeText}}\n\nJOB:\n{{jobText}}"
    },
    interviewPrep: {
      system: "You are a senior hiring manager preparing a candidate for an interview.",
      user: "Generate 5 behavioral interview questions and STAR answers tailored to this resume and job.\n\nRESUME:\n{{resumeText}}\n\nJOB:\n{{jobText}}"
    },
    matchAnalysis: {
      system: "You are a recruitment specialist providing honest feedback on candidate suitability.",
      user: "Perform a MATCH ANALYSIS. Provide a score (0-100), key skill gaps, and improvement tips.\n\nRESUME:\n{{resumeText}}\n\nJOB:\n{{jobText}}"
    },
    jobParsing: {
      system: "You are a data extraction tool.",
      user: "Extract the core requirements and responsibilities from this job posting text or URL.\n\nINPUT:\n{{input}}"
    },
    linkedin: {
      system: "You are a data extraction tool.",
      user: "Extract the core requirements and responsibilities from this job posting text or URL.\n\nINPUT:\n{{input}}"
    }
  }
};

// --- Components ---

const CountdownTimer = ({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) => {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [...(h > 0 ? [`${h}h`] : []), ...(m > 0 || h > 0 ? [`${m}m`] : []), [`${s}s`]];
  return <span className="font-mono font-bold text-slate-700">{parts.join(' ')}</span>;
};

const Header = ({ onOpenSettings, onOpenTunnel, isLocalhost }: { onOpenSettings: () => void; onOpenTunnel: () => void; isLocalhost: boolean }) => (
  <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
        <Sparkles className="text-white w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">ResuMate <span className="text-indigo-600">AI</span></h1>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Boost your match. Beat the bots.</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {isLocalhost && (
        <button
          onClick={onOpenTunnel}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          title="Share publicly"
        >
          <Globe className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onOpenSettings}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>
      {/* <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
        <Download className="w-4 h-4" />
        <span>Export Project</span>
      </button> */}
    </div>
  </header>
);

const Sidebar = ({
  resumeText,
  setResumeText,
  jobText,
  setJobText,
  onFetchUrl
}: {
  resumeText: string;
  setResumeText: (t: string) => void;
  jobText: string;
  setJobText: (t: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
}) => {
  const [activeInput, setActiveInput] = useState<'resume' | 'job'>('resume');
  const [jobUrl, setJobUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFetch = async () => {
    if (!jobUrl) return;
    setIsFetching(true);
    await onFetchUrl(jobUrl);
    setIsFetching(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    setIsParsingFile(true);
    try {
      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).href;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageTexts = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) =>
            pdf.getPage(i + 1).then(async (page) => {
              const content = await page.getTextContent();

              // Collect positioned chunks (skip marks/artifacts with no text)
              type Chunk = { str: string; x: number; y: number; width: number };
              const chunks: Chunk[] = [];
              for (const item of content.items) {
                if (!('str' in item) || !item.str) continue;
                chunks.push({
                  str: item.str,
                  x: item.transform[4],
                  y: item.transform[5],
                  width: item.width,
                });
              }

              // Group chunks into lines by Y proximity (3 pt tolerance)
              type LineGroup = { y: number; items: Chunk[] };
              const lines: LineGroup[] = [];
              for (const chunk of chunks) {
                const line = lines.find((l) => Math.abs(l.y - chunk.y) < 3);
                if (line) line.items.push(chunk);
                else lines.push({ y: chunk.y, items: [chunk] });
              }
              lines.sort((a, b) => b.y - a.y); // top to bottom

              // Estimate typical line-height to detect paragraph gaps
              const gaps = lines
                .slice(1)
                .map((l, li) => lines[li].y - l.y)
                .filter((g) => g > 0)
                .sort((a, b) => a - b);
              const medianGap = gaps[Math.floor(gaps.length / 2)] ?? 12;

              const resultLines: string[] = [];
              for (let li = 0; li < lines.length; li++) {
                const line = lines[li];
                line.items.sort((a, b) => a.x - b.x); // left to right

                // Join chunks: use measured gap to decide whether to insert a space
                let lineText = '';
                for (let ci = 0; ci < line.items.length; ci++) {
                  const curr = line.items[ci];
                  if (ci === 0) { lineText = curr.str; continue; }
                  const prev = line.items[ci - 1];
                  const visualGap = curr.x - (prev.x + prev.width);
                  const needsSpace =
                    visualGap > 1 &&
                    !prev.str.endsWith(' ') &&
                    !curr.str.startsWith(' ');
                  lineText += needsSpace ? ' ' + curr.str : curr.str;
                }
                lineText = lineText.trim();
                if (!lineText) continue;

                // Insert blank line when vertical gap > 1.5× median (paragraph/section break)
                if (li > 0) {
                  const vertGap = lines[li - 1].y - line.y;
                  if (vertGap > medianGap * 1.5) resultLines.push('');
                }
                resultLines.push(lineText);
              }
              return resultLines.join('\n');
            })
          )
        );
        setResumeText(pageTexts.join('\n\n'));
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        //const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

        // // Walk the HTML DOM and convert to structured plain text
        // const domParser = new DOMParser();
        // const dom = domParser.parseFromString(html, 'text/html');

        // function domToText(node: Node): string {
        //   if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
        //   const el = node as Element;
        //   const tag = el.tagName?.toLowerCase();
        //   const children = () =>
        //     Array.from(el.childNodes).map(domToText).join('');
        //   switch (tag) {
        //     case 'p':   return children().trim() + '\n';
        //     case 'br':  return '\n';
        //     case 'ul':  return Array.from(el.querySelectorAll(':scope > li'))
        //                   .map((li) => '• ' + domToText(li).trim())
        //                   .join('\n') + '\n';
        //     case 'ol': {
        //       let n = 1;
        //       return Array.from(el.querySelectorAll(':scope > li'))
        //         .map((li) => `${n++}. ` + domToText(li).trim())
        //         .join('\n') + '\n';
        //     }
        //     case 'li':  return children();
        //     case 'h1': case 'h2': case 'h3':
        //     case 'h4': case 'h5': case 'h6':
        //       return children().trim() + '\n\n';
        //     case 'table':
        //       return Array.from(el.querySelectorAll('tr'))
        //         .map((tr) =>
        //           Array.from(tr.querySelectorAll('td, th'))
        //             .map((cell) => cell.textContent?.trim() ?? '')
        //             .join(' | ')
        //         )
        //         .join('\n') + '\n';
        //     default:    return children();
        //   }
        // }

        // const text = domToText(dom.body)
        //   .replace(/\n{3,}/g, '\n\n') // collapse excess blank lines
        //   .trim();
        // setResumeText(text);
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setResumeText(event.target?.result as string);
        };
        reader.readAsText(file);
      }
    } finally {
      setIsParsingFile(false);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-80 border-r bg-white flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveInput('resume')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeInput === 'resume' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <FileText className="w-4 h-4" />
            Resume
          </button>
          <button
            onClick={() => setActiveInput('job')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeInput === 'job' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <Briefcase className="w-4 h-4" />
            Job Desc
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeInput === 'resume' ? (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Resume</label>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingFile}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isParsingFile ? "Parsing file…" : "Upload file (.txt, .md, .pdf, .docx)"}
                >
                  {isParsingFile
                    ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf,.docx" />
                <button onClick={() => setResumeText("")} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
              </div>
            </div>
            <label className="text-xs text-red-400 tracking-wider">IMPORTANT: Before generating anything, remove personal details from your resume (name, phone, email, links, etc.).</label>
              
            <textarea
              className="flex-1 w-full p-4 text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-serif leading-relaxed placeholder:text-slate-300 shadow-inner"
              placeholder="Paste or edit your resume here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job URL</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  placeholder="Paste LinkedIn/Job link..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
                <button
                  onClick={handleFetch}
                  disabled={isFetching}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isFetching ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Details</label>
              <button onClick={() => setJobText("")} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
            </div>
            <textarea
              className="flex-1 w-full p-4 text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300 shadow-inner"
              placeholder="Paste description or let AI extract from URL..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
          </div>
        )}
      </div>
    </aside>
  );
};

const VersionTimeline = ({
  versions,
  currentIndex,
  onSelect
}: {
  versions: ResumeVersion[];
  currentIndex: number;
  onSelect: (i: number) => void
}) => (
  <nav className="w-16 border-r bg-slate-900 flex flex-col items-center py-6 gap-6 shrink-0 overflow-y-auto scrollbar-hide">
    <div className="text-slate-500 mb-2 shrink-0">
      <History className="w-5 h-5" />
    </div>
    <div className="flex flex-col gap-4 w-full items-center pb-6">
      {versions.map((v, i) => (
        <button
          key={v.id}
          onClick={() => onSelect(i)}
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shrink-0 ${
            i === currentIndex
              ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span className="text-xs font-bold">V{i}</span>
          {i === currentIndex && (
            <div className="absolute -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900" />
          )}
          <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
             {i === 0 ? "Initial Draft" : `Version ${i}`}
          </div>
        </button>
      ))}
    </div>
  </nav>
);

const App = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [coverLetter, setCoverLetter] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedinResult | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'letter' | 'interview' | 'analysis'>('resume');
  const [showSettings, setShowSettings] = useState(false);
  const [showTunnel, setShowTunnel] = useState(false);
  const [isLocalAccess, setIsLocalAccess] = useState(false);
  const [tunnelDuration, setTunnelDuration] = useState(0); // 0 = indefinite, otherwise minutes
  const [tunnelInfo, setTunnelInfo] = useState<{
    isLoading: boolean;
    isRunning: boolean;
    url: string | null;
    qrCode: string | null;
    error: string | null;
    expiresAt: number | null;
  }>({ isLoading: false, isRunning: false, url: null, qrCode: null, error: null, expiresAt: null });
  const [hasInitialAnalysisStarted, setHasInitialAnalysisStarted] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Fade out the initial HTML loading screen once React has rendered
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
      loadingEl.classList.add('fade-out');
      setTimeout(() => loadingEl.remove(), 350);
    }

    async function init() {
      const prompts = await loadAllPrompts();

      setSettings(prev => ({
        ...prev,
        prompts,
      }));
    }

    init();

    // Detect if this page is being accessed via the public tunnel URL.
    // Compare window.location.hostname against the tunnel URL returned by the server —
    // this works through any proxy chain (Docker, Vite, nginx) since the browser
    // always knows its own hostname regardless of what headers the proxies rewrite.
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


  // Initialize V0
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
        // Keep V0 in sync if manually redacted in sidebar
        const updated = [...versions];
        updated[0].tailoredResume = resumeText;
        setVersions(updated);
    }
  }, [resumeText]);

  // // Auto-analysis for V0
  // useEffect(() => {
  //   if (resumeText && jobText && !hasInitialAnalysisStarted && versions.length === 1) {
  //     setHasInitialAnalysisStarted(true);
  //     handleInitialAnalysis();
  //   }
  // }, [resumeText, jobText]);

  async function loadPromptConfig(name: string): Promise<PromptConfig> {
    const system = await fetch(`/prompts/${name}_system_prompt.md`).then(r => r.text());
    const user = await fetch(`/prompts/${name}_user_prompt.md`).then(r => r.text());

    return { system, user };
  }

  async function loadAllPrompts(): Promise<AppSettings['prompts']> {
    const promptNames = Object.keys(DEFAULT_SETTINGS.prompts) as Array<keyof AppSettings['prompts']>;

    const entries = await Promise.all(
      promptNames.map(async (name) => {
        const config = await loadPromptConfig(name);
        return [name, config] as const;
      })
    );

    return Object.fromEntries(entries) as AppSettings['prompts'];
  }

  const handleInitialAnalysis = async () => {
    setIsGenerating(true);
    try {
      const config = settings.prompts.matchAnalysis;
      const res = await fetch('/api/match-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobText,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setVersions(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], analysis: result.analysis };
        }
        return updated;
      });
      setHasInitialAnalysisStarted(true);
    } catch (e) {
      console.error("Initial Analysis Error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVersion = async () => {
    if (!resumeText || !jobText) return;
    setIsGenerating(true);

    try {
      const config = settings.prompts.tailoredResume;
      const currentRes = versions[currentIndex]?.tailoredResume || resumeText;
      const improvements = versions[currentIndex]?.analysis.improvements.join("\n") || "None";

      const res = await fetch('/api/tailored-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: currentRes,
          jobText,
          improvements,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      const analysisRes = await fetch('/api/match-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: result.tailoredResume,
          jobText,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });

      if (!analysisRes.ok) throw new Error(`API error: ${analysisRes.status}`);
      const analysisResult = await analysisRes.json();

      setVersions(prev => {
        return [...prev, {
          id: `v${prev.length}`,
          timestamp: Date.now(),
          tailoredResume: result.tailoredResume,
          analysis: analysisResult.analysis
        }]
      });
      setCurrentIndex(versions.length);
      setActiveTab('resume');
    } catch (error) {
      console.error("Tailoring Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!resumeText || !jobText) return;
    setIsGenerating(true);
    try {
      const config = settings.prompts.coverLetter;
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobText,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setCoverLetter(result.coverLetter || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLinkedin = async () => {
    if (!resumeText) return;
    setIsGenerating(true);
    try {
      const config = settings.prompts.linkedin;
      const res = await fetch('/api/linkedin-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setLinkedinProfile(result.linkedin || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePrep = async () => {
    if (!resumeText || !jobText) return;
    setIsGenerating(true);
    try {
      const config = settings.prompts.interviewPrep;
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobText,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      const items: InterviewItem[] = Array.isArray(result.questions)
        ? result.questions.map((q: { question?: unknown; answer?: unknown }) => ({
            question: typeof q?.question === 'string' ? q.question : String(q?.question ?? ''),
            answer: typeof q?.answer === 'string' ? q.answer : String(q?.answer ?? ''),
          }))
        : [];
      setInterviewPrep(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFetchUrlContent = async (url: string) => {
    try {
      const config = settings.prompts.jobParsing;
      const res = await fetch('/api/parse-job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          model: settings.model,
          systemPrompt: config.system,
          userPromptTemplate: config.user,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setJobText(result.jobText || "");
    } catch (e) {
      alert("AI failed to fetch URL. Please paste content manually.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    //alert("Copied to clipboard!");
  };

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
          <div className="flex items-center gap-1 p-2 bg-white border-b shrink-0 scrollbar-hide">
            {[
              { id: 'resume', label: 'Tailored Resume', icon: FileEdit },
              { id: 'analysis', label: 'Match Analysis', icon: CheckCircle2 },
              { id: 'letter', label: 'Cover Letter', icon: MessageSquare },
              { id: 'interview', label: 'Interview Prep', icon: LayoutDashboard },
              { id: 'linkedin', label: 'LinkedIn Profile', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

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
                  <p className="text-slate-500 text-sm leading-relaxed ">
                    Click the Settings <Settings className="w-4 h-4 p-0 inline" /> icon in the top-right corner to fine-tune AI prompts for better results.
                  </p>

                  <p className="text-red-700 text-sm leading-relaxed font-bold">
                    IMPORTANT: All results including settings will be lost if you reload the window.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {activeTab === 'resume' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-900">
                        {currentIndex === 0 ? "Original Resume (V0)" : `Tailored Iteration ${currentIndex}`}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(currentVersion.tailoredResume)}
                          className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </button>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 font-serif whitespace-pre-wrap leading-relaxed text-slate-800 text-[15px] min-h-[600px]">
                      {currentVersion.tailoredResume}
                    </div>
                  </div>
                )}

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
                       <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                         <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                           Strong Areas
                         </h4>
                         <div className="flex flex-wrap gap-2">
                           {currentVersion.analysis.strengths.length > 0 ? (
                             currentVersion.analysis.strengths.map((g, i) => (
                               <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-100">{g}</span>
                             ))
                           ) : (
                             <p className="text-slate-400 text-sm italic">No major strengths identified.</p>
                           )}
                         </div>
                       </div>
                       <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                         <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <AlertCircle className="w-4 h-4 text-amber-500" />
                           Missing Qualifications
                         </h4>
                         <div className="flex flex-wrap gap-2">
                           {currentVersion.analysis.gaps.length > 0 ? (
                             currentVersion.analysis.gaps.map((g, i) => (
                               <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-100">{g}</span>
                             ))
                           ) : (
                             <p className="text-slate-400 text-sm italic">No major gaps identified.</p>
                           )}
                         </div>
                       </div>
                       <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                         <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                           Optimization Roadmap
                         </h4>
                         <ul className="space-y-3">
                           {currentVersion.analysis.improvements.length > 0 ? (
                             currentVersion.analysis.improvements.map((t, i) => (
                               <li key={i} className="flex gap-3 text-sm text-slate-700 items-start">
                                 <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">{i+1}</span>
                                 {t}
                               </li>
                             ))
                           ) : (
                             <p className="text-slate-400 text-sm italic">Resume is optimally tailored for this iteration.</p>
                           )}
                         </ul>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'letter' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-900">Cover Letter</h2>
                      {coverLetter && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleGenerateLetter}
                            disabled={isGenerating}
                            
                            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Regenerate
                          </button>
                          <button
                            onClick={() => copyToClipboard(coverLetter)}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[500px] font-serif relative">
                      {!coverLetter ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                          <MessageSquare className="w-12 h-12 text-slate-200" />
                          <p className="text-slate-400 text-sm">Need a persuasive cover letter for this role?</p>
                          <button
                            onClick={handleGenerateLetter}
                            disabled={isGenerating}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-0.5"
                          >
                            <Wand2 className="w-4 h-4" />
                            Draft Cover Letter
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-2xl mx-auto whitespace-pre-wrap text-lg leading-loose text-slate-800">
                          {coverLetter}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'interview' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-900">Interview Preparation</h2>
                      {interviewPrep.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleGeneratePrep}
                            disabled={isGenerating}
                            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Regenerate
                          </button>
                          <button
                            onClick={() => copyToClipboard(interviewPrep.map(i => `Q: ${i.question}\nA: ${i.answer}`).join('\n\n'))}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy All
                          </button>
                        </div>
                      )}
                    </div>
                    {interviewPrep.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-4">
                        <LayoutDashboard className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-400 text-sm">Generate practice questions based on the JD requirements.</p>
                        <button
                          onClick={handleGeneratePrep}
                          disabled={isGenerating}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-0.5"
                        >
                          <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          Generate Prep Cards
                        </button>
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
                              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">{i+1}</span>
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

                {activeTab === 'linkedin' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-900">LinkedIn Profile</h2>
                      {linkedinProfile && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleGenerateLinkedin}
                            disabled={isGenerating}
                            
                            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Regenerate
                          </button>
                          <button
                            onClick={() => linkedinProfile && copyToClipboard(`Headline\n${linkedinProfile.headline}\n\nSummary\n${linkedinProfile.summary}\n\nOpen To Work\n${linkedinProfile.openToWork}`)}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[500px] font-serif relative">
                      {!linkedinProfile ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                          <User className="w-12 h-12 text-slate-200" />
                          <p className="text-slate-400 text-sm">Need a persuasive LinkedIn profile?</p>
                          <button
                            onClick={handleGenerateLinkedin}
                            disabled={isGenerating}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-0.5"
                          >
                            <Wand2 className="w-4 h-4" />
                            Draft Profile Content
                          </button>
                        </div>
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

          {versions.length <= 1 && !hasInitialAnalysisStarted ? (
            <div className="h-20 border-t bg-white flex items-center justify-between px-8 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isGenerating ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {isGenerating ? 'AI Engine Processing...' : 'Optimization Engine Ready'}
                </span>
                {versions.length > 0 && <span className="text-[10px] text-slate-400 mt-1 font-medium">Draft V{currentIndex} of {versions.length} versions</span>}
              </div>
              <button
                onClick={handleInitialAnalysis}
                disabled={isGenerating || !resumeText || !jobText}
                className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
              >
                <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Initial Analysis
              </button>
            </div>
           ) : (
            <div className="h-20 border-t bg-white flex items-center justify-between px-8 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isGenerating ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {isGenerating ? 'AI Engine Processing...' : 'Optimization Engine Ready'}
                </span>
                {versions.length > 0 && <span className="text-[10px] text-slate-400 mt-1 font-medium">Draft V{currentIndex} of {versions.length} versions</span>}
              </div>
              <button
                onClick={handleGenerateVersion}
                disabled={isGenerating || !resumeText || !jobText}
                className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
              >
                <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate Version {versions.length}
              </button>
            </div>
           )}
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden text-slate-900">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border flex flex-col">
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Workbench Engine Settings</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Provider & Model */}
              <section className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Engine Configuration</h4>
                <div className="grid grid-cols-2 gap-6">
                  {/* <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">AI Provider</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-slate-900"
                      value={settings.provider}
                      onChange={(e) => setSettings({...settings, provider: e.target.value as any})}
                    >
                      <option value="openai">OpenAI</option>
                    </select>
                  </div> */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Model Selection</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-slate-900"
                      value={settings.model}
                      onChange={(e) => setSettings({...settings, model: e.target.value})}
                    >
                      <option value="gpt-4o">GPT-4o (Most Capable)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Efficient)</option>
                      <option value="gpt-4.1">GPT-4.1</option>
                      <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Individual Prompt Settings */}
              {Object.entries(settings.prompts).map(([key, config]: [string, PromptConfig]) => (
                <section key={key} className="space-y-4 border-t border-slate-100 pt-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      {key.replace(/([A-Z])/g, ' $1').trim()} Prompt
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-tight">System Instruction</label>
                      <textarea
                        className="w-full h-40 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 leading-relaxed shadow-inner"
                        value={config.system}
                        onChange={(e) => {
                          const newPrompts = { ...settings.prompts };
                          newPrompts[key as keyof typeof settings.prompts].system = e.target.value;
                          setSettings({ ...settings, prompts: newPrompts });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-tight">User Prompt Template</label>
                      <textarea
                        className="w-full h-40 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 leading-relaxed shadow-inner"
                        value={config.user}
                        onChange={(e) => {
                          const newPrompts = { ...settings.prompts };
                          newPrompts[key as keyof typeof settings.prompts].user = e.target.value;
                          setSettings({ ...settings, prompts: newPrompts });
                        }}
                      />
                      <p className="text-[9px] text-slate-500 font-medium italic mt-1">Placeholders: {'{{resumeText}}, {{jobText}}, {{improvements}}, {{input}}'}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Restore Defaults</button>
              <button onClick={() => setShowSettings(false)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Apply Settings</button>
            </div>
          </div>
        </div>
      )}

      {showTunnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm text-slate-900">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border flex flex-col">
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Share Publicly</h3>
              </div>
              <button onClick={() => setShowTunnel(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X /></button>
            </div>

            <div className="p-6 space-y-4">
              {tunnelInfo.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{tunnelInfo.error}</p>
              )}

              {!tunnelInfo.isRunning && !tunnelInfo.isLoading && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Expose this app publicly via a secure tunnel using{' '}
                    <span className="font-mono text-xs bg-slate-100 px-1 rounded">localhost.run</span>.
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Auto-close after</label>
                    <select
                      value={tunnelDuration}
                      onChange={e => setTunnelDuration(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={0}>Indefinite</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                    </select>
                  </div>
                  <button
                    onClick={handleStartTunnel}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Start Tunnel
                  </button>
                </div>
              )}

              {tunnelInfo.isLoading && (
                <div className="text-center py-6 space-y-2">
                  <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm text-slate-500">Establishing tunnel…</p>
                </div>
              )}

              {tunnelInfo.isRunning && tunnelInfo.url && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 border">
                    <p className="text-xs text-slate-500 font-medium mb-1">Public URL</p>
                    <a
                      href={tunnelInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-indigo-600 font-mono break-all hover:underline"
                    >
                      {tunnelInfo.url}
                    </a>
                  </div>
                  {tunnelInfo.qrCode && (
                    <div className="flex justify-center">
                      <img src={tunnelInfo.qrCode} alt="QR Code" className="w-40 h-40 rounded-lg border" />
                    </div>
                  )}
                  {tunnelInfo.expiresAt ? (
                    <p className="text-xs text-center text-slate-500">
                      Closes in <CountdownTimer expiresAt={tunnelInfo.expiresAt} onExpire={handleStopTunnel} />
                    </p>
                  ) : (
                    <p className="text-xs text-center text-slate-400">Running indefinitely</p>
                  )}
                  <button
                    onClick={handleStopTunnel}
                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-all"
                  >
                    Stop Tunnel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
