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
  resumeAnalysis: ResumeAnalysisResult | null;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  structureAnalysis: string;
  impactAnalysis: string;
  languageAnalysis: string;
  atsScan: string;
  skillsIdentified: {
    hardSkills: string[];
    softSkills: string[];
    tools: string[];
    domainKeywords: string[];
  };
  bestFitJobTypes: string[];
  keyImprovements: string[];
}

export interface JobSession {
  id: string;
  url: string;
  jobText: string;
  companyDetails: string;
  versions: ResumeVersion[];
  currentIndex: number;
  coverLetters: string[];
  coverLetterIndex: number;
  linkedinProfiles: (LinkedinResult | null)[];
  linkedinProfileIndex: number;
  interviewPreps: InterviewItem[][];
  interviewPrepIndex: number;
  whyHereAnswers: WhyHereItem[][];
  whyHereIndex: number;
  hasInitialAnalysisStarted: boolean;
}

export interface InterviewItem {
  question: string;
  answer: string;
}

export interface WhyHereItem {
  angle: string;
  explanation: string;
  framework: string;
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
    whyHere: PromptConfig;
    resumeAnalysis: PromptConfig;
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
