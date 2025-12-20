import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useMaintenance, useCreateMaintenance, useCompleteMaintenance } from "@/hooks/use-maintenance";
import { useEquipments } from "@/hooks/use-equipments";
import { Wrench, CheckCircle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMaintenanceSchema } from "@shared/schema";
import { format } from "date-fns";

export default function Maintenance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: records, isLoading } = useMaintenance();
  const completeMaintenance = useCompleteMaintenance();

  const activeRecords = records?.filter(r => r.status === 'OPEN') || [];
  const completedRecords = records?.filter(r => r.status === 'COMPLETED') || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Maintenance & Repairs</h1>
          <p className="text-slate-500">Track equipment servicing status.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Issue
        </button>
      </div>

      <div className="space-y-8">
        {/* Active Repairs */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
            Active Repairs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRecords.length === 0 ? (
               <div className="col-span-full p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                 No active maintenance tickets.
               </div>
            ) : (
              activeRecords.map(record => (
                <div key={record.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wrench className="w-12 h-12 text-rose-500" />
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900">{record.equipment.name}</h3>
                    <p className="text-xs font-mono text-slate-400">{record.equipment.sku}</p>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      "{record.reason}"
                    </p>
                    <p className="text-xs text-slate-400">
                      Started: {record.startDate ? format(new Date(record.startDate), 'MMM dd, yyyy') : '-'}
                    </p>
                  </div>

                  <button 
                    onClick={() => completeMaintenance.mutate(record.id)}
                    disabled={completeMaintenance.isPending}
                    className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium text-sm flex items-center justify-center transition-colors border border-emerald-100"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        
        {/* History */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 text-opacity-70">History</h2>
           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-3 font-medium text-slate-600">Equipment</th>
                   <th className="px-6 py-3 font-medium text-slate-600">Reason</th>
                   <th className="px-6 py-3 font-medium text-slate-600">Date Range</th>
                   <th className="px-6 py-3 font-medium text-slate-600 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {completedRecords.map(record => (
                   <tr key={record.id} className="text-slate-500">
                     <td className="px-6 py-3 font-medium text-slate-700">{record.equipment.name}</td>
                     <td className="px-6 py-3">{record.reason}</td>
                     <td className="px-6 py-3 text-xs">
                       {record.startDate ? format(new Date(record.startDate), 'MMM dd') : ''} - 
                       {record.endDate ? format(new Date(record.endDate), 'MMM dd') : '...'}
                     </td>
                     <td className="px-6 py-3 text-right">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                         Completed
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>
      </div>

      <CreateMaintenanceDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </Layout>
  );
}

function CreateMaintenanceDialog({ isOpen, onClose }: any) {
  const { data: equipments } = useEquipments();
  const createMaintenance = useCreateMaintenance();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof insertMaintenanceSchema>>({
    resolver: zodResolver(insertMaintenanceSchema),
    defaultValues: { quantity: 1 }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 bg-rose-50">
          <h3 className="font-bold text-lg text-rose-900">Log Maintenance Issue</h3>
        </div>
        <form onSubmit={handleSubmit(data => createMaintenance.mutate(data, { onSuccess: onClose }))} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Equipment</label>
            <select {...register("equipmentId", { valueAsNumber: true })} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
              <option value="">Select equipment...</option>
              {equipments?.map(e => <option key={e.id} value={e.id}>{e.name} (Available: {e.available})</option>)}
            </select>
            {errors.equipmentId && <p className="text-rose-500 text-xs">{errors.equipmentId.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input type="number" min="1" {...register("quantity", { valueAsNumber: true })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            {errors.quantity && <p className="text-rose-500 text-xs">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Reason / Issue</label>
            <textarea {...register("reason")} rows={3} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Broken handle, needs motor replacement, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={createMaintenance.isPending} className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50">
              {createMaintenance.isPending ? "Logging..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
