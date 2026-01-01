import React from 'react';
import { StudentRecord, GRADES } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Users, TrendingUp, Trophy, CalendarCheck, ShieldCheck } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

interface DashboardProps {
  students: StudentRecord[];
  session: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, session }) => {
  const gradeDistribution = GRADES.map(grade => ({
    name: `Class ${grade}`,
    value: students.filter(s => s.grade === grade).length
  }));

  const totalStudents = students.length;
  
  const performanceData = GRADES.map(grade => {
    const studentsInGrade = students.filter(s => s.grade === grade);
    let totalScore = 0;
    let studentCount = 0;
    
    studentsInGrade.forEach(s => {
      if (s.results.sem1) {
        const marks = Object.values(s.results.sem1.marks) as number[];
        const avg = marks.reduce((a: number, b: number) => a + b, 0) / marks.length;
        totalScore += avg;
        studentCount++;
      }
    });

    return {
      grade: `G${grade}`,
      avgScore: studentCount > 0 ? Math.round(totalScore / studentCount) : 0
    };
  });

  const overallAvg = performanceData.length > 0 
    ? Math.round(performanceData.reduce((acc, curr) => acc + curr.avgScore, 0) / performanceData.length)
    : 0;

  const today = new Date().toISOString().split('T')[0];
  let presentCount = 0;
  let totalMarked = 0;
  
  students.forEach(s => {
    if (s.attendance?.[today]) {
        totalMarked++;
        if(s.attendance[today] === 'P') presentCount++;
    }
  });
  
  const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl border-b-4 border-emerald-900 shadow-sm">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="text-emerald-900" size={24} />
                <h2 className="text-3xl font-black text-emerald-950 tracking-tight leading-tight">Institutional Overview</h2>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">School Management Information System</p>
        </div>
        <div className="flex gap-2">
            <div className="px-5 py-3 bg-emerald-900 rounded-2xl border-2 border-amber-400 text-xs font-black text-white shadow-xl flex items-center gap-3 uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                Session {session}
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center space-x-5 hover:border-emerald-900 transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-emerald-900 text-amber-400 rounded-2xl shadow-lg relative z-10 border border-amber-400/20">
            <Users size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</p>
            <h3 className="text-4xl font-black text-emerald-950">{totalStudents}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center space-x-5 hover:border-emerald-900 transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-emerald-900 text-amber-400 rounded-2xl shadow-lg relative z-10 border border-amber-400/20">
            <CalendarCheck size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presence Index</p>
            <h3 className="text-4xl font-black text-emerald-950">
               {totalMarked > 0 ? `${attendancePercentage}%` : '--'}
            </h3>
            <p className="text-[9px] text-emerald-800 font-black mt-1 uppercase tracking-tighter">
                {totalMarked > 0 ? `${presentCount} / ${totalMarked} Verified` : 'Pending Verification'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center space-x-5 hover:border-emerald-900 transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-emerald-900 text-amber-400 rounded-2xl shadow-lg relative z-10 border border-amber-400/20">
            <TrendingUp size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Avg</p>
            <h3 className="text-4xl font-black text-emerald-950">
              {overallAvg}%
            </h3>
            <p className="text-[9px] text-emerald-800 font-black mt-1 uppercase tracking-tighter">Based on S1 weighting</p>
          </div>
        </div>
        
         <div className="bg-emerald-950 p-6 rounded-3xl shadow-2xl text-white flex items-center space-x-5 relative overflow-hidden border-b-4 border-amber-500">
          <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mb-12"></div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10 border border-white/10">
            <Trophy size={28} className="text-amber-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-amber-200/50 uppercase tracking-widest mb-1">Leading Grade</p>
            <h3 className="text-3xl font-black text-white">Class 5</h3>
            <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => <div key={i} className="w-3 h-1 bg-amber-400 rounded-full"></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 h-[28rem] flex flex-col shadow-sm">
          <h3 className="text-lg font-black text-emerald-950 mb-8 flex items-center uppercase tracking-widest">
            <div className="w-2 h-6 bg-amber-500 rounded-full mr-4"></div>
            Grade Enrollment Profile
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#064e3b', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#064e3b', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                    cursor={{fill: '#f0fdf4'}}
                    contentStyle={{borderRadius: '20px', border: '1px solid #064e3b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                />
                <Bar dataKey="value" fill="#064e3b" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 h-[28rem] flex flex-col shadow-sm">
          <h3 className="text-lg font-black text-emerald-950 mb-8 flex items-center uppercase tracking-widest">
             <div className="w-2 h-6 bg-emerald-900 rounded-full mr-4"></div>
             Academic Score Distribution
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#064e3b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#064e3b" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#064e3b', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#064e3b', fontSize: 10, fontWeight: 800}} domain={[0, 100]} />
                <Tooltip 
                    contentStyle={{borderRadius: '20px', border: '1px solid #064e3b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                />
                <Area type="step" dataKey="avgScore" stroke="#064e3b" strokeWidth={5} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};