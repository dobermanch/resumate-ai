import type { Dispatch, SetStateAction } from 'react';
import type { AppSettings, InterviewItem, LinkedinResult, PromptConfig, ResumeVersion } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants';

async function loadPromptConfig(name: string): Promise<PromptConfig> {
  const system = await fetch(`/prompts/${name}_system_prompt.md`).then(r => r.text());
  const user = await fetch(`/prompts/${name}_user_prompt.md`).then(r => r.text());
  return { system, user };
}

export async function loadAllPrompts(): Promise<AppSettings['prompts']> {
  const promptNames = Object.keys(DEFAULT_SETTINGS.prompts) as Array<keyof AppSettings['prompts']>;
  const entries = await Promise.all(
    promptNames.map(async (name) => {
      const config = await loadPromptConfig(name);
      return [name, config] as const;
    })
  );
  return Object.fromEntries(entries) as AppSettings['prompts'];
}

interface UseContentGenerationParams {
  resumeText: string;
  jobText: string;
  settings: AppSettings;
  versions: ResumeVersion[];
  currentIndex: number;
  hasInitialAnalysisStarted: boolean;
  setVersions: Dispatch<SetStateAction<ResumeVersion[]>>;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setCoverLetter: Dispatch<SetStateAction<string>>;
  setLinkedinProfile: Dispatch<SetStateAction<LinkedinResult | null>>;
  setInterviewPrep: Dispatch<SetStateAction<InterviewItem[]>>;
  setJobText: Dispatch<SetStateAction<string>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setHasInitialAnalysisStarted: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<'resume' | 'letter' | 'interview' | 'analysis' | 'linkedin'>>;
}

export function useContentGeneration({
  resumeText,
  jobText,
  settings,
  versions,
  currentIndex,
  setVersions,
  setCurrentIndex,
  setCoverLetter,
  setLinkedinProfile,
  setInterviewPrep,
  setJobText,
  setIsGenerating,
  setHasInitialAnalysisStarted,
  setActiveTab,
}: UseContentGenerationParams) {
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
        }];
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

  return {
    handleInitialAnalysis,
    handleGenerateVersion,
    handleGenerateLetter,
    handleGenerateLinkedin,
    handleGeneratePrep,
    handleFetchUrlContent,
  };
}
