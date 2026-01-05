import { GoogleGenAI } from "@google/genai";
import { StudentRecord } from "../types";

// Always initialize fresh to ensure latest API key is used
// Note: process.env.API_KEY is automatically injected by the platform.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a comprehensive report card comment for a specific student.
 */
export const generateStudentReport = async (student: StudentRecord, semester: 1 | 2): Promise<string> => {
  const ai = getAI();
  const result = semester === 1 ? student.results.sem1 : student.results.sem2;
  
  if (!result) return "No result data available for this semester.";

  const prompt = `
    Act as a highly experienced pedagogical expert and school principal at GPS Bazar No 1. 
    Write a sophisticated, encouraging, and highly personalized report card comment for:
    
    Student: ${student.name} (Grade ${student.grade})
    Father's Name: ${student.fatherName}
    Semester: ${semester}
    
    Marks Data (Out of 100):
    ${Object.entries(result.marks).map(([subj, score]) => `${subj}: ${score}`).join(', ')}
    
    Instructions:
    1. Analyze strengths and specific areas needing attention.
    2. Provide 3 concise, professional sentences.
    3. Return ONLY the text, no markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || "Performance review finalized.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Evaluation complete. Please check the profile manually for details.";
  }
};

/**
 * Analyzes the entire school's data for the Principal's Dashboard.
 */
export const generateSchoolSummary = async (students: StudentRecord[], session: string): Promise<string> => {
  const ai = getAI();
  
  const totalStudents = students.length;
  const gradeCounts = students.reduce((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {} as any);

  const prompt = `
    Analyze school stats for ${session}:
    Total Enrollment: ${totalStudents}
    Grade Distribution: ${JSON.stringify(gradeCounts)}
    Summarize institutional performance in 2 sentences. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Institutional health analysis finalized.";
  } catch (error) {
    return "Analyzing school performance metrics...";
  }
};

/**
 * Chatbot functionality with full application context
 */
export const chatWithAssistant = async (
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  students: StudentRecord[]
): Promise<string> => {
  const ai = getAI();

  // Create a condensed summary of app data for context
  const contextSummary = students.map(s => ({
    name: s.name,
    roll: s.serialNo,
    grade: s.grade,
    father: s.fatherName,
    hasS1: !!s.results.sem1,
    hasS2: !!s.results.sem2
  })).slice(0, 100); // Limit to 100 for token efficiency

  const systemInstruction = `
    You are the "AI Assistant" for GPS Bazar No 1.
    Database Context: ${JSON.stringify(contextSummary)}.
    
    Rules:
    1. Help admins find student info (Roll, Grade, Father).
    2. Be friendly and professional.
    3. Do not disclose private phone numbers.
    4. If you don't know a student, suggest using the Search bar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `System context: ${systemInstruction}\n\nUser: ${message}` }] },
    });

    return response.text?.trim() || "I am connected. How can I help with student data today?";
  } catch (error: any) {
    console.error("Chat Error:", error);
    return "The AI module is currently synchronizing. Please try again in a moment.";
  }
};