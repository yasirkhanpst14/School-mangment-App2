import React, { useState, useEffect } from 'react';
import { StudentRecord, SUBJECTS, Subject } from '../types';
import { SCHOOL_NAME } from '../constants';
import { 
  ArrowLeft, Save, Sparkles, Printer, FileText, User, Calendar, 
  CreditCard, Phone, Hash, BookOpen, PenTool, Award, 
  CalendarCheck, Trash2, Users, ShieldCheck
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
  
  // Update activeTab only if initialTab changes from the outside (e.g. clicking "Marks" from list)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

    const percentage = ((grandTotalObtained / MAX_GRAND_TOTAL) * 100).toFixed(2);
    const p = Number(percentage);
    let grade = "F";
    if(p >= 80) grade = "A+";
    else if(p >= 70) grade = "A";
    else if(p >= 60) grade = "B";
    else if(p >= 50) grade = "C";
    else if(p >= 40) grade = "D";

    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
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
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Choose "Save as PDF" in print dialog</p>
                </div>
            </div>

            <div id="dmc-print-area" className="border-[8px] border-emerald-950 p-10 md:p-12 max-w-[210mm] mx-auto bg-white relative shadow-xl overflow-hidden print:shadow-none print:border-[4px]">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
                
                <div className="text-center border-b-[4px] border-emerald-950 pb-8 mb-10">
                    <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter mb-2">{SCHOOL_NAME}</h1>
                    <div className="flex items-center justify-center gap-6 mt-2">
                        <div className="h-px bg-emerald-950 flex-1 max-w-[100px]"></div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.4em]">Official Transcript</h2>
                        <div className="h-px bg-emerald-950 flex-1 max-w-[100px]"></div>
                    </div>
                    <div className="mt-4">
                        <span className="text-emerald-950 text-[10px] font-black uppercase tracking-[0.4em] bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                            Academic Session {session}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 text-[12px] font-bold">
                    <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Student Name</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">{student.name}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Father's Name</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">{student.fatherName}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Class / Grade</span>
                        <span className="text-slate-950 uppercase font-black text-lg tracking-tight">Grade {student.grade}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-[9px] text-emerald-900 uppercase tracking-widest font-black opacity-40 mb-1">Roll No</span>
                        <span className="text-emerald-950 font-black text-3xl font-mono tracking-tighter">{student.serialNo}</span>
                    </div>
                </div>

                <table className="w-full text-[11px] border-collapse border-[4px] border-emerald-950 mb-10">
                    <thead>
                        <tr className="bg-emerald-950 text-white">
                            <th className="border border-emerald-900 py-4 px-6 text-left uppercase font-black tracking-widest text-[9px]">Subjects</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">S1 (45%)</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">S2 (55%)</th>
                            <th className="border border-emerald-900 py-4 px-2 text-center uppercase font-black tracking-widest text-[9px] w-24">Combined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectsData.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="border border-emerald-950 py-3 px-6 font-black text-slate-800 uppercase tracking-tight text-sm">{row.subject}</td>
                                <td className="border border-emerald-950 py-3 px-2 text-center text-slate-500 font-mono font-black">{row.s1W}</td>
                                <td className="border border-emerald-950 py-3 px-2 text-center text-slate-500 font-mono font-black">{row.s2W}</td>
                                <td className="border border-emerald-950 py-3 px-2 text-center font-black text-emerald-950 text-base font-mono bg-emerald-100/10">{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-emerald-50 font-black text-emerald-950 border-t-[4px] border-emerald-950">
                            <td className="border border-emerald-950 py-5 px-6 uppercase tracking-[0.3em] text-[11px] font-black">Annual Aggregate</td>
                            <td colSpan={2} className="border border-emerald-950 py-5 px-2 text-right italic text-[10px] uppercase tracking-tighter pr-6 text-emerald-900 font-black opacity-40">Weighted Result</td>
                            <td className="border border-emerald-950 py-5 px-2 text-center font-mono text-2xl bg-emerald-100/50">{grandTotalObtained} / {MAX_GRAND_TOTAL}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-white border-2 border-slate-50 p-6 text-center rounded-2xl">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-[0.3em]">Aggregate %</p>
                        <p className="text-3xl font-black text-slate-950 font-mono tracking-tighter">{percentage}%</p>
                    </div>
                    <div className="bg-emerald-950 border-4 border-amber-400 p-6 text-center rounded-2xl shadow-xl">
                        <p className="text-[10px] uppercase font-black text-amber-300 mb-1 tracking-[0.3em]">Grade</p>
                        <p className="text-4xl font-black text-white">{grade}</p>
                    </div>
                    <div className="bg-white border-2 border-slate-50 p-6 text-center rounded-2xl">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-[0.3em]">Result</p>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${grade === 'F' ? 'text-red-600' : 'text-emerald-950'}`}>
                            {grade === 'F' ? 'FAIL' : 'PASS'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-32 mb-8">
                    <div className="text-center">
                        <div className="border-b-2 border-emerald-950 mb-3 w-full"></div>
                        <p className="font-black text-emerald-950 uppercase text-[10px] tracking-widest">Office Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b-2 border-emerald-950 mb-3 w-full"></div>
                        <p className="font-black text-emerald-950 uppercase text-[10px] tracking-widest">Principal's Seal</p>
                    </div>
                </div>
                
                <div className="text-center text-[9px] text-slate-300 uppercase tracking-[0.8em] font-black border-t border-slate-50 pt-8">
                    Verified Data • GPS No1 Bazar
                </div>
            </div>
        </div>
    );
  };

  const renderResultView = (sem: 1 | 2) => {
    const result = sem === 1 ? student.results.sem1 : student.results.sem2;
    const hasResult = !!result;
    const weightage = sem === 1 ? 0.45 : 0.55;
    const theme = { primary: 'emerald', bg: 'bg-emerald-950', border: 'border-emerald-100', text: 'text-emerald-900', accent: 'bg-emerald-50', focus: 'emerald-600', shadow: 'shadow-emerald-900/30' };

    if (isEditingMarks) {
      return (
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-500">
           <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className={`p-3 ${theme.bg} text-white rounded-xl shadow-lg`}>
                        <PenTool size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Semester {sem} Entry</h3>
                        <p className={`text-[10px] ${theme.text} font-black uppercase tracking-widest mt-2`}>Weighted contribution: {weightage * 100}%</p>
                    </div>
                </div>
                <div className="px-5 py-2 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-400 border border-slate-200">Max Score: 100</div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {SUBJECTS.map(sub => (
               <div key={sub} className="group flex flex-col gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-emerald-900/5 focus-within:border-emerald-900">
                 <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 text-xs uppercase tracking-widest group-hover:text-emerald-900 transition-colors">{sub}</label>
                    <BookOpen size={16} className="text-slate-300 group-hover:text-emerald-900" />
                 </div>
                 <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-center focus:outline-none font-black text-2xl text-emerald-950 shadow-sm transition-all"
                    placeholder="--"
                    value={tempMarks[sub]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTempMarks({...tempMarks, [sub]: e.target.value})}
                 />
               </div>
             ))}
           </div>
           
           <div className="mt-10 flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
             <button onClick={() => setIsEditingMarks(false)} className="w-full sm:w-auto px-10 py-3 text-slate-400 hover:text-slate-900 rounded-xl font-black uppercase text-[11px] tracking-widest transition-colors">Cancel</button>
             <button onClick={() => saveMarks(sem)} className="w-full sm:w-auto px-12 py-3 bg-emerald-950 text-white rounded-xl flex items-center justify-center shadow-lg font-black uppercase text-[11px] tracking-widest border-b-4 border-amber-400 active:scale-95">
               <Save size={20} className="mr-3" /> Save Assessment
             </button>
           </div>
        </div>
      );
    }

    if (!hasResult) {
       return (
         <div className="text-center py-20 bg-white rounded-3xl border-2 border-slate-100 border-dashed hover:border-emerald-950/20 transition-all group cursor-pointer" onClick={() => initMarks(sem)}>
            <div className="w-24 h-24 bg-slate-50 group-hover:bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner transition-transform group-hover:scale-105">
                <FileText size={40} className="text-slate-100 group-hover:text-emerald-900" />
            </div>
            <h3 className="text-slate-950 font-black text-2xl mb-4 uppercase tracking-tight">No Data for Semester {sem}</h3>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto font-bold uppercase text-[10px] tracking-widest leading-loose">Semester results account for {weightage * 100}% of the annual aggregate. Start evaluation now.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); initMarks(sem); }}
              className="px-12 py-4 bg-emerald-950 text-white rounded-xl hover:bg-black transition-all shadow-lg font-black uppercase text-[11px] tracking-widest border-b-4 border-amber-400 active:scale-95"
            >
              Begin Evaluation
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
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-8">
           <div className="flex items-center gap-8">
             <div className="w-24 h-24 rounded-2xl bg-emerald-950 border-2 border-amber-400 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Weight</span>
                <span className="text-3xl font-black mt-1">{weightage * 100}%</span>
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Semester {sem} Overview</h3>
                <div className="flex items-center gap-4 mt-3">
                  <p className="text-emerald-900 text-[9px] font-black uppercase tracking-widest bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200">Verified institutional Record</p>
                </div>
             </div>
           </div>
           <div className="flex gap-3 no-print w-full md:w-auto">
             <button onClick={() => handleDeleteMarks(sem)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 font-black uppercase text-[10px] tracking-widest active:scale-95">
                <Trash2 size={18} /> Wipe
             </button>
             <button onClick={() => initMarks(sem)} className="flex-1 md:flex-none px-8 py-3 bg-white border border-slate-200 text-slate-700 hover:border-emerald-950 hover:text-emerald-950 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95">
               Modify Data
             </button>
           </div>
        </div>

        <div className="p-8 md:p-10">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner group">
                    <p className="text-[11px] uppercase font-black text-slate-400 mb-4 tracking-widest">Cumulative Raw score</p>
                    <p className="text-5xl font-black text-slate-950 font-mono tracking-tighter">{totalRaw} <span className="text-lg font-bold text-slate-200">/ {maxPossibleRaw}</span></p>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-emerald-950 h-full transition-all duration-1000 shadow-xl" style={{width: `${percentage}%`}}></div>
                        </div>
                        <span className="text-[14px] font-black text-emerald-950 font-mono">{percentage}%</span>
                    </div>
                </div>
                <div className="bg-emerald-950 p-8 rounded-2xl shadow-xl text-white border-b-8 border-amber-400 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                    <p className="text-[11px] uppercase font-black text-amber-300 mb-4 tracking-widest">Weighted impact</p>
                    <p className="text-6xl font-black font-mono tracking-tighter">{weightedSum} <span className="text-lg font-bold text-white/10">/ {maxPossibleWeighted}</span></p>
                    <p className="text-[10px] font-black text-white/30 mt-6 uppercase tracking-widest flex items-center gap-3">
                        <Award size={20} className="text-amber-400 animate-pulse" />
                        GPA Segment Finalized
                    </p>
                </div>
           </div>

           <div className="overflow-hidden rounded-2xl border border-slate-100 mb-10 shadow-sm bg-white">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                 <tr>
                   <th className="py-6 pl-12 text-left">Academic Portfolio</th>
                   <th className="py-6 text-center">Raw (100)</th>
                   <th className="py-6 pr-12 text-right">Weighted ({weightage * 100}%)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {SUBJECTS.map(sub => (
                   <tr key={sub} className="hover:bg-emerald-50/20 transition-all group">
                     <td className="py-5 pl-12 text-slate-950 font-black uppercase tracking-tight group-hover:text-emerald-900 text-sm">{sub}</td>
                     <td className="py-5 text-center text-slate-400 font-mono font-black text-lg">{result.marks[sub]}</td>
                     <td className="py-5 pr-12 text-right font-black text-emerald-950 font-mono text-xl">{Math.round(result.marks[sub] * weightage)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 shadow-inner relative overflow-hidden group">
             <div className="flex flex-wrap justify-between items-center mb-8 gap-6 relative z-10">
                <h4 className="font-black text-emerald-950 uppercase tracking-widest text-[11px] flex items-center">
                    <Sparkles size={24} className="text-amber-500 mr-4 animate-pulse" />
                    AI Academic Review
                </h4>
                {!result.generatedInsight && (
                    <button 
                        onClick={() => generateAIInsight(sem)} 
                        disabled={isGenerating}
                        className="no-print flex items-center text-[10px] font-black bg-emerald-950 text-white px-8 py-3 rounded-xl shadow-lg hover:brightness-125 transition-all uppercase tracking-widest border-b-4 border-amber-400 disabled:opacity-50"
                    >
                        <Sparkles size={18} className="mr-3" />
                        {isGenerating ? "Synthesizing..." : "Generate AI Insight"}
                    </button>
                )}
             </div>
             <div className="text-slate-800 text-lg leading-relaxed p-10 bg-white/70 backdrop-blur-3xl rounded-xl border border-white italic font-bold shadow-sm relative z-10 text-center">
               {result.generatedInsight || result.remarks || "No automated commentary available. Initiate AI review for personalized assessment."}
             </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 animate-in slide-in-from-right duration-700 overflow-x-hidden pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 no-print bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-950"></div>
        <div className="flex items-center gap-8">
            <button onClick={onBack} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-950 hover:text-white transition-all shadow-sm active:scale-95 group">
                <ArrowLeft size={32} className="group-hover:-translate-x-2 transition-transform" />
            </button>
            <div>
                <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                    <span className="text-emerald-950 text-[10px] font-black uppercase tracking-widest bg-emerald-100/50 px-6 py-2 rounded-full border border-emerald-100">ID: {student.registrationNo}</span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Roll Number {student.serialNo}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="px-10 py-4 bg-emerald-950 text-white rounded-xl text-[12px] font-black uppercase tracking-widest border-b-4 border-amber-400 shadow-xl">Class Grade {student.grade}</div>
        </div>
      </div>

      <div className="flex p-2 bg-slate-100 rounded-2xl mb-14 no-print w-full overflow-x-auto whitespace-nowrap gap-3 shadow-inner">
        {[
            { id: 'profile', label: 'BIO Data' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'sem1', label: 'Semester 1' },
            { id: 'sem2', label: 'Semester 2' },
            { id: 'dmc', label: 'Transcript' }
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsEditingMarks(false); }} 
                className={`flex-1 min-w-[160px] px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-white text-emerald-950 shadow-lg scale-105 border-b-4 border-emerald-950' 
                    : 'text-slate-400 hover:text-slate-950 hover:bg-white/50'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
          <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-6">
                <div className="p-6 bg-emerald-950 text-white rounded-2xl shadow-xl border-2 border-amber-400">
                    <User size={36} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Biometric Identity</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Verified School Record</p>
                </div>
             </div>
             <span className="px-10 py-3 bg-emerald-950 text-white rounded-full text-[11px] font-black uppercase tracking-widest border-2 border-amber-400">Grade {student.grade}</span>
          </div>
          
          <div className="p-12 md:p-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
                {label: "Admission ID", val: student.registrationNo || 'UNSET', mono: true, icon: Hash},
                {label: "Roll Number", val: student.serialNo, mono: true, icon: PenTool},
                {label: "Full Name", val: student.name, icon: User},
                {label: "Gender", val: student.gender, icon: Users},
                {label: "Father Name", val: student.fatherName, icon: ShieldCheck},
                {label: "Identity Form B", val: student.formB, mono: true, icon: CreditCard},
                {label: "Date of Birth", val: student.dob, icon: Calendar},
            ].map((item, idx) => (
                <div key={idx} className="space-y-4 p-8 bg-slate-50 rounded-2xl border border-slate-50 hover:border-emerald-900 transition-all shadow-inner group">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-3">
                        <item.icon size={18} className="text-emerald-900 group-hover:scale-125 transition-transform" />
                        {item.label}
                    </label>
                    <div className={`text-2xl text-emerald-950 font-black uppercase tracking-tight leading-tight ${item.mono ? 'font-mono' : ''}`}>{item.val}</div>
                </div>
            ))}

            <div className="md:col-span-2 lg:col-span-3 pt-12 border-t border-slate-50 mt-10">
              <label className="text-[12px] uppercase tracking-[0.6em] text-slate-400 font-black mb-12 block text-center">Emergency Communication Matrix</label>
              <div className="flex flex-col items-center">
                  <a href={`tel:${student.contact}`} className="inline-flex flex-col items-center gap-10 group">
                    <div className="p-10 bg-emerald-950 text-white rounded-2xl group-hover:scale-105 transition-all shadow-2xl border-4 border-amber-400">
                        <Phone size={56} className="group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="text-6xl text-emerald-950 font-black font-mono tracking-widest group-hover:text-emerald-600 transition-colors">
                        {student.contact}
                    </div>
                  </a>
                  <div className="mt-12 flex gap-4 items-center bg-emerald-100/50 px-10 py-3 rounded-full border border-emerald-200">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-emerald-950">Active Hotline Access</span>
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