import { GoogleGenAI } from "@google/genai";
import { StudentRecord, SemesterResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateStudentReport = async (student: StudentRecord, semester: 1 | 2): Promise<string> => {
  const client = getClient();
  if (!client) throw new Error("API Key not found");

  const result = semester === 1 ? student.results.sem1 : student.results.sem2;
  
  if (!result) return "No result data available for this semester.";

  const prompt = `
    Act as an experienced school principal. Write a 2-3 sentence report card comment for a student in Grade ${student.grade}.
    
    Student Name: ${student.name}
    Semester: ${semester}
    
    Marks Obtained (Out of 100 each):
    ${Object.entries(result.marks).map(([subj, score]) => `${subj}: ${score}`).join(', ')}
    
    The tone should be encouraging but honest. Highlight their best subject and suggest an area for improvement if any scores are low (below 50).
    Do not use markdown. Just plain text.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI insight. Please try again.";
  }
};