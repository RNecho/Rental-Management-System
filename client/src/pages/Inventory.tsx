import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useEquipments, useCreateEquipment } from "@/hooks/use-equipments";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEquipmentSchema } from "@shared/schema";

export default function Inventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: equipments, isLoading } = useEquipments();
  const createEquipment = useCreateEquipment();

  const filteredEquipments = equipments?.filter(
    (item) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Equipment Inventory</h1>
          <p className="text-slate-500">Manage asset catalog and stock levels.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">SKU</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Equipment Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">On Site</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Maint.</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading inventory...</td></tr>
              ) : filteredEquipments?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No equipment found.</td></tr>
              ) : (
                filteredEquipments?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center mr-3 text-slate-400">
                        <Package className="w-4 h-4" />
                      </div>
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{item.totalStock}</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-medium">{item.onSite}</td>
                    <td className="px-6 py-4 text-right text-rose-600">{item.inMaintenance > 0 ? item.inMaintenance : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.available > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.available}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <CreateEquipmentDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onSubmit={(data) => {
            createEquipment.mutate(data, {
              onSuccess: () => setIsDialogOpen(false)
            });
          }}
          isPending={createEquipment.isPending}
        />
      )}
    </Layout>
  );
}

function CreateEquipmentDialog({ isOpen, onClose, onSubmit, isPending }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof insertEquipmentSchema>>({
    resolver: zodResolver(insertEquipmentSchema),
    defaultValues: { totalStock: 0 }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Add New Equipment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><AlertTriangle className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
            <input {...register("sku")} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. DRILL-01" />
            {errors.sku && <p className="text-rose-500 text-xs mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input {...register("name")} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Heavy Duty Drill" />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Stock</label>
            <input type="number" {...register("totalStock", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0" />
            {errors.totalStock && <p className="text-rose-500 text-xs mt-1">{errors.totalStock.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea {...register("description")} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" rows={3} placeholder="Optional details..." />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
