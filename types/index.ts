export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number; // in seconds
  audioUri?: string;
  transcription?: string;
  report?: Report;
  status: 'recording' | 'processing' | 'completed' | 'error';
}

export interface Report {
  id: string;
  recordingId: string;
  date: string;
  patientInfo: PatientInfo;
  vitals: Vital[];
  symptoms: string[];
  treatments: string[];
  timeline: TimelineEvent[];
  soapNote: SOAPNote;
  fhirData?: string; // Base64 encoded FHIR JSON
}

export interface PatientInfo {
  name?: string;
  age?: number;
  gender?: string;
  id?: string;
}

export interface Vital {
  type: 'pulse' | 'bloodPressure' | 'respiratoryRate' | 'temperature' | 'oxygenSaturation' | 'other';
  value: string;
  timestamp: number; // seconds from start of recording
  unit?: string;
}

export interface TimelineEvent {
  timestamp: number; // seconds from start of recording
  description: string;
  type: 'vital' | 'symptom' | 'treatment' | 'observation';
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<ContentPart>;
}

export type ContentPart = 
  | { type: 'text'; text: string; }
  | { type: 'image'; image: string; }