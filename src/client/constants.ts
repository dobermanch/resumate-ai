import type { AppSettings } from './types';
import { FileEdit, CheckCircle2, MessageSquare, LayoutDashboard, User } from 'lucide-react';

export const DEFAULT_SETTINGS: AppSettings = {
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

export const MAIN_TABS = [
  { id: 'resume', label: 'Tailored Resume', icon: FileEdit },
  { id: 'analysis', label: 'Match Analysis', icon: CheckCircle2 },
  { id: 'letter', label: 'Cover Letter', icon: MessageSquare },
  { id: 'interview', label: 'Interview Prep', icon: LayoutDashboard },
  { id: 'linkedin', label: 'LinkedIn Profile', icon: User },
] as const;

export type TabId = typeof MAIN_TABS[number]['id'];
