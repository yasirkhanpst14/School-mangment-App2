import React, { useState, useEffect } from 'react';
import { StudentRecord, SUBJECTS, Subject, SemesterResult } from '../types';
import { TOTAL_MARKS_PER_SUBJECT, SCHOOL_NAME } from '../constants';
import { ArrowLeft, Save, Sparkles, Printer, FileText, User, Calendar, CreditCard, Phone, Hash, BookOpen, PenTool } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StudentProfileProps {
  student: StudentRecord;
  onBack: () => void;
  onUpdate: (updatedStudent: StudentRecord) => void;
  initialTab?: 'profile' | 'sem1' | 'sem2';
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onBack, onUpdate, initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sem1' | 'sem2'>(initialTab);
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Update active tab if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <PenToolIcon size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Enter Marks</h3>
                    <p className="text-sm text-slate-500">Semester {sem} Assessment</p>
                </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {SUBJECTS.map(sub => (
               <div key={sub} className="group flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                 <label className="font-semibold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">{sub}</label>
                 <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-20 p-2 bg-white border border-slate-300 rounded-lg text-center focus:outline-none font-bold text-slate-800"
                    value={tempMarks[sub]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTempMarks({...tempMarks, [sub]: Number(e.target.value)})}
                 />
               </div>
             ))}
           </div>
           
           <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
             <button onClick={() => setIsEditingMarks(false)} className="w-full sm:w-auto px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Discard Changes</button>
             <button onClick={() => saveMarks(sem)} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 font-semibold transition-all hover:-translate-y-0.5">
               <Save size={18} className="mr-2" /> Save Results
             </button>
           </div>
        </div>
      );
    }

    if (!hasResult) {
       return (
         <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed hover:border-indigo-300 transition-colors group cursor-pointer" onClick={() => initMarks(sem)}>
            <div className="w-20 h-20 bg-indigo-50 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <BookOpen size={36} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-slate-800 font-bold text-xl mb-2">No Academic Record Found</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start by adding marks for Semester {sem} to generate reports and insights.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); initMarks(sem); }}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-semibold"
            >
              Enter Marks Now
            </button>
         </div>
       );
    }

    // Display Result Card
    const totalMarks = Object.values(result.marks).reduce((a: number, b: number) => a + b, 0);
    const maxMarks = SUBJECTS.length * TOTAL_MARKS_PER_SUBJECT;
    const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);
    const percentageNum = Number(percentage);
    
    // Determine Grade Color
    let gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    let gradeLabel = 'A+';
    if(percentageNum < 40) { gradeColor = 'text-red-600 bg-red-50 border-red-100'; gradeLabel = 'F'; }
    else if(percentageNum < 50) { gradeColor = 'text-orange-600 bg-orange-50 border-orange-100'; gradeLabel = 'D'; }
    else if(percentageNum < 60) { gradeColor = 'text-yellow-600 bg-yellow-50 border-yellow-100'; gradeLabel = 'C'; }
    else if(percentageNum < 70) { gradeColor = 'text-blue-600 bg-blue-50 border-blue-100'; gradeLabel = 'B'; }
    else if(percentageNum < 80) { gradeColor = 'text-indigo-600 bg-indigo-50 border-indigo-100'; gradeLabel = 'A'; }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-section">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border ${gradeColor}`}>
                {gradeLabel}
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">Result Card - Semester {sem}</h3>
                <p className="text-slate-500 text-sm mt-0.5">Academic Session 2024-2025</p>
             </div>
           </div>
           <div className="flex gap-2 no-print">
             <button onClick={() => initMarks(sem)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 rounded-lg transition-colors text-sm font-semibold shadow-sm">Edit Marks</button>
             <button onClick={printResult} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all" title="Print Result">
                <Printer size={20} />
             </button>
           </div>
        </div>

        <div className="p-6 md:p-8">
           {/* Print Header only visible on print */}
           <div className="hidden print-only mb-8 text-center border-b pb-4">
             <h1 className="text-3xl font-bold">{SCHOOL_NAME}</h1>
             <p className="text-slate-500">Official Result Card</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 mb-8 text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div className="flex justify-between sm:justify-start"><span className="w-32 text-slate-500 font-medium uppercase text-xs tracking-wide">Name</span> <span className="font-bold text-slate-800 text-base">{student.name}</span></div>
             <div className="flex justify-between sm:justify-start"><span className="w-32 text-slate-500 font-medium uppercase text-xs tracking-wide">Father Name</span> <span className="font-semibold text-slate-800">{student.fatherName}</span></div>
             <div className="flex justify-between sm:justify-start"><span className="w-32 text-slate-500 font-medium uppercase text-xs tracking-wide">Reg No</span> <span className="font-semibold text-indigo-700">{student.registrationNo}</span></div>
             <div className="flex justify-between sm:justify-start"><span className="w-32 text-slate-500 font-medium uppercase text-xs tracking-wide">Grade</span> <span className="font-semibold text-slate-800">{student.grade}</span></div>
             <div className="flex justify-between sm:justify-start"><span className="w-32 text-slate-500 font-medium uppercase text-xs tracking-wide">Roll No</span> <span className="font-semibold text-slate-800 font-mono">{student.serialNo}</span></div>
           </div>

           <div className="overflow-hidden rounded-xl border border-slate-200 mb-8 shadow-sm">
             <table className="w-full text-sm min-w-[300px]">
               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                 <tr>
                   <th className="py-4 pl-6 text-left font-semibold">Subject</th>
                   <th className="py-4 text-right font-semibold">Total Marks</th>
                   <th className="py-4 pr-6 text-right font-semibold">Obtained</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {SUBJECTS.map(sub => (
                   <tr key={sub} className="hover:bg-slate-50/50">
                     <td className="py-3 pl-6 text-slate-800 font-semibold">{sub}</td>
                     <td className="py-3 text-right text-slate-500 font-mono">{TOTAL_MARKS_PER_SUBJECT}</td>
                     <td className="py-3 pr-6 text-right font-bold text-slate-800 font-mono text-base">{result.marks[sub]}</td>
                   </tr>
                 ))}
                 <tr className="bg-slate-50 font-bold border-t border-slate-200">
                   <td className="py-4 pl-6 text-slate-900">Grand Total</td>
                   <td className="py-4 text-right text-slate-900 font-mono">{maxMarks}</td>
                   <td className="py-4 pr-6 text-right text-indigo-700 font-mono text-xl">{totalMarks} <span className="text-sm font-medium text-slate-500 ml-1">({percentage}%)</span></td>
                 </tr>
               </tbody>
             </table>
           </div>
           
           {/* Remarks Section */}
           <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 rounded-2xl border border-indigo-100/50">
             <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h4 className="font-bold text-slate-800 flex items-center">
                    <Sparkles size={18} className="text-amber-500 mr-2 fill-amber-500" />
                    AI Performance Insight
                </h4>
                {!result.generatedInsight && (
                    <button 
                    onClick={() => generateAIInsight(sem)} 
                    disabled={isGenerating}
                    className="no-print flex items-center text-xs font-bold bg-white text-indigo-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all border border-indigo-100 whitespace-nowrap"
                    >
                    <Sparkles size={14} className="mr-1.5" />
                    {isGenerating ? "Analyzing Performance..." : "Generate Analysis"}
                    </button>
                )}
             </div>
             <div className="text-slate-700 text-sm leading-relaxed p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 italic shadow-sm">
               {result.generatedInsight || result.remarks || "Click 'Generate Analysis' to get AI-powered insights on student performance."}
             </div>
           </div>
        </div>
      </div>
    );
  };

  const PenToolIcon = ({size}: {size: number}) => <PenTool size={size} />;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="no-print p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{student.name}</h1>
            <p className="text-slate-500 text-sm font-medium">Student Profile & Records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 no-print w-full md:w-fit overflow-x-auto whitespace-nowrap gap-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[140px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          Profile Details
        </button>
        <button 
          onClick={() => setActiveTab('sem1')}
          className={`flex-1 min-w-[140px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sem1' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          Semester 1
        </button>
        <button 
          onClick={() => setActiveTab('sem2')}
          className={`flex-1 min-w-[140px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sem2' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          Semester 2
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
             <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide border border-indigo-200">
                 Grade {student.grade}
             </span>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                <Hash size={14} className="mr-1.5" /> Registration No
              </label>
              <div className="text-lg text-slate-900 font-bold font-mono tracking-tight">{student.registrationNo || '-'}</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                 Serial / Roll No
              </label>
              <div className="text-lg text-slate-900 font-bold font-mono tracking-tight">{student.serialNo}</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                 <User size={14} className="mr-1.5" /> Full Name
              </label>
              <div className="text-lg text-slate-900 font-bold">{student.name}</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                 Father's Name
              </label>
              <div className="text-lg text-slate-900 font-semibold">{student.fatherName}</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                 <CreditCard size={14} className="mr-1.5" /> Form B (CNIC)
              </label>
              <div className="text-lg text-slate-900 font-semibold font-mono tracking-tight">{student.formB}</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-1">
                 <Calendar size={14} className="mr-1.5" /> Date of Birth
              </label>
              <div className="text-lg text-slate-900 font-semibold">{student.dob}</div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-slate-100 mt-2">
              <label className="flex items-center text-xs uppercase tracking-wide text-slate-400 font-bold mb-2">
                 <Phone size={14} className="mr-1.5" /> Contact Number
              </label>
              <div className="text-2xl text-indigo-600 font-bold font-mono tracking-tight">{student.contact}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sem1' && renderResultView(1)}
      {activeTab === 'sem2' && renderResultView(2)}

    </div>
  );
};