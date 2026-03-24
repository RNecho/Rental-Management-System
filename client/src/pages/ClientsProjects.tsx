import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { Plus, Building, MapPin, Briefcase, User, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, insertProjectSchema } from "@shared/schema";
import { z } from "zod";

export default function ClientsProjects() {
  const [activeTab, setActiveTab] = useState<'clients' | 'projects'>('clients');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Clientes e Obras</h1>
          <p className="text-slate-500">Gerencie relacionamentos com clientes e canteiros de obras.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
            <button 
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'clients' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Clientes
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'projects' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Obras
            </button>
          </div>
          <button 
            onClick={() => activeTab === 'clients' ? setIsClientModalOpen(true) : setIsProjectModalOpen(true)}
            className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'clients' ? 'Adicionar Cliente' : 'Adicionar Obra'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'clients' ? <ClientsList /> : <ProjectsList />}
      </div>

      <CreateClientDialog isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
      <CreateProjectDialog isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
    </Layout>
  );
}

function ClientsList() {
  const { data: clients, isLoading } = useClients();

  if (isLoading) return <div className="p-12 text-center text-slate-500">Carregando clientes...</div>;
  if (!clients?.length) return <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">Nenhum cliente cadastrado. Adicione um para começar.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map(client => (
        <div key={client.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{client.cnpj}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{client.name}</h3>
          <div className="space-y-2 text-sm text-slate-500">
            {client.phone && <div className="flex items-center"><Phone className="w-4 h-4 mr-2 opacity-70" /> {client.phone}</div>}
            {client.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70" /> {client.email}</div>}
            {client.address && <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 opacity-70" /> {client.address}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsList() {
  const { data: projects, isLoading } = useProjects();
  const { data: clients } = useClients();

  if (isLoading) return <div className="p-12 text-center text-slate-500">Carregando obras...</div>;

  const getClientName = (id: number) => clients?.find(c => c.id === id)?.name || 'Cliente desconhecido';

  return (
    <div className="space-y-4">
      {projects?.map(project => (
        <div key={project.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-amber-200 transition-colors group">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${project.active ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                {!project.active && <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">Arquivada</span>}
              </div>
              <p className="text-sm text-slate-500 flex items-center mb-1">
                <span className="font-medium text-slate-700 mr-2">{getClientName(project.clientId)}</span>
                • <MapPin className="w-3 h-3 mx-1" /> {project.address}
              </p>
              {project.manager && <p className="text-xs text-slate-400 flex items-center"><User className="w-3 h-3 mr-1" /> Responsável: {project.manager}</p>}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <button className="text-sm font-medium text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver Estoque →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateClientDialog({ isOpen, onClose }: any) {
  const createClient = useCreateClient();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof insertClientSchema>>({
    resolver: zodResolver(insertClientSchema)
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Novo Cliente</h3>
        </div>
        <form onSubmit={handleSubmit(data => createClient.mutate(data, { onSuccess: onClose }))} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Razão Social</label>
            <input {...register("name")} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Construtora Exemplo Ltda" />
            {errors.name && <p className="text-rose-500 text-xs">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">CNPJ</label>
            <input {...register("cnpj")} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="00.000.000/0001-00" />
            {errors.cnpj && <p className="text-rose-500 text-xs">{errors.cnpj.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <input {...register("email")} className="w-full mt-1 px-3 py-2 border rounded-lg" />
             </div>
             <div>
              <label className="text-sm font-medium text-slate-700">Telefone</label>
              <input {...register("phone")} className="w-full mt-1 px-3 py-2 border rounded-lg" />
             </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Endereço</label>
            <input {...register("address")} className="w-full mt-1 px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={createClient.isPending} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">
              {createClient.isPending ? "Salvando..." : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateProjectDialog({ isOpen, onClose }: any) {
  const { data: clients } = useClients();
  const createProject = useCreateProject();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof insertProjectSchema>>({
    resolver: zodResolver(insertProjectSchema)
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Nova Obra</h3>
        </div>
        <form onSubmit={handleSubmit(data => createProject.mutate(data, { onSuccess: onClose }))} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Cliente</label>
            <select {...register("clientId", { valueAsNumber: true })} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
              <option value="">Selecione o cliente...</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p className="text-rose-500 text-xs">{errors.clientId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Nome da Obra</label>
            <input {...register("name")} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Edifício Centro Fase 1" />
            {errors.name && <p className="text-rose-500 text-xs">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Endereço da Obra</label>
            <input {...register("address")} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Rua Principal, 123" />
            {errors.address && <p className="text-rose-500 text-xs">{errors.address.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Responsável pela Obra</label>
            <input {...register("manager")} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="João Silva" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={createProject.isPending} className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
              {createProject.isPending ? "Criando..." : "Criar Obra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
