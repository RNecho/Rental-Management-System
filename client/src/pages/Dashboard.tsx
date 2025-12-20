import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Package, Truck, Wrench, AlertCircle, TrendingUp } from "lucide-react";
import { useEquipments } from "@/hooks/use-equipments";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useMovements } from "@/hooks/use-movements";
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
} from "recharts";

export default function Dashboard() {
  const { data: equipments, isLoading: loadingEquip } = useEquipments();
  const { data: maintenance, isLoading: loadingMaint } = useMaintenance();
  const { data: movements, isLoading: loadingMoves } = useMovements();

  const totalStock = equipments?.reduce((sum, item) => sum + item.totalStock, 0) || 0;
  const onSite = equipments?.reduce((sum, item) => sum + item.onSite, 0) || 0;
  const available = equipments?.reduce((sum, item) => sum + item.available, 0) || 0;
  const inMaintenance = equipments?.reduce((sum, item) => sum + item.inMaintenance, 0) || 0;

  const activeMaintenance = maintenance?.filter(m => m.status === 'OPEN').length || 0;

  const chartData = [
    { name: 'Available', value: available, color: '#94a3b8' }, // Slate 400
    { name: 'On Site', value: onSite, color: '#f59e0b' },      // Amber 500
    { name: 'In Repair', value: inMaintenance, color: '#ef4444' } // Red 500
  ];

  const recentMovements = movements?.slice(0, 5) || [];

  if (loadingEquip || loadingMaint || loadingMoves) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Operations Overview</h1>
        <p className="text-slate-500">Real-time equipment availability and movement tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Assets" 
          value={totalStock} 
          icon={Package} 
          trend="Total items in catalog"
        />
        <StatCard 
          title="Currently Rented" 
          value={onSite} 
          icon={Truck} 
          color="warning"
          trend={`${Math.round((onSite / (totalStock || 1)) * 100)}% utilization`}
        />
        <StatCard 
          title="Available Stock" 
          value={available} 
          icon={TrendingUp} 
          color="success"
          trend="Ready for dispatch"
        />
        <StatCard 
          title="In Maintenance" 
          value={activeMaintenance} 
          icon={Wrench} 
          color="danger"
          trend="Active repair tickets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold font-display mb-6">Inventory Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipments?.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sku" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                />
                <Bar name="On Site" dataKey="onSite" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar name="Available" dataKey="available" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut & Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold font-display mb-4">Asset Status</h3>
             <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 mt-2">
               {chartData.map(d => (
                 <div key={d.name} className="flex items-center text-xs text-slate-500">
                   <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: d.color }}></span>
                   {d.name}
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold font-display mb-4">Recent Movements</h3>
             <div className="space-y-4">
               {recentMovements.length === 0 && <p className="text-sm text-slate-400">No recent activity.</p>}
               {recentMovements.map(move => (
                 <div key={move.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                   <div className="flex items-center">
                     <div className={`p-2 rounded-lg mr-3 ${move.type === 'OUT' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                       {move.type === 'OUT' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                     </div>
                     <div>
                       <p className="text-sm font-semibold text-slate-800">
                         {move.project.name}
                       </p>
                       <p className="text-xs text-slate-500">
                         {new Date(move.date).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                   <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                     {move.itemsCount} Items
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
