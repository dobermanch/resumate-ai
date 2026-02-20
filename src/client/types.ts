export interface ResumeVersion {
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

export interface InterviewItem {
  question: string;
  answer: string;
}

export interface LinkedinResult {
  headline: string;
  summary: string;
  openToWork: string;
}

export interface PromptConfig {
  system: string;
  user: string;
}

export interface AppSettings {
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

export interface TunnelInfo {
  isLoading: boolean;
  isRunning: boolean;
  url: string | null;
  qrCode: string | null;
  error: string | null;
  expiresAt: number | null;
}
