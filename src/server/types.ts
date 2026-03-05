export interface BaseRequest {
  model?: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface MatchAnalysisRequest extends BaseRequest {
  resumeText: string;
  jobText: string;
}

export interface TailoredResumeRequest extends BaseRequest {
  resumeText: string;
  jobText: string;
  improvements?: string;
}

export interface CoverLetterRequest extends BaseRequest {
  resumeText: string;
  jobText: string;
}

export interface InterviewPrepRequest extends BaseRequest {
  resumeText: string;
  jobText: string;
}

export interface ParseJobUrlRequest extends BaseRequest {
  url: string;
}

export interface LinkedinRequest extends BaseRequest {
  resumeText: string;
}

export interface AnalysisResult {
  strengths: string[];
  score: number;
  gaps: string[];
  improvements: string[];
}

export interface MatchAnalysisResponse {
  analysis: AnalysisResult;
}

export interface TailoredResumeResponse {
  tailoredResume: string;
}

export interface CoverLetterResponse {
  coverLetter: string;
}

export interface InterviewPrepResponse {
  questions: Array<{ question: string; answer: string }>;
}

export interface ParseJobUrlResponse {
  jobText: string;
  companyDetails: string;
}

export interface LinkedinResult {
  headline: string;
  summary: string;
  openToWork: string;
}

export interface LinkedinResponse {
  linkedin: LinkedinResult;
}

export interface WhyHereRequest extends BaseRequest {
  resumeText: string;
  jobText: string;
  companyText: string;
}

export interface WhyHereItem {
  angle: string;
  explanation: string;
  framework: string;
}

export interface WhyHereResponse {
  whyHere: WhyHereItem[];
}

export interface ResumeAnalysisRequest extends BaseRequest {
  resumeText: string;
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

export interface ResumeAnalysisResponse {
  analysis: ResumeAnalysisResult;
}
