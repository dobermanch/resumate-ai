import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Briefcase, RefreshCcw, Upload, Globe } from 'lucide-react';
import type { JobSession } from '@/types';

interface SidebarProps {
  resumeText: string;
  setResumeText: (t: string) => void;
  jobText: string;
  setJobText: (t: string) => void;
  companyDetails: string;
  setCompanyDetails: (t: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
  allJobs: JobSession[];
  activeJobId: string | null;
  onNewJob: () => void;
  onSwitchJob: (id: string) => void;
  hasInitialAnalysisStarted: boolean;
  isGenerating: boolean;
}

const getJobLabel = (job: JobSession, index: number) =>
  job.jobText?.trim().slice(0, 35) || `Job #${index + 1}`;

export const Sidebar = ({ resumeText, setResumeText, jobText, setJobText, companyDetails, setCompanyDetails, onFetchUrl, allJobs, activeJobId, onNewJob, onSwitchJob, hasInitialAnalysisStarted, isGenerating }: SidebarProps) => {
  const [activeInput, setActiveInput] = useState<'resume' | 'job'>('resume');
  const [jobUrl, setJobUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      setSidebarWidth(Math.min(600, Math.max(200, dragStartWidth.current + delta)));
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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

              type LineGroup = { y: number; items: Chunk[] };
              const lines: LineGroup[] = [];
              for (const chunk of chunks) {
                const line = lines.find((l) => Math.abs(l.y - chunk.y) < 3);
                if (line) line.items.push(chunk);
                else lines.push({ y: chunk.y, items: [chunk] });
              }
              lines.sort((a, b) => b.y - a.y);

              const gaps = lines
                .slice(1)
                .map((l, li) => lines[li].y - l.y)
                .filter((g) => g > 0)
                .sort((a, b) => a - b);
              const medianGap = gaps[Math.floor(gaps.length / 2)] ?? 12;

              const resultLines: string[] = [];
              for (let li = 0; li < lines.length; li++) {
                const line = lines[li];
                line.items.sort((a, b) => a.x - b.x);

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
    <aside className="border-r bg-white flex flex-col overflow-hidden shrink-0 relative" style={{ width: sidebarWidth }}>
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-300 active:bg-indigo-500 transition-colors z-10"
        title="Drag to resize"
      />
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
                  disabled={isParsingFile || isGenerating}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isParsingFile ? "Parsing file…" : "Upload file (.txt, .md, .pdf, .docx)"}
                >
                  {isParsingFile
                    ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf,.docx" />
                <button  disabled={isParsingFile || isGenerating} onClick={() => setResumeText("")} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
              </div>
            </div>

            {resumeText != "" ? (
              <label className="text-xs text-red-400 tracking-wider">IMPORTANT: Before generating anything, remove personal details from your resume (name, phone, email, links, etc.).</label>
            ) : ( 
              <div></div> 
            )}
            

            <textarea
              className="flex-1 w-full p-4 text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-serif leading-relaxed placeholder:text-slate-300 shadow-inner"
              placeholder="Paste or edit your resume here..."
              value={resumeText}
              disabled={isGenerating}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            {allJobs.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Session</label>
                <select
                  value={activeJobId ?? ''}
                  onChange={(e) => onSwitchJob(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allJobs.map((job, idx) => (
                    <option key={job.id} value={job.id}>
                      {job.id === activeJobId
                        ? (jobText.trim().slice(0, 35) || `Job #${idx + 1}`)
                        : getJobLabel(job, idx)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasInitialAnalysisStarted && (
              <button
                onClick={() => { setJobUrl(''); onNewJob(); }}
                disabled={isGenerating}
                className="w-full py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + New Job
              </button>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job URL</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  placeholder="Paste Job Link..."
                  value={jobUrl}
                  disabled={isGenerating}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
                <button
                  onClick={handleFetch}
                  disabled={isFetching || isGenerating}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isFetching ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                </button>
              </div>
            </div>



            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Details</label>
              <button disabled={isFetching || isGenerating} onClick={() => setJobText("")} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
            </div>
            <textarea
              className="flex-1 w-full p-4 text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300 shadow-inner"
              placeholder="Paste description or let AI extract from URL..."
              value={jobText}
              disabled={isGenerating}
              onChange={(e) => setJobText(e.target.value)}
            />

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Details</label>
              <button disabled={isFetching || isGenerating} onClick={() => setCompanyDetails("")} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
            </div>
            <textarea
              className="flex-1 w-full p-4 text-sm bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300 shadow-inner"
              placeholder="Company information extracted from job posting..."
              value={companyDetails}
              disabled={isGenerating}
              onChange={(e) => setCompanyDetails(e.target.value)}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
