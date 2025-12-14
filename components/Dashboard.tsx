import React from 'react';
import { StudentRecord, GRADES } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Users, GraduationCap, TrendingUp } from 'lucide-react';

interface DashboardProps {
  students: StudentRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ students }) => {
  
  const gradeDistribution = GRADES.map(grade => ({
    name: `Grade ${grade}`,
    value: students.filter(s => s.grade === grade).length
  }));

  const totalStudents = students.length;
  
  // Calculate average performance per grade for Semester 1 (approximate)
  const performanceData = GRADES.map(grade => {
    const studentsInGrade = students.filter(s => s.grade === grade);
    let totalScore = 0;
    let studentCount = 0;
    
    studentsInGrade.forEach(s => {
      if (s.results.sem1) {
        const marks = Object.values(s.results.sem1.marks);
        const avg = marks.reduce((a: number, b: number) => a + b, 0) / marks.length;
        totalScore += avg;
        studentCount++;
      }
    });

    return {
      grade: `Grade ${grade}`,
      avgScore: studentCount > 0 ? Math.round(totalScore / studentCount) : 0
    };
  });

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">School Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Grades</p>
            <h3 className="text-2xl font-bold text-slate-800">5</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Sem 1 Avg Score</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {Math.round(performanceData.reduce((acc, curr) => acc + curr.avgScore, 0) / 5)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold mb-4">Students per Grade</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold mb-4">Grade Performance (Sem 1 Avg)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="grade" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};