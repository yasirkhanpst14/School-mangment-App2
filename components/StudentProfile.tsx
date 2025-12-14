import React, { useState } from 'react';
import { StudentRecord, SUBJECTS, Subject, SemesterResult } from '../types';
import { TOTAL_MARKS_PER_SUBJECT } from '../constants';
import { ArrowLeft, Save, Sparkles, Printer, FileText } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StudentProfileProps {
  student: StudentRecord;
  onBack: () => void;
  onUpdate: (updatedStudent: StudentRecord) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sem1' | 'sem2'>('profile');
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Temporary state for editing marks
  const [tempMarks, setTempMarks] = useState<Record<Subject, number>>({} as any);
  
  const initMarks = (sem: 1 | 2) => {
    const currentRes = sem === 1 ? student.results.sem1 : student.results.sem2;
    const initial: Record<Subject, number> = {} as any;
    SUBJECTS.forEach(sub => {
      initial[sub] = currentRes?.marks[sub] || 0;
    });
    setTempMarks(initial);
    setIsEditingMarks(true);
  };

  const saveMarks = (sem: 1 | 2) => {
    const newResults = { ...student.results };
    const resultKey = sem === 1 ? 'sem1' : 'sem2';
    
    newResults[resultKey] = {
      semester: sem,
      marks: tempMarks,
      remarks: newResults[resultKey]?.remarks,
      generatedInsight: newResults[resultKey]?.generatedInsight
    };

    onUpdate({ ...student, results: newResults });
    setIsEditingMarks(false);
  };

  const generateAIInsight = async (sem: 1 | 2) => {
    if(!process.env.API_KEY) {
        alert("API Key not configured in environment.");
        return;
    }
    setIsGenerating(true);
    const insight = await generateStudentReport(student, sem);
    
    const newResults = { ...student.results };
    const resultKey = sem === 1 ? 'sem1' : 'sem2';
    
    if (newResults[resultKey]) {
        // @ts-ignore
        newResults[resultKey].generatedInsight = insight;
        onUpdate({ ...student, results: newResults });
    } else {
        alert("Please save marks before generating insight.");
    }
    setIsGenerating(false);
  };

  const printResult = () => {
    window.print();
  };

  const renderResultView = (sem: 1 | 2) => {
    const result = sem === 1 ? student.results.sem1 : student.results.sem2;
    const hasResult = !!result;

    if (isEditingMarks && ((sem === 1 && activeTab === 'sem1') || (sem === 2 && activeTab === 'sem2'))) {
      return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
           <h3 className="text-lg font-bold mb-4 text-indigo-900">Enter Marks for Semester {sem}</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {SUBJECTS.map(sub => (
               <div key={sub} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                 <label className="font-medium text-slate-700">{sub}</label>
                 <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-24 p-2 border border-slate-300 rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={tempMarks[sub]}
                    onChange={(e) => setTempMarks({...tempMarks, [sub]: Number(e.target.value)})}
                 />
               </div>
             ))}
           </div>
           <div className="mt-6 flex justify-end gap-3">
             <button onClick={() => setIsEditingMarks(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={() => saveMarks(sem)} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center shadow-sm">
               <Save size={16} className="mr-2" /> Save Marks
             </button>
           </div>
        </div>
      );
    }

    if (!hasResult) {
       return (
         <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">No results uploaded for Semester {sem}</p>
            <button 
              onClick={() => initMarks(sem)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Add Marks
            </button>
         </div>
       );
    }

    // Display Result Card
    const totalMarks = Object.values(result.marks).reduce((a: number, b: number) => a + b, 0);
    const maxMarks = SUBJECTS.length * TOTAL_MARKS_PER_SUBJECT;
    const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-section">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
           <div>
             <h3 className="text-xl font-bold text-slate-800">Result Card - Semester {sem}</h3>
             <p className="text-slate-500 text-sm mt-1">Academic Year 2024-2025</p>
           </div>
           <div className="flex gap-2 no-print">
             <button onClick={() => initMarks(sem)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">Edit</button>
             <button onClick={printResult} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Print Result">
                <Printer size={20} />
             </button>
           </div>
        </div>

        <div className="p-6">
           {/* Print Header only visible on print */}
           <div className="hidden print-only mb-8 text-center border-b pb-4">
             <h1 className="text-3xl font-bold">Smart School System</h1>
             <p>Official Result Card</p>
           </div>

           <div className="grid grid-cols-2 gap-y-2 mb-6 text-sm">
             <div className="flex"><span className="w-32 text-slate-500">Name:</span> <span className="font-semibold">{student.name}</span></div>
             <div className="flex"><span className="w-32 text-slate-500">Father Name:</span> <span className="font-semibold">{student.fatherName}</span></div>
             <div className="flex"><span className="w-32 text-slate-500">Grade:</span> <span className="font-semibold">{student.grade}</span></div>
             <div className="flex"><span className="w-32 text-slate-500">Roll No:</span> <span className="font-semibold">{student.serialNo}</span></div>
           </div>

           <table className="w-full mb-6 text-sm">
             <thead className="bg-slate-50 border-y border-slate-200">
               <tr>
                 <th className="py-2 pl-4 text-left font-semibold text-slate-700">Subject</th>
                 <th className="py-2 text-right font-semibold text-slate-700">Total Marks</th>
                 <th className="py-2 pr-4 text-right font-semibold text-slate-700">Obtained</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {SUBJECTS.map(sub => (
                 <tr key={sub}>
                   <td className="py-2 pl-4 text-slate-800">{sub}</td>
                   <td className="py-2 text-right text-slate-500">{TOTAL_MARKS_PER_SUBJECT}</td>
                   <td className="py-2 pr-4 text-right font-medium text-slate-800">{result.marks[sub]}</td>
                 </tr>
               ))}
               <tr className="bg-indigo-50 font-bold">
                 <td className="py-3 pl-4 text-indigo-900">Grand Total</td>
                 <td className="py-3 text-right text-indigo-900">{maxMarks}</td>
                 <td className="py-3 pr-4 text-right text-indigo-900">{totalMarks} ({percentage}%)</td>
               </tr>
             </tbody>
           </table>
           
           {/* Remarks Section */}
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-800">Principal's Remarks</h4>
                {!result.generatedInsight && (
                    <button 
                    onClick={() => generateAIInsight(sem)} 
                    disabled={isGenerating}
                    className="no-print flex items-center text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                    >
                    <Sparkles size={12} className="mr-1" />
                    {isGenerating ? "Generating..." : "Generate with AI"}
                    </button>
                )}
             </div>
             <p className="text-slate-700 text-sm italic min-h-[40px]">
               {result.generatedInsight || result.remarks || "No remarks added yet."}
             </p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="no-print mb-6 flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back to List
      </button>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 no-print w-fit">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Profile Info
        </button>
        <button 
          onClick={() => setActiveTab('sem1')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sem1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Semester 1
        </button>
        <button 
          onClick={() => setActiveTab('sem2')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sem2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Semester 2
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
             <h2 className="text-xl font-bold text-slate-800">Student Profile</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Serial Number</label>
              <div className="text-lg text-slate-800 font-medium">{student.serialNo}</div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Grade</label>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                 Grade {student.grade}
              </span>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Full Name</label>
              <div className="text-lg text-slate-800">{student.name}</div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Father's Name</label>
              <div className="text-lg text-slate-800">{student.fatherName}</div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Form B (CNIC)</label>
              <div className="text-lg text-slate-800">{student.formB}</div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Date of Birth</label>
              <div className="text-lg text-slate-800">{student.dob}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Contact Number</label>
              <div className="text-lg text-slate-800 font-mono">{student.contact}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sem1' && renderResultView(1)}
      {activeTab === 'sem2' && renderResultView(2)}

    </div>
  );
};