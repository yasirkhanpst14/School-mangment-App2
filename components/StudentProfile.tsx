import React, { useState, useEffect } from 'react';
import { StudentRecord, SUBJECTS, Subject } from '../types';
import { SCHOOL_NAME } from '../constants';
import { 
  ArrowLeft, Save, Sparkles, Printer, FileText, User, Calendar, 
  CreditCard, Phone, Hash, BookOpen, PenTool, Award, 
  Trash2, Users, ShieldCheck
} from 'lucide-react';
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
  }, [initialTab, student.id]);

  const [tempMarks, setTempMarks] = useState<Record<Subject, string>>({} as any);
  
  const initMarks = (sem: 1 | 2) => {
    const currentRes = sem === 1 ? student.results.sem1 : student.results.sem2;
    const initial: Record<Subject, string> = {} as any;
    SUBJECTS.forEach(sub => {
      const val = currentRes?.marks[sub];
      initial[sub] = (val !== undefined && val !== null && val !== 0) ? val.toString() : '';
    });
    setTempMarks(initial);
    setIsEditingMarks(true);
  };

  const saveMarks = (sem: 1 | 2) => {
    const newResults = JSON.parse(JSON.stringify(student.results));
    const resultKey = sem === 1 ? 'sem1' : 'sem2';
    
    const marksToSave: Record<Subject, number> = {} as any;
    SUBJECTS.forEach(sub => {
      const val = tempMarks[sub];
      marksToSave[sub] = val === '' ? 0 : Number(val);
    });

    newResults[resultKey] = {
      semester: sem,
      marks: marksToSave,
      remarks: newResults[resultKey]?.remarks || '',
      generatedInsight: newResults[resultKey]?.generatedInsight || ''
    };

    onUpdate({ ...student, results: newResults });
    setIsEditingMarks(false);
  };

  const handleDeleteMarks = (sem: 1 | 2) => {
    if (confirm(`CRITICAL: This will permanently delete marks for Semester ${sem}. Continue?`)) {
      const updatedStudent = JSON.parse(JSON.stringify(student));
      if (sem === 1) delete updatedStudent.results.sem1;
      else delete updatedStudent.results.sem2;
      onUpdate(updatedStudent);
      setIsEditingMarks(false);
    }
  };

  const handleDeleteFullDMC = () => {
    if (confirm(`DANGER: Erasing entire academic history for ${student.name}. This cannot be undone.`)) {
      const updatedStudent = JSON.parse(JSON.stringify(student));
      updatedStudent.results = {};
      onUpdate(updatedStudent);
      setActiveTab('profile');
    }
  };

  const generateAIInsight = async (sem: 1 | 2) => {
    setIsGenerating(true);
    try {
        const insight = await generateStudentReport(student, sem);
        const updatedStudent = JSON.parse(JSON.stringify(student));
        const resultKey = sem === 1 ? 'sem1' : 'sem2';
        
        if (updatedStudent.results[resultKey]) {
            updatedStudent.results[resultKey].generatedInsight = insight;
            onUpdate(updatedStudent);
        }
    } catch (e) {
        alert("AI process failed.");
    }
    setIsGenerating(false);
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
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
                 <div>
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Attendance Register</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional presence log</p>
                 </div>
                 <div className="text-center bg-white px-6 py-2 rounded-xl border-2 border-emerald-900 shadow-sm">
                    <div className="text-2xl font-black text-emerald-950 leading-none">{percentage}%</div>
                    <div className="text-[9px] uppercase font-black text-emerald-600 tracking-widest mt-1">Presence</div>
                 </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50 border-b border-slate-200">
                 <div className="bg-emerald-900 p-4 rounded-xl text-center shadow-md">
                     <div className="text-2xl font-black text-white leading-none">{stats.p}</div>
                     <div className="text-[9px] uppercase font-black text-emerald-300 tracking-[0.2em] mt-1">Present</div>
                 </div>
                 <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-slate-200">
                     <div className="text-2xl font-black text-red-500 leading-none">{stats.a}</div>
                     <div className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] mt-1">Absent</div>
                 </div>
                 <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-slate-200">
                     <div className="text-2xl font-black text-amber-500 leading-none">{stats.l}</div>
                     <div className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] mt-1">Leave</div>
                 </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-6 custom-scrollbar">
                {dates.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {dates.map(date => (
                            <div key={date} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-emerald-900 transition-all group">
                                <div className="text-[10px] font-bold text-slate-600">{date}</div>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm ${
                                    records[date] === 'P' ? 'bg-emerald-900 text-white' :
                                    records[date] === 'A' ? 'bg-red-500 text-white' :
                                    'bg-amber-400 text-white'
                                }`}>
                                    {records[date]}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-300 font-bold uppercase text-[10px] tracking-widest">No entries found.</div>
                )}
            </div>
        </div>
    );
  };

  const renderDMC = () => {
    const sem1 = student.results.sem1;
    const sem2 = student.results.sem2;
    let grandTotalObtained = 0;
    const MAX_GRAND_TOTAL = SUBJECTS.length * 100;

    const subjectsData = SUBJECTS.map(sub => {
        const s1Raw = sem1?.marks[sub] || 0;
        const s2Raw = sem2?.marks[sub] || 0;
        const s1Weighted = s1Raw * 0.45;
        const s2Weighted = s2Raw * 0.55;
        const combined = Math.round(s1Weighted + s2Weighted);
        grandTotalObtained += combined;
        return { subject: sub, s1: s1Raw, s1W: s1Weighted.toFixed(1), s2: s2Raw, s2W: s2Weighted.toFixed(1), total: combined };
    });

    const percentage = Math.round((grandTotalObtained / MAX_GRAND_TOTAL) * 100);
    const p = Number(percentage);
    let grade = "F";
    if(p >= 80) grade = "A+";
    else if(p >= 70) grade = "A";
    else if(p >= 60) grade = "B";
    else if(p >= 50) grade = "C";
    else if(p >= 40) grade = "D";

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 no-print gap-4">
                <button 
                  onClick={handleDeleteFullDMC} 
                  className="flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-black text-[10px] uppercase border border-red-100"
                >
                    <Trash2 size={16} /> Reset Profile Results
                </button>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-3 px-8 py-3 bg-emerald-950 text-white rounded-xl hover:bg-black shadow-lg transition-all font-black border-b-4 border-amber-400 uppercase text-[10px] tracking-widest active:scale-95"
                  >
                      <Printer size={18} /> Export Transcript (PDF)
                  </button>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic text-center w-full">Choose "Save as PDF" and enable "Background Graphics"</p>
                </div>
            </div>

            <div id="dmc-print-area" className="border-[6px] border-emerald-950 p-8 md:p-12 max-w-[210mm] mx-auto bg-white relative shadow-xl overflow-hidden print:shadow-none print:border-[4px] print:p-10">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
                
                <div className="text-center border-b-[3px] border-emerald-950 pb-6 mb-8">
                    <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter mb-1">{SCHOOL_NAME}</h1>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <div className="h-px bg-emerald-950 flex-1 max-w-[80px]"></div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.3em]">Official Transcript</h2>
                        <div className="h-px bg-emerald-950 flex-1 max-w-[80px]"></div>
                    </div>
                    <div className="mt-3">
                        <span className="text-emerald-950 text-[10px] font-black uppercase tracking-[0.3em] bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                            Academic Session {session}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 text-[12px] font-bold">
                    <div className="flex flex-col border-b border-slate-200 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Student Name</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">{student.name}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-200 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Father's Name</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">{student.fatherName}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-200 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Class / Grade</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">Grade {student.grade}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-200 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Roll Number</span>
                        <span className="text-emerald-950 font-black text-3xl font-mono tracking-tighter">{student.serialNo}</span>
                    </div>
                </div>

                <table className="w-full text-[11px] border-collapse border-[3px] border-emerald-950 mb-10">
                    <thead>
                        <tr className="bg-emerald-950 text-white">
                            <th className="border border-emerald-900 py-4 px-6 text-left uppercase font-black tracking-widest text-[9px]">Subjects</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">S1 (45%)</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">S2 (55%)</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectsData.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="border border-emerald-950 py-3.5 px-6 font-black text-slate-800 uppercase tracking-tight">{row.subject}</td>
                                <td className="border border-emerald-950 py-3.5 px-2 text-center text-slate-500 font-mono font-black">{row.s1W}</td>
                                <td className="border border-emerald-950 py-3.5 px-2 text-center text-slate-500 font-mono font-black">{row.s2W}</td>
                                <td className="border border-emerald-950 py-3.5 px-2 text-center font-black text-emerald-950 text-base font-mono bg-emerald-100/10">{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-emerald-50 font-black text-emerald-950 border-t-[3px] border-emerald-950">
                            <td className="border border-emerald-950 py-5 px-6 uppercase tracking-[0.2em] text-[11px] font-black">Annual Aggregate</td>
                            <td colSpan={2} className="border border-emerald-950 py-5 px-2 text-right italic text-[10px] uppercase tracking-tighter pr-6 text-emerald-900 font-black opacity-40">Weighted Result</td>
                            <td className="border border-emerald-950 py-5 px-2 text-center font-mono text-2xl bg-emerald-100/50">{grandTotalObtained} / {MAX_GRAND_TOTAL}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-white border border-slate-200 p-5 text-center rounded-2xl shadow-sm">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-[0.2em]">Percentage</p>
                        <p className="text-3xl font-black text-slate-950 font-mono tracking-tighter">{percentage}%</p>
                    </div>
                    <div className="bg-emerald-950 border-2 border-amber-400 p-5 text-center rounded-2xl shadow-lg">
                        <p className="text-[10px] uppercase font-black text-amber-300 mb-2 tracking-[0.2em]">Grade</p>
                        <p className="text-4xl font-black text-white">{grade}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 text-center rounded-2xl shadow-sm">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-[0.2em]">Status</p>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${grade === 'F' ? 'text-red-600' : 'text-emerald-950'}`}>
                            {grade === 'F' ? 'FAIL' : 'PASS'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-24 mb-10">
                    <div className="text-center">
                        <div className="border-b-2 border-emerald-950 mb-3 w-full"></div>
                        <p className="font-black text-emerald-950 uppercase text-[10px] tracking-widest">Office Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b-2 border-emerald-950 mb-3 w-full"></div>
                        <p className="font-black text-emerald-950 uppercase text-[10px] tracking-widest">Principal's Seal</p>
                    </div>
                </div>
                
                <div className="text-center text-[9px] text-slate-300 uppercase tracking-[0.6em] font-black border-t border-slate-50 pt-8">
                    VERIFIED INSTITUTIONAL RECORD • {SCHOOL_NAME}
                </div>
            </div>
        </div>
    );
  };

  const renderResultView = (sem: 1 | 2) => {
    const result = sem === 1 ? student.results.sem1 : student.results.sem2;
    const hasResult = !!result;
    const weightage = sem === 1 ? 0.45 : 0.55;
    
    // Emerald theme applied to both semesters for visual consistency
    const theme = { bg: 'bg-emerald-950', border: 'border-emerald-100', text: 'text-emerald-900', accent: 'bg-emerald-50', primary: 'emerald' };

    if (isEditingMarks) {
      return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-400">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 ${theme.bg} text-white rounded-xl shadow-lg`}>
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Semester {sem} Entry</h3>
                        <p className={`text-[9px] ${theme.text} font-black uppercase tracking-widest mt-1.5`}>Weightage: {Math.round(weightage * 100)}% of Final Result</p>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400 border border-slate-200">Scale: 100 Max</div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {SUBJECTS.map(sub => (
               <div key={sub} className={`group flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-${theme.primary}-500/5 focus-within:border-${theme.primary}-600`}>
                 <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-600 text-[10px] uppercase tracking-widest group-hover:text-emerald-900 transition-colors">{sub}</label>
                    <BookOpen size={14} className="text-slate-300 group-hover:text-emerald-900" />
                 </div>
                 <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-center focus:outline-none font-black text-xl text-slate-900 shadow-sm transition-all"
                    placeholder="--"
                    value={tempMarks[sub]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTempMarks({...tempMarks, [sub]: e.target.value})}
                 />
               </div>
             ))}
           </div>
           
           <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
             <button onClick={() => setIsEditingMarks(false)} className="px-8 py-2.5 text-slate-400 hover:text-slate-900 rounded-lg font-black uppercase text-[10px] tracking-widest transition-colors">Cancel</button>
             <button onClick={() => saveMarks(sem)} className={`px-10 py-2.5 ${theme.bg} text-white rounded-lg flex items-center justify-center shadow-lg font-black uppercase text-[10px] tracking-widest border-b-4 border-black/20 active:translate-y-0.5`}>
               <Save size={16} className="mr-2.5" /> Synchronize Records
             </button>
           </div>
        </div>
      );
    }

    if (!hasResult) {
       return (
         <div className="text-center py-16 bg-white rounded-2xl border-2 border-slate-100 border-dashed hover:border-emerald-950/20 transition-all group cursor-pointer" onClick={() => initMarks(sem)}>
            <div className="w-16 h-16 bg-slate-50 group-hover:bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
                <FileText size={32} className="text-slate-200 group-hover:text-emerald-900" />
            </div>
            <h3 className="text-slate-950 font-black text-xl mb-3 uppercase tracking-tight">Semester {sem} Data Incomplete</h3>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto font-bold uppercase text-[9px] tracking-widest leading-loose">Academic log is pending. This semester accounts for {Math.round(weightage * 100)}% of the aggregate.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); initMarks(sem); }}
              className={`px-10 py-3 ${theme.bg} text-white rounded-xl hover:brightness-110 transition-all shadow-lg font-black uppercase text-[10px] tracking-widest border-b-4 border-black/20 active:translate-y-0.5`}
            >
              Start Academic Entry
            </button>
         </div>
       );
    }

    const totalRaw = (Object.values(result.marks) as number[]).reduce((a, b) => a + b, 0);
    const weightedSum = Math.round(totalRaw * weightage);
    const maxPossibleRaw = SUBJECTS.length * 100;
    const maxPossibleWeighted = Math.round(maxPossibleRaw * weightage);
    // Rounded off percentage
    const percentageRounded = Math.round((totalRaw / maxPossibleRaw) * 100);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-6">
           <div className="flex items-center gap-6">
             <div className={`w-20 h-20 rounded-2xl ${theme.bg} border-2 border-white/20 flex flex-col items-center justify-center text-white shadow-xl`}>
                <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Impact</span>
                <span className="text-2xl font-black mt-0.5">{Math.round(weightage * 100)}%</span>
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Semester {sem} Summary</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest bg-emerald-100 text-emerald-900 border-emerald-200`}>
                    Verified Academic Log
                  </span>
                </div>
             </div>
           </div>
           <div className="flex gap-2 no-print w-full md:w-auto">
             <button onClick={() => handleDeleteMarks(sem)} className="flex-1 md:flex-none p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Delete Marks">
                <Trash2 size={20} />
             </button>
             <button onClick={() => initMarks(sem)} className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-emerald-950 hover:text-emerald-950 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
               Modify Grades
             </button>
           </div>
        </div>

        <div className="p-6 md:p-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner group">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-3 tracking-widest">Total Raw Score</p>
                    <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{totalRaw} <span className="text-sm font-bold text-slate-300">/ {maxPossibleRaw}</span></p>
                    <div className="mt-5 flex items-center gap-4">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className={`${theme.bg} h-full transition-all duration-700`} style={{width: `${percentageRounded}%`}}></div>
                        </div>
                        <span className="text-[12px] font-black text-slate-900 font-mono">{percentageRounded}%</span>
                    </div>
                </div>
                <div className={`${theme.bg} p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group border-b-4 border-black/20`}>
                    <p className="text-[10px] uppercase font-black text-white/50 mb-3 tracking-widest">Weighted Score</p>
                    <p className="text-5xl font-black font-mono tracking-tighter">{weightedSum} <span className="text-sm font-bold text-white/20">/ {maxPossibleWeighted}</span></p>
                    <p className="text-[9px] font-black text-white/40 mt-5 uppercase tracking-widest flex items-center gap-2">
                        <Award size={16} className="text-white/60" />
                        GPA Segment Finalized
                    </p>
                </div>
           </div>

           <div className="overflow-hidden rounded-xl border border-slate-100 mb-8 shadow-sm">
             <table className="w-full text-xs">
               <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase tracking-widest text-slate-400 font-black">
                 <tr>
                   <th className="py-4 pl-8 text-left">Academic Portfolio</th>
                   <th className="py-4 text-center">Raw (100)</th>
                   <th className="py-4 pr-8 text-right">Weighted ({Math.round(weightage * 100)}%)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {SUBJECTS.map(sub => (
                   <tr key={sub} className="hover:bg-slate-50 transition-all">
                     <td className="py-4 pl-8 text-slate-800 font-black uppercase tracking-tight">{sub}</td>
                     <td className="py-4 text-center text-slate-400 font-mono font-black text-base">{result.marks[sub]}</td>
                     <td className={`py-4 pr-8 text-right font-black text-emerald-950 font-mono text-lg`}>{Math.round(result.marks[sub] * weightage)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className={`${theme.accent} p-6 rounded-xl border border-${theme.primary}-100 shadow-inner group`}>
             <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h4 className={`font-black uppercase tracking-widest text-[9px] flex items-center ${theme.text}`}>
                    <Sparkles size={18} className="text-amber-500 mr-3" />
                    AI Academic Narrative
                </h4>
                {!result.generatedInsight && (
                    <button 
                        onClick={() => generateAIInsight(sem)} 
                        disabled={isGenerating}
                        className={`no-print flex items-center text-[9px] font-black ${theme.bg} text-white px-6 py-2 rounded-lg shadow-lg hover:brightness-110 transition-all uppercase tracking-widest border-b-2 border-black/20 disabled:opacity-50`}
                    >
                        <Sparkles size={14} className="mr-2" />
                        {isGenerating ? "Synthesizing..." : "Generate AI Insight"}
                    </button>
                )}
             </div>
             <div className="text-slate-800 text-sm leading-relaxed p-6 bg-white/80 backdrop-blur rounded-lg border border-white italic font-bold shadow-sm text-center">
               {result.generatedInsight || result.remarks || "No automated assessment found. Initiate AI review for a personalized performance narrative."}
             </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 animate-in slide-in-from-right duration-500 overflow-x-hidden pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-950"></div>
        <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-950 hover:text-white transition-all shadow-sm active:translate-y-0.5 group">
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2.5">
                    <span className="text-emerald-950 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">Admission: {student.registrationNo}</span>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Roll: {student.serialNo}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="px-6 py-2.5 bg-emerald-950 text-white rounded-lg text-[10px] font-black uppercase tracking-widest border-b-4 border-amber-400 shadow-md">Grade {student.grade}</div>
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 no-print w-full overflow-x-auto whitespace-nowrap gap-2 shadow-inner">
        {[
            { id: 'profile', label: 'Biography' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'sem1', label: 'Semester 1' },
            { id: 'sem2', label: 'Semester 2' },
            { id: 'dmc', label: 'Transcript' }
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsEditingMarks(false); }} 
                className={`flex-1 min-w-[140px] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                    activeTab === tab.id 
                    ? 'bg-white text-emerald-950 shadow-md border-b-4 border-emerald-900' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-emerald-950 text-white rounded-2xl shadow-lg border border-white/10">
                    <User size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Biometric Identity</h2>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1.5">Official Institutional Enrollment</p>
                </div>
             </div>
             <span className="px-8 py-2 bg-emerald-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Class {student.grade}</span>
          </div>
          
          <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
                {label: "Admission ID", val: student.registrationNo || 'UNSET', mono: true, icon: Hash},
                {label: "Roll Number", val: student.serialNo, mono: true, icon: PenTool},
                {label: "Full Name", val: student.name, icon: User},
                {label: "Gender", val: student.gender, icon: Users},
                {label: "Father Name", val: student.fatherName, icon: ShieldCheck},
                {label: "Identity (Form B)", val: student.formB, mono: true, icon: CreditCard},
                {label: "Date of Birth", val: student.dob, icon: Calendar},
            ].map((item, idx) => (
                <div key={idx} className="space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-50 transition-all hover:border-emerald-100 shadow-sm group">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-2.5">
                        <item.icon size={14} className="text-emerald-900" />
                        {item.label}
                    </label>
                    <div className={`text-xl text-emerald-950 font-black uppercase tracking-tight leading-tight ${item.mono ? 'font-mono' : ''}`}>{item.val}</div>
                </div>
            ))}

            <div className="md:col-span-2 lg:col-span-3 pt-10 border-t border-slate-50 mt-6">
              <label className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-10 block text-center">Primary Emergency Access</label>
              <div className="flex flex-col items-center">
                  <a href={`tel:${student.contact}`} className="inline-flex flex-col items-center gap-8 group">
                    <div className="p-8 bg-emerald-950 text-white rounded-2xl group-hover:scale-105 transition-all shadow-xl border-2 border-amber-400">
                        <Phone size={44} className="group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="text-4xl text-emerald-950 font-black font-mono tracking-widest">
                        {student.contact}
                    </div>
                  </a>
                  <div className="mt-8 flex gap-3 items-center bg-emerald-100/50 px-8 py-2 rounded-full border border-emerald-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Active Communication Link</span>
                  </div>
              </div>
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