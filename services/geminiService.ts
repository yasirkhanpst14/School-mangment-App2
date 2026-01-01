import { GoogleGenAI } from "@google/genai";
import { StudentRecord } from "../types";

// Always initialize fresh to ensure latest API key is used
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
    2. If Math and Science are both high, mention "Analytical Excellence".
    3. If languages are high, mention "Communication Potential".
    4. Keep it to 3 concise, professional sentences.
    5. Return ONLY the text, no markdown, no quotes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
    });
    return response.text?.trim() || "Could not generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI assistant is currently summarizing its thoughts.";
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
    Act as a Data Analyst for GPS Bazar No 1. Analyze school stats for ${session}:
    Total Enrollment: ${totalStudents}
    Grade Distribution: ${JSON.stringify(gradeCounts)}
    Summarize institutional health in 2 professional sentences. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Analysis pending.";
  } catch (error) {
    return "Analyzing institutional performance metrics...";
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

  // Create a condensed summary of app data for context, EXCLUDING sensitive contact numbers
  const contextSummary = students.map(s => ({
    name: s.name,
    roll: s.serialNo,
    grade: s.grade,
    father: s.fatherName,
    hasS1: !!s.results.sem1,
    hasS2: !!s.results.sem2
  }));

  const systemInstruction = `
    You are the "AI Assistant", the official intelligent guide for GPS Bazar No 1 management software.
    You have access to the current school database summary: ${JSON.stringify(contextSummary.slice(0, 100))}.
    
    IMPORTANT PRIVACY RULE:
    You do NOT have access to student contact numbers or phone numbers. This information is hidden from you for security reasons.
    If a user asks for a contact number or phone number, politely explain that you do not have access to sensitive personal contact information.
    
    Your goals:
    1. Help the admin/teacher find student data like roll numbers, fathers' names, and grades.
    2. Be friendly, helpful, and concise.
    3. Use a polite "robotic yet human" tone.
    4. Provide summaries of academic performance when requested.
    5. Always refer to yourself as the AI Assistant.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm processing your request. Please try again.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I am currently syncing with the database. Please try again in a few seconds.";
  }
};
