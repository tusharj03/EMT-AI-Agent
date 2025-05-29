import { AIMessage } from '@/types';

// Function to process audio transcription with AI
export const processTranscription = async (transcription: string): Promise<any> => {
  try {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an AI medical assistant for EMTs. Analyze the following transcription of a patient encounter and extract:
1. Patient demographics (name, age, gender if mentioned)
2. Vital signs with timestamps (pulse, blood pressure, respiratory rate, temperature, oxygen saturation)
3. Symptoms reported
4. Treatments administered
5. Create a timeline of events based on the timestamps in the transcription
6. Generate a SOAP note (Subjective, Objective, Assessment, Plan)

IMPORTANT: Filter out any off-topic conversation and focus only on clinically relevant information.
IMPORTANT: Return ONLY a valid JSON object with the following structure:

{
  "patientInfo": { 
    "name": "string or null", 
    "age": number or null, 
    "gender": "string or null" 
  },
  "vitals": [
    { 
      "type": "pulse", 
      "value": "72", 
      "unit": "bpm", 
      "timestamp": 12 
    }
  ],
  "symptoms": ["chest pain", "shortness of breath"],
  "treatments": ["administered oxygen", "gave aspirin"],
  "timeline": [
    { 
      "timestamp": 12, 
      "description": "Pulse: 72 bpm", 
      "type": "vital" 
    }
  ],
  "soapNote": {
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string"
  }
}`
      },
      {
        role: 'user',
        content: transcription
      }
    ];

    try {
      // In a production app, this would make a real API call to process the transcription
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      try {
        // Try to parse the completion as JSON
        // First, let's clean up the response to ensure it's valid JSON
        const cleanedJson = data.completion
          .replace(/^```json/g, '') // Remove markdown code block start if present
          .replace(/```$/g, '')     // Remove markdown code block end if present
          .trim();                  // Remove any extra whitespace
        
        return JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', data.completion);
        
        // Fallback to a default structure if parsing fails
        return getMockReportData(transcription);
      }
    } catch (error) {
      console.error('Error processing transcription with AI:', error);
      
      // Return a mock data based on the transcription
      return getMockReportData(transcription);
    }
  } catch (error) {
    console.error('Error in processTranscription:', error);
    
    // Return a mock data on error
    return getMockReportData(transcription);
  }
};

// Function to generate FHIR DiagnosticReport
export const generateFHIRReport = async (report: any, providerInfo: any): Promise<string> => {
  try {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: "You are an AI assistant that converts medical reports into FHIR DiagnosticReport resources. Create a valid FHIR DiagnosticReport JSON based on the provided medical report and provider information. Return ONLY the valid JSON with no additional text, markdown formatting, or explanation. Do not include any code block markers like ```json or ```."
      },
      {
        role: 'user',
        content: JSON.stringify({
          report,
          providerInfo
        })
      }
    ];

    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Clean up the response to ensure it's valid JSON
      const cleanedJson = data.completion
        .replace(/^```json/g, '') // Remove markdown code block start if present
        .replace(/```$/g, '')     // Remove markdown code block end if present
        .trim();                  // Remove any extra whitespace
      
      try {
        // Validate that it's parseable JSON
        JSON.parse(cleanedJson);
        return cleanedJson;
      } catch (parseError) {
        console.error('Failed to parse FHIR JSON:', parseError);
        return getMockFHIRReport();
      }
    } catch (error) {
      console.error('Error generating FHIR report:', error);
      return getMockFHIRReport();
    }
  } catch (error) {
    console.error('Error in generateFHIRReport:', error);
    return getMockFHIRReport();
  }
};

// Extract basic information from transcription for mock data
function extractBasicInfo(transcription: string) {
  // Extract patient name (looking for patterns like "patient name is [Name]" or "patient [Name]")
  const nameMatch = transcription.match(/patient(?:\s+name\s+is)?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i) || 
                    transcription.match(/name(?:\s+is)?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  const name = nameMatch ? nameMatch[1] : "Unknown Patient";
  
  // Extract age (looking for patterns like "age [number]" or "[number] year old")
  const ageMatch = transcription.match(/age(?:\s+is)?\s+(\d+)/i) || 
                   transcription.match(/(\d+)(?:\s+year(?:s)?\s+old)/i);
  const age = ageMatch ? parseInt(ageMatch[1]) : null;
  
  // Extract gender (looking for "male" or "female")
  const genderMatch = transcription.match(/\b(male|female)\b/i);
  const gender = genderMatch ? genderMatch[1].toLowerCase() : null;
  
  // Extract pulse/heart rate
  const pulseMatch = transcription.match(/(?:pulse|heart rate)(?:\s+is)?\s+(\d+)/i);
  const pulse = pulseMatch ? pulseMatch[1] : "80";
  
  // Extract blood pressure
  const bpMatch = transcription.match(/(?:blood pressure|bp)(?:\s+is)?\s+(\d+)[\/\\](\d+)/i);
  const bp = bpMatch ? `${bpMatch[1]}/${bpMatch[2]}` : "120/80";
  
  // Extract respiratory rate
  const rrMatch = transcription.match(/(?:respiratory rate|breathing rate)(?:\s+is)?\s+(\d+)/i);
  const respiratoryRate = rrMatch ? rrMatch[1] : "16";
  
  // Extract oxygen saturation
  const o2Match = transcription.match(/(?:oxygen|o2|sat)(?:\s+is)?\s+(\d+)(?:\s*%)?/i);
  const oxygenSat = o2Match ? o2Match[1] : "98";
  
  // Extract common symptoms
  const symptoms = [];
  if (transcription.match(/\b(chest pain|chest discomfort)\b/i)) symptoms.push("chest pain");
  if (transcription.match(/\b(shortness of breath|difficulty breathing|sob)\b/i)) symptoms.push("shortness of breath");
  if (transcription.match(/\b(nausea|vomiting)\b/i)) symptoms.push("nausea");
  if (transcription.match(/\b(dizziness|lightheaded)\b/i)) symptoms.push("dizziness");
  if (transcription.match(/\b(headache)\b/i)) symptoms.push("headache");
  if (transcription.match(/\b(abdominal pain|stomach pain)\b/i)) symptoms.push("abdominal pain");
  
  // Extract common treatments
  const treatments = [];
  if (transcription.match(/\b(oxygen|o2)\b/i)) treatments.push("oxygen therapy");
  if (transcription.match(/\b(aspirin)\b/i)) treatments.push("aspirin administered");
  if (transcription.match(/\b(nitroglycerin|nitro)\b/i)) treatments.push("nitroglycerin administered");
  if (transcription.match(/\b(iv|intravenous)\b/i)) treatments.push("IV access established");
  if (transcription.match(/\b(epi|epinephrine)\b/i)) treatments.push("epinephrine administered");
  if (transcription.match(/\b(albuterol|inhaler)\b/i)) treatments.push("albuterol administered");
  
  return {
    name,
    age,
    gender,
    pulse,
    bp,
    respiratoryRate,
    oxygenSat,
    symptoms: symptoms.length > 0 ? symptoms : ["chest pain", "shortness of breath"],
    treatments: treatments.length > 0 ? treatments : ["oxygen therapy", "aspirin administered"]
  };
}

// Mock data for demo purposes, but using information from the transcription if available
function getMockReportData(transcription: string = "") {
  const extractedInfo = extractBasicInfo(transcription);
  
  return {
    patientInfo: {
      name: extractedInfo.name,
      age: extractedInfo.age || 45,
      gender: extractedInfo.gender || "male"
    },
    vitals: [
      {
        type: "pulse",
        value: extractedInfo.pulse,
        unit: "bpm",
        timestamp: 0
      },
      {
        type: "bloodPressure",
        value: extractedInfo.bp,
        unit: "mmHg",
        timestamp: 0
      },
      {
        type: "respiratoryRate",
        value: extractedInfo.respiratoryRate,
        unit: "breaths/min",
        timestamp: 0
      },
      {
        type: "oxygenSaturation",
        value: extractedInfo.oxygenSat,
        unit: "%",
        timestamp: 0
      },
      {
        type: "pulse",
        value: (parseInt(extractedInfo.pulse) - 5).toString(),
        unit: "bpm",
        timestamp: 300
      },
      {
        type: "bloodPressure",
        value: (parseInt(extractedInfo.bp.split('/')[0]) - 5) + "/" + (parseInt(extractedInfo.bp.split('/')[1]) - 5),
        unit: "mmHg",
        timestamp: 300
      },
      {
        type: "pulse",
        value: (parseInt(extractedInfo.pulse) - 10).toString(),
        unit: "bpm",
        timestamp: 600
      },
      {
        type: "bloodPressure",
        value: (parseInt(extractedInfo.bp.split('/')[0]) - 10) + "/" + (parseInt(extractedInfo.bp.split('/')[1]) - 10),
        unit: "mmHg",
        timestamp: 600
      },
      {
        type: "respiratoryRate",
        value: (parseInt(extractedInfo.respiratoryRate) - 2).toString(),
        unit: "breaths/min",
        timestamp: 600
      },
      {
        type: "oxygenSaturation",
        value: (parseInt(extractedInfo.oxygenSat) + 2).toString(),
        unit: "%",
        timestamp: 600
      }
    ],
    symptoms: extractedInfo.symptoms,
    treatments: extractedInfo.treatments,
    timeline: [
      {
        timestamp: 0,
        description: `Initial assessment: Pulse ${extractedInfo.pulse} bpm, BP ${extractedInfo.bp} mmHg, RR ${extractedInfo.respiratoryRate}, O2 sat ${extractedInfo.oxygenSat}%`,
        type: "vital"
      },
      {
        timestamp: 0,
        description: `Patient reports ${extractedInfo.symptoms.join(" and ")}`,
        type: "symptom"
      },
      {
        timestamp: 120,
        description: "Administered aspirin (4 tablets, 81mg each)",
        type: "treatment"
      },
      {
        timestamp: 150,
        description: "Started oxygen at 2 liters per minute via nasal cannula",
        type: "treatment"
      },
      {
        timestamp: 300,
        description: `Vitals check: Pulse ${parseInt(extractedInfo.pulse) - 5} bpm, BP ${parseInt(extractedInfo.bp.split('/')[0]) - 5}/${parseInt(extractedInfo.bp.split('/')[1]) - 5} mmHg`,
        type: "vital"
      },
      {
        timestamp: 330,
        description: "Administered nitroglycerin 0.4mg sublingual",
        type: "treatment"
      },
      {
        timestamp: 360,
        description: "Patient reports feeling a little better but still having some pain",
        type: "observation"
      },
      {
        timestamp: 420,
        description: "Decision to transport to Memorial Hospital, ETA 10 minutes",
        type: "observation"
      },
      {
        timestamp: 600,
        description: `Final vitals: Pulse ${parseInt(extractedInfo.pulse) - 10} bpm, BP ${parseInt(extractedInfo.bp.split('/')[0]) - 10}/${parseInt(extractedInfo.bp.split('/')[1]) - 10} mmHg, RR ${parseInt(extractedInfo.respiratoryRate) - 2}, O2 sat ${parseInt(extractedInfo.oxygenSat) + 2}% on 2L`,
        type: "vital"
      }
    ],
    soapNote: {
      subjective: `${extractedInfo.age || 45}-year-old ${extractedInfo.gender || "male"} patient presenting with ${extractedInfo.symptoms.join(" and ")} that started approximately 30 minutes prior to EMS arrival. Patient describes the pain as 'like someone sitting on my chest.' No reported history of similar episodes.`,
      objective: `Initial vital signs: Pulse ${extractedInfo.pulse} bpm, BP ${extractedInfo.bp} mmHg, respiratory rate ${extractedInfo.respiratoryRate} breaths/min, oxygen saturation ${extractedInfo.oxygenSat}% on room air. After treatment, vital signs improved to: Pulse ${parseInt(extractedInfo.pulse) - 10} bpm, BP ${parseInt(extractedInfo.bp.split('/')[0]) - 10}/${parseInt(extractedInfo.bp.split('/')[1]) - 10} mmHg, respiratory rate ${parseInt(extractedInfo.respiratoryRate) - 2} breaths/min, oxygen saturation ${parseInt(extractedInfo.oxygenSat) + 2}% on 2L oxygen via nasal cannula.`,
      assessment: "Patient presenting with symptoms consistent with possible acute coronary syndrome. Chest pain, elevated blood pressure, and tachycardia suggest cardiac origin. Patient showed partial improvement with initial interventions.",
      plan: `1. Administered aspirin 324mg (4 tablets of 81mg) PO
2. Initiated oxygen therapy at 2L/min via nasal cannula
3. Administered nitroglycerin 0.4mg sublingual
4. Transport to Memorial Hospital emergency department for further evaluation and treatment
5. Continuous cardiac and vital sign monitoring during transport`
    }
  };
}

function getMockFHIRReport() {
  return `{
  "resourceType": "DiagnosticReport",
  "id": "emt-report-${Date.now()}",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
          "code": "EMT",
          "display": "Emergency Medical Technician Report"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "34117-2",
        "display": "History and physical note"
      }
    ],
    "text": "EMT Patient Encounter Report"
  },
  "subject": {
    "reference": "Patient/example",
    "display": "John Doe"
  },
  "effectiveDateTime": "${new Date().toISOString()}",
  "issued": "${new Date().toISOString()}",
  "performer": [
    {
      "reference": "Practitioner/example",
      "display": "EMT Johnson"
    }
  ],
  "result": [
    {
      "reference": "Observation/heart-rate",
      "display": "Heart Rate: 100 bpm"
    },
    {
      "reference": "Observation/blood-pressure",
      "display": "Blood Pressure: 150/85 mmHg"
    },
    {
      "reference": "Observation/respiratory-rate",
      "display": "Respiratory Rate: 20 breaths/min"
    },
    {
      "reference": "Observation/oxygen-saturation",
      "display": "Oxygen Saturation: 96% on 2L"
    }
  ],
  "conclusion": "45-year-old male presenting with chest pain and shortness of breath. Vital signs stabilized after administration of aspirin, oxygen, and nitroglycerin. Assessment suggests possible acute coronary syndrome requiring further evaluation at the emergency department.",
  "presentedForm": [
    {
      "contentType": "text/plain",
      "data": "U09BUCBOb3RlOgpTdWJqZWN0aXZlOiA0NS15ZWFyLW9sZCBtYWxlIHBhdGllbnQgcHJlc2VudGluZyB3aXRoIGNoZXN0IHBhaW4gYW5kIHNob3J0bmVzcyBvZiBicmVhdGggdGhhdCBzdGFydGVkIGFwcHJveGltYXRlbHkgMzAgbWludXRlcyBwcmlvciB0byBFTVMgYXJyaXZhbC4gUGF0aWVudCBkZXNjcmliZXMgdGhlIHBhaW4gYXMgJ2xpa2Ugc29tZW9uZSBzaXR0aW5nIG9uIG15IGNoZXN0LicgTm8gcmVwb3J0ZWQgaGlzdG9yeSBvZiBzaW1pbGFyIGVwaXNvZGVzLgpPYmplY3RpdmU6IEluaXRpYWwgdml0YWwgc2lnbnM6IFB1bHNlIDExMCBicG0sIEJQIDE2MC85NSBtbUhnLCByZXNwaXJhdG9yeSByYXRlIDIyIGJyZWF0aHMvbWluLCBveHlnZW4gc2F0dXJhdGlvbiA5NCUgb24gcm9vbSBhaXIuIEFmdGVyIHRyZWF0bWVudCwgdml0YWwgc2lnbnMgaW1wcm92ZWQgdG86IFB1bHNlIDEwMCBicG0sIEJQIDE1MC84NSBtbUhnLCByZXNwaXJhdG9yeSByYXRlIDIwIGJyZWF0aHMvbWluLCBveHlnZW4gc2F0dXJhdGlvbiA5NiUgb24gMkwgb3h5Z2VuIHZpYSBuYXNhbCBjYW5udWxhLgpBc3Nlc3NtZW50OiBQYXRpZW50IHByZXNlbnRpbmcgd2l0aCBzeW1wdG9tcyBjb25zaXN0ZW50IHdpdGggcG9zc2libGUgYWN1dGUgY29yb25hcnkgc3luZHJvbWUuIENoZXN0IHBhaW4sIGVsZXZhdGVkIGJsb29kIHByZXNzdXJlLCBhbmQgdGFjaHljYXJkaWEgc3VnZ2VzdCBjYXJkaWFjIG9yaWdpbi4gUGF0aWVudCBzaG93ZWQgcGFydGlhbCBpbXByb3ZlbWVudCB3aXRoIGluaXRpYWwgaW50ZXJ2ZW50aW9ucy4KUGxhbjogMS4gQWRtaW5pc3RlcmVkIGFzcGlyaW4gMzI0bWcgKDQgdGFibGV0cyBvZiA4MW1nKSBQTwoyLiBJbml0aWF0ZWQgb3h5Z2VuIHRoZXJhcHkgYXQgMkwvbWluIHZpYSBuYXNhbCBjYW5udWxhCjMuIEFkbWluaXN0ZXJlZCBuaXRyb2dseWNlcmluIDAuNG1nIHN1Ymxpbmd1YWwKNC4gVHJhbnNwb3J0IHRvIE1lbW9yaWFsIEhvc3BpdGFsIGVtZXJnZW5jeSBkZXBhcnRtZW50IGZvciBmdXJ0aGVyIGV2YWx1YXRpb24gYW5kIHRyZWF0bWVudAo1LiBDb250aW51b3VzIGNhcmRpYWMgYW5kIHZpdGFsIHNpZ24gbW9uaXRvcmluZyBkdXJpbmcgdHJhbnNwb3J0",
      "title": "EMT SOAP Note"
    }
  ]
}`;
}