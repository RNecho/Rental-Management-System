import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useMovements, useCreateMovement } from "@/hooks/use-movements";
import { useProjects } from "@/hooks/use-projects";
import { useEquipments } from "@/hooks/use-equipments";
import { Truck, ArrowLeft, ArrowRight, Plus, X, Calendar, FileText } from "lucide-react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const createMovementSchema = api.movements.create.input;

export default function Movements() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  return (
    <Layout>
      {activeTab === 'list' ? (
        <MovementsList onCreateClick={() => setActiveTab('create')} />
      ) : (
        <CreateMovementForm onCancel={() => setActiveTab('list')} />
      )}
    </Layout>
  );
}

function MovementsList({ onCreateClick }: { onCreateClick: () => void }) {
  const { data: movements, isLoading } = useMovements();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Movimentações de Equipamentos</h1>
          <p className="text-slate-500">Acompanhe remessas e devoluções em todas as obras.</p>
        </div>
        <button 
          onClick={onCreateClick}
          className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Movimentação
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Obra / Cliente</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Nota Fiscal</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Itens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando movimentações...</td></tr>
              ) : movements?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma movimentação encontrada.</td></tr>
              ) : (
                movements?.map((move) => (
                  <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        move.type === 'OUT' 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {move.type === 'OUT' ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
                        {move.type === 'OUT' ? 'REMESSA' : 'DEVOLUÇÃO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {move.date && !isNaN(new Date(move.date).getTime()) 
                        ? format(new Date(move.date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{move.project?.name || 'Obra não encontrada'}</p>
                      <p className="text-xs text-slate-500">{move.project?.client?.name || '-'}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                      {move.invoiceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-900">{move.itemsCount || 0}</span> itens
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateMovementForm({ onCancel }: { onCancel: () => void }) {
  const { data: projects } = useProjects();
  const { data: equipments } = useEquipments();
  const createMovement = useCreateMovement();
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof createMovementSchema>>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      type: 'OUT',
      date: new Date().toISOString().split('T')[0] as any,
      items: [{ equipmentId: 0, quantity: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const movementType = watch("type");
  const activeEquipments = equipments || [];

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      date: new Date(data.date),
      items: data.items.map((i: any) => ({ ...i, equipmentId: Number(i.equipmentId), quantity: Number(i.quantity) }))
    };
    
    createMovement.mutate(formattedData, {
      onSuccess: onCancel
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Nova Movimentação</h2>
          <p className="text-slate-500">Registre uma remessa ou devolução de equipamentos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full md:col-span-2 flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  value="OUT" 
                  {...register("type")} 
                  className="peer sr-only" 
                />
                <div className="p-4 rounded-xl border-2 border-slate-200 peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all text-center">
                  <div className="font-bold text-slate-700 peer-checked:text-amber-700 mb-1">REMESSA (Para a Obra)</div>
                  <div className="text-xs text-slate-500">Envio de equipamento para uma obra</div>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  value="IN" 
                  {...register("type")} 
                  className="peer sr-only" 
                />
                <div className="p-4 rounded-xl border-2 border-slate-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center">
                  <div className="font-bold text-slate-700 peer-checked:text-blue-700 mb-1">DEVOLUÇÃO (Da Obra)</div>
                  <div className="text-xs text-slate-500">Recebimento de equipamento de uma obra</div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Obra</label>
              <select {...register("projectId", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">Selecione a obra...</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.address}</option>
                ))}
              </select>
              {errors.projectId && <p className="text-rose-500 text-xs mt-1">{errors.projectId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  {...register("date")} 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número da Nota Fiscal (NF)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  {...register("invoiceNumber")} 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  placeholder="ex: 12345"
                />
              </div>
            </div>
            
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
              <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Observações opcionais..." />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-900">Itens</h3>
            <button 
              type="button" 
              onClick={() => append({ equipmentId: 0, quantity: 1 })}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Item
            </button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Equipamento</label>
                  <select 
                    {...register(`items.${index}.equipmentId`, { valueAsNumber: true })} 
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="0">Selecione o equipamento...</option>
                    {activeEquipments.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.sku} - {e.name} 
                        {movementType === 'OUT' ? ` (Disp: ${e.available})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.equipmentId && <p className="text-rose-500 text-xs mt-1">Obrigatório</p>}
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    min="1" 
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                  {errors.items?.[index]?.quantity && <p className="text-rose-500 text-xs mt-1">Inválido</p>}
                </div>
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="mt-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {errors.items && <p className="text-rose-500 text-sm mt-4 text-center">{errors.items.message}</p>}
        </div>

        {createMovement.isError && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200">
            Erro: {createMovement.error.message}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={createMovement.isPending}
            className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {createMovement.isPending ? "Processando..." : "Confirmar Movimentação"}
          </button>
        </div>
      </form>
    </div>
  );
}
