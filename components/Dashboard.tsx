import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { GeneratedLessonPlan } from '../types';

interface DashboardProps {
  savedPlans: GeneratedLessonPlan[];
}

export const Dashboard: React.FC<DashboardProps> = ({ savedPlans }) => {
  
  // Prepare data for Subject Distribution Chart
  const subjectCount = savedPlans.reduce((acc, plan) => {
    const sub = plan.generalData.subject;
    acc[sub] = (acc[sub] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(subjectCount).map(key => ({
    name: key.length > 10 ? key.substring(0, 10) + '...' : key,
    full: key,
    count: subjectCount[key]
  }));

  // Prepare data for Grade Distribution (Pie Chart)
  const gradeCount = savedPlans.reduce((acc, plan) => {
    const gr = plan.generalData.grade;
    acc[gr] = (acc[gr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(gradeCount).map(key => ({
    name: key,
    value: gradeCount[key]
  }));

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium uppercase">Total Planes</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{savedPlans.length}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-indigo-100 text-sm font-medium uppercase">Próxima Clase</p>
          <p className="text-2xl font-bold mt-2">Matemáticas</p>
          <p className="text-indigo-200 text-sm">5to Grado • Mañana 8:00 AM</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium uppercase">Integración de Fe</p>
          <p className="text-4xl font-bold text-amber-500 mt-2">100%</p>
          <p className="text-xs text-slate-400">Planes con valores bíblicos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Subject Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Planes por Asignatura</h3>
          {savedPlans.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No hay datos disponibles. Crea un plan.
            </div>
          )}
        </div>

        {/* Grade Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por Grado</h3>
          {savedPlans.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No hay datos disponibles.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Historial Reciente</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Tema</th>
                        <th className="px-6 py-4">Asignatura</th>
                        <th className="px-6 py-4">Grado</th>
                        <th className="px-6 py-4">Valor Integrado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {savedPlans.length === 0 ? (
                         <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                Sin planes recientes
                            </td>
                         </tr>
                    ) : (
                        savedPlans.map(plan => (
                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{plan.generalData.contentConceptual}</td>
                                <td className="px-6 py-4 text-slate-600">{plan.generalData.subject}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-xs font-bold">
                                        {plan.generalData.grade}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{plan.faithIntegration.spiritualConcept}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};