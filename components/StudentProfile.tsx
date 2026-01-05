import React, { useState, useEffect } from 'react';
import { StudentRecord, SUBJECTS, Subject, SemesterResult } from '../types';
import { TOTAL_MARKS_PER_SUBJECT, SCHOOL_NAME } from '../constants';
import { ArrowLeft, Save, Sparkles, Printer, FileText, User, Calendar, CreditCard, Phone, Hash, BookOpen, PenTool, Award, School, CalendarCheck } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StudentProfileProps {
  student: StudentRecord;
  onBack: () => void;
  onUpdate: (updatedStudent: StudentRecord) => void;
  initialTab?: 'profile' | 'sem1' | 'sem2' | 'dmc' | 'attendance';
  session: string;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onBack, onUpdate, initialTab = 'profile', session }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sem1' | 'sem2' | 'dmc' | 'attendance'>(initialTab);
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
    setIsGenerating(true);
    try {
        const insight = await generateStudentReport(student, sem);
        const newResults = { ...student.results };
        const resultKey = sem === 1 ? 'sem1' : 'sem2';
        
        if (newResults[resultKey]) {
            // @ts-ignore
            newResults[resultKey].generatedInsight = insight;
            onUpdate({ ...student, results: newResults });
        }
    } catch (e) {
        alert("Check your API key or connection.");
    }
    setIsGenerating(false);
  };

  const printDocument = () => {
    window.print();
  };

  const renderAttendance = () => {
    const records = student.attendance || {};
    const dates = Object.keys(records).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const stats = Object.values(records).reduce<{ p: number; a: number; l: number }>((acc, curr) => {
        if(curr === 'P') acc.p++;
        if(curr === 'A') acc.a++;
        if(curr === 'L') acc.l++;
        return acc;
    }, { p: 0, a: 0, l: 0 });

    const total = dates.length;
    const percentage = total > 0 ? Math.round((stats.p / total) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Attendance History</h3>
                    <p className="text-sm text-slate-500 mt-1">{total} Total Records</p>
                 </div>
                 <div className="flex gap-4">
                     <div className="text-center">
                         <div className="text-2xl font-black text-emerald-600">{percentage}%</div>
                         <div className="text-[10px] uppercase font-bold text-slate-400">Presence</div>
                     </div>
                 </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1 p-4 bg-slate-50 border-b border-slate-200">
                 <div className="bg-emerald-100/50 p-3 rounded-xl text-center border border-emerald-100">
                     <div className="text-lg font-black text-emerald-800">{stats.p}</div>
                     <div className="text-[10px] uppercase font-bold text-emerald-600">Present</div>
                 </div>
                 <div className="bg-red-100/50 p-3 rounded-xl text-center border border-red-100">
                     <div className="text-lg font-black text-red-800">{stats.a}</div>
                     <div className="text-[10px] uppercase font-bold text-red-600">Absent</div>
                 </div>
                 <div className="bg-amber-100/50 p-3 rounded-xl text-center border border-amber-100">
                     <div className="text-lg font-black text-amber-800">{stats.l}</div>
                     <div className="text-[10px] uppercase font-bold text-amber-600">Leave</div>
                 </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
                {dates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {dates.map(date => (
                            <div key={date} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                                <div className="text-sm font-bold text-slate-700">{date}</div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    records[date] === 'P' ? 'bg-emerald-100 text-emerald-700' :
                                    records[date] === 'A' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {records[date]}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">No attendance records found.</div>
                )}
            </div>
        </div>
    );
  };

  const renderDMC = () => {
    const sem1 = student.results.sem1;
    const sem2 = student.results.sem2;
    
    let grandTotalObtained = 0;
    const TOTAL_MAX = 100;

    const subjectsData = SUBJECTS.map(sub => {
        const s1Raw = sem1?.marks[sub] || 0;
        const s2Raw = sem2?.marks[sub] || 0;
        
        const s1Weighted = Math.round(s1Raw * 0.45);
        const s2Weighted = Math.round(s2Raw * 0.55);
        const combined = s1Weighted + s2Weighted;
        
        grandTotalObtained += combined;

        return { 
            subject: sub, 
            s1: s1Raw, 
            s1W: s1Weighted, 
            s2: s2Raw, 
            s2W: s2Weighted, 
            total: combined 
        };
    });

    const maxGrandTotal = SUBJECTS.length * 100;
    const percentage = ((grandTotalObtained / maxGrandTotal) * 100).toFixed(2);
    const p = Number(percentage);
    
    let grade = "F";
    if(p >= 80) grade = "A+";
    else if(p >= 70) grade = "A";
    else if(p >= 60) grade = "B";
    else if(p >= 50) grade = "C";
    else if(p >= 40) grade = "D";

    return (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <div className="flex justify-end mb-4 no-print">
                <button onClick={printDocument} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-900 text-white rounded-xl hover:bg-emerald-950 shadow-lg shadow-emerald-900/30 transition-all font-semibold border-b-2 border-amber-400">
                    <Printer size={18} /> Print Transcript
                </button>
            </div>

            <div id="dmc-print-area" className="border-[3px] border-emerald-900 p-4 md:p-8 max-w-[210mm] mx-auto bg-white print:border-[2px] print:p-4 print:m-0 print:w-full">
                <div className="text-center border-b-2 border-emerald-900 pb-4 mb-4">
                    <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">{SCHOOL_NAME}</h1>
                    <h2 className="text-lg font-bold text-slate-800 mt-2 inline-block border-b border-slate-800 px-4 pb-0.5 uppercase">Annual Record Transcript</h2>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Session {session}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-xs font-medium">
                    <div className="flex border-b border-slate-200 pb-0.5">
                        <span className="w-28 text-emerald-900 font-bold uppercase text-[10px]">Student Name:</span>
                        <span className="flex-1 text-slate-900 font-bold uppercase">{student.name}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-0.5">
                        <span className="w-28 text-emerald-900 font-bold uppercase text-[10px]">Father's Name:</span>
                        <span className="flex-1 text-slate-900 font-bold uppercase">{student.fatherName}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-0.5">
                        <span className="w-28 text-emerald-900 font-bold uppercase text-[10px]">Class/Grade:</span>
                        <span className="flex-1 text-slate-900 uppercase">{student.grade}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-0.5">
                        <span className="w-28 text-emerald-900 font-bold uppercase text-[10px]">Roll Number:</span>
                        <span className="flex-1 text-slate-900 font-mono font-bold">{student.serialNo}</span>
                    </div>
                </div>

                <table className="w-full text-[11px] border-collapse border border-slate-800 mb-6">
                    <thead>
                        <tr className="bg-emerald-50 text-emerald-950">
                            <th className="border border-slate-800 py-1.5 px-3 text-left uppercase font-bold text-[9px]">Academic Subject</th>
                            <th className="border border-slate-800 py-1.5 px-1 text-center uppercase font-bold text-[9px] w-20">Sem 1 (45%)</th>
                            <th className="border border-slate-800 py-1.5 px-1 text-center uppercase font-bold text-[9px] w-20">Sem 2 (55%)</th>
                            <th className="border border-slate-800 py-1.5 px-1 text-center uppercase font-bold text-[9px] w-20">Final Grade</th>
                            <th className="border border-slate-800 py-1.5 px-1 text-center uppercase font-bold text-[9px] w-20">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectsData.map((row, idx) => (
                            <tr key={idx} className="print:leading-tight">
                                <td className="border border-slate-600 py-1.5 px-3 font-bold text-slate-800">{row.subject}</td>
                                <td className="border border-slate-600 py-1.5 px-1 text-center text-slate-500 font-mono">{row.s1W}</td>
                                <td className="border border-slate-600 py-1.5 px-1 text-center text-slate-500 font-mono">{row.s2W}</td>
                                <td className="border border-slate-600 py-1.5 px-1 text-center font-bold text-emerald-800 font-mono text-xs">{row.total}</td>
                                <td className="border border-slate-600 py-1.5 px-1 text-center text-[9px] font-black uppercase text-slate-400">
                                    {row.total >= 40 ? 'Pass' : 'Fail'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900">
                            <td className="border border-slate-800 py-2 px-3 uppercase">Aggregate Total</td>
                            <td colSpan={2} className="border border-slate-800 py-2 px-1 text-center font-mono text-[10px] text-slate-400 italic">Weighted Combination</td>
                            <td className="border border-slate-800 py-2 px-1 text-center font-mono text-sm bg-emerald-50">{grandTotalObtained} / {maxGrandTotal}</td>
                            <td className="border border-slate-800 py-2 px-1 text-center"></td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="border border-slate-300 p-2 text-center rounded">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Final Percentage</p>
                        <p className="text-lg font-mono font-bold text-slate-800">{percentage}%</p>
                    </div>
                    <div className="border border-slate-300 p-2 text-center rounded">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Grade Achieved</p>
                        <p className="text-lg font-black text-emerald-900">{grade}</p>
                    </div>
                    <div className="border border-slate-300 p-2 text-center rounded">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Final Status</p>
                        <p className={`text-lg font-bold uppercase ${grade === 'F' ? 'text-red-600' : 'text-emerald-800'}`}>
                            {grade === 'F' ? 'Fail' : 'Pass'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-16 pb-4">
                    <div className="text-center">
                        <div className="border-b border-slate-800 mb-1"></div>
                        <p className="font-bold text-slate-800 uppercase text-[9px]">Class In-Charge</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-slate-800 mb-1"></div>
                        <p className="font-bold text-slate-800 uppercase text-[9px]">Authorized Signature</p>
                    </div>
                </div>
                
                <div className="mt-4 text-center text-[8px] text-slate-400 uppercase tracking-widest border-t pt-2">
                    Official Academic Record • {SCHOOL_NAME} • {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
  };

  const renderResultView = (sem: 1 | 2) => {
    const result = sem === 1 ? student.results.sem1 : student.results.sem2;
    const hasResult = !!result;
    const weightage = sem === 1 ? 0.45 : 0.55;

    if (isEditingMarks && ((sem === 1 && activeTab === 'sem1') || (sem === 2 && activeTab === 'sem2'))) {
      return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg">
                    <PenTool size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Semester {sem} Assessment</h3>
                    <p className="text-sm text-slate-500">Weighted impact: {weightage * 100}%</p>
                </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {SUBJECTS.map(sub => (
               <div key={sub} className="group flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all focus-within:ring-2 focus-within:ring-emerald-900/20 focus-within:border-emerald-900">
                 <div className="flex flex-col">
                    <label className="font-semibold text-slate-700 text-sm group-hover:text-emerald-900 transition-colors">{sub}</label>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Obtained Score</span>
                 </div>
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
             <button onClick={() => setIsEditingMarks(false)} className="w-full sm:w-auto px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Cancel</button>
             <button onClick={() => saveMarks(sem)} className="w-full sm:w-auto px-8 py-3 bg-emerald-900 text-white hover:bg-emerald-950 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/30 font-semibold transition-all hover:-translate-y-0.5 border-b-2 border-amber-400">
               <Save size={18} className="mr-2" /> Commit Records
             </button>
           </div>
        </div>
      );
    }

    if (!hasResult) {
       return (
         <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed hover:border-emerald-900/30 transition-colors group cursor-pointer" onClick={() => initMarks(sem)}>
            <div className="w-20 h-20 bg-emerald-50 group-hover:bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <BookOpen size={36} className="text-emerald-800 group-hover:text-emerald-900 transition-colors" />
            </div>
            <h3 className="text-slate-800 font-bold text-xl mb-2">No Records for Semester {sem}</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Input actual marks to see weighted conversions and AI-driven guidance.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); initMarks(sem); }}
              className="px-8 py-3 bg-emerald-900 text-white rounded-xl hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/20 font-semibold border-b-2 border-amber-400"
            >
              Start Marking
            </button>
         </div>
       );
    }

    const totalRaw = (Object.values(result.marks) as number[]).reduce((a, b) => a + b, 0);
    const weightedSum = Math.round(totalRaw * weightage);
    const maxPossibleRaw = SUBJECTS.length * 100;
    const maxPossibleWeighted = Math.round(maxPossibleRaw * weightage);
    const percentage = ((totalRaw / maxPossibleRaw) * 100).toFixed(1);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-white border-2 border-amber-400 flex flex-col items-center justify-center text-emerald-900 shadow-sm">
                <span className="text-[10px] font-black uppercase leading-none">Weight</span>
                <span className="text-xl font-black">{weightage * 100}%</span>
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">Semester {sem} Results</h3>
                <p className="text-slate-500 text-sm mt-0.5">Calculated weighting for annual aggregation</p>
             </div>
           </div>
           <div className="flex gap-2 no-print">
             <button onClick={() => initMarks(sem)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:border-emerald-900 hover:text-emerald-900 rounded-lg transition-colors text-sm font-semibold shadow-sm">Update Data</button>
           </div>
        </div>

        <div className="p-6 md:p-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Raw Total Score</p>
                    <p className="text-2xl font-black text-slate-800">{totalRaw} <span className="text-sm font-medium text-slate-400">/ {maxPossibleRaw}</span></p>
                    <p className="text-xs font-semibold text-emerald-900 mt-1">{percentage}% Average</p>
                </div>
                <div className="bg-emerald-900 p-4 rounded-xl shadow-lg shadow-emerald-900/20 text-white border-b-4 border-amber-400">
                    <p className="text-[10px] uppercase font-bold text-amber-200 mb-1">Weighted Component</p>
                    <p className="text-2xl font-black">{weightedSum} <span className="text-sm font-medium text-emerald-200">/ {maxPossibleWeighted}</span></p>
                    <p className="text-xs font-semibold text-emerald-100 mt-1">Rounded final value</p>
                </div>
           </div>

           <div className="overflow-hidden rounded-xl border border-slate-200 mb-8 shadow-sm">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                 <tr>
                   <th className="py-4 pl-6 text-left font-bold">Subject</th>
                   <th className="py-4 text-center font-bold">Raw (100)</th>
                   <th className="py-4 pr-6 text-right font-bold">Weighted Contribution</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {SUBJECTS.map(sub => (
                   <tr key={sub} className="hover:bg-slate-50/50">
                     <td className="py-3 pl-6 text-slate-800 font-bold">{sub}</td>
                     <td className="py-3 text-center text-slate-500 font-mono">{result.marks[sub]}</td>
                     <td className="py-3 pr-6 text-right font-black text-emerald-900 font-mono text-base">{Math.round(result.marks[sub] * weightage)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-100">
             <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h4 className="font-bold text-slate-800 flex items-center">
                    <Sparkles size={18} className="text-amber-500 mr-2 fill-amber-500" />
                    Performance Feedback
                </h4>
                {!result.generatedInsight && (
                    <button 
                    onClick={() => generateAIInsight(sem)} 
                    disabled={isGenerating}
                    className="no-print flex items-center text-xs font-bold bg-white text-emerald-900 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all border border-emerald-100"
                    >
                    <Sparkles size={14} className="mr-1.5" />
                    {isGenerating ? "Analyzing..." : "AI Review"}
                    </button>
                )}
             </div>
             <div className="text-slate-700 text-sm leading-relaxed p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white italic">
               {result.generatedInsight || result.remarks || "Enter student marks to view weighted calculations and generated feedback."}
             </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-8 no-print">
        <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all shadow-sm">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{student.name}</h1>
            <p className="text-slate-500 text-sm font-medium">Personal Profile & Analytics</p>
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 no-print w-full md:w-fit overflow-x-auto whitespace-nowrap gap-2">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Profile</button>
        <button onClick={() => setActiveTab('attendance')} className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-white text-emerald-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Attendance</button>
        <button onClick={() => setActiveTab('sem1')} className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sem1' ? 'bg-white text-emerald-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Sem 1 (45%)</button>
        <button onClick={() => setActiveTab('sem2')} className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sem2' ? 'bg-white text-emerald-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Sem 2 (55%)</button>
        <button onClick={() => setActiveTab('dmc')} className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dmc' ? 'bg-white text-emerald-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Transcript</button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-800">Student Profile</h2>
             <span className="px-4 py-1.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-200">Class {student.grade}</span>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Admission ID</label>
              <div className="text-lg text-slate-900 font-bold font-mono">{student.registrationNo || '-'}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Roll No</label>
              <div className="text-lg text-slate-900 font-bold font-mono">{student.serialNo}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Student Name</label>
              <div className="text-lg text-slate-900 font-bold uppercase">{student.name}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Gender</label>
              <div className="text-lg text-slate-900 font-bold uppercase">{student.gender}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Guardian Name</label>
              <div className="text-lg text-slate-900 font-semibold uppercase">{student.fatherName}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Identity (Form B)</label>
              <div className="text-lg text-slate-900 font-bold font-mono tracking-tighter">{student.formB}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Birth Date</label>
              <div className="text-lg text-slate-900 font-semibold">{student.dob}</div>
            </div>
            <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-slate-100 mt-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-2 block">Parent Contact (Tap to Call)</label>
              <a href={`tel:${student.contact}`} className="inline-flex items-center gap-3 text-3xl text-emerald-900 font-black font-mono hover:text-emerald-950 transition-colors group">
                 <Phone size={28} className="group-hover:animate-bounce" /> {student.contact}
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && renderAttendance()}
      {activeTab === 'sem1' && renderResultView(1)}
      {activeTab === 'sem2' && renderResultView(2)}
      {activeTab === 'dmc' && renderDMC()}
    </div>
  );
};