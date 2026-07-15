import { useState, useEffect, useRef, useCallback, memo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Upload, Plus, Trash2, Download, Eye, Search, Calendar, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface DocType {
  id: string;
  name: string;
  value: string;
}


const STATUS_OPTIONS = [
  { value: "vigente", label: "Vigente", color: "bg-green-100 text-green-800" },
  { value: "vencido", label: "Vencido", color: "bg-red-100 text-red-800" },
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
];

interface Doc {
  id: string;
  name: string;
  type: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

const AdminDocumentos = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", type: "", description: "", expiry_date: "", status: "vigente",
  });
  const [typeForm, setTypeForm] = useState({ name: "", value: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState<string | null>(null);


  const getSignedUrl = async (storagePath: string) => {
    const { data, error } = await supabase.storage.from("company-documents").createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) { toast.error("Erro ao gerar link do arquivo"); return null; }
    return data.signedUrl;
  };

  const handleViewFile = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    if (url) window.open(url, "_blank");
  };

  const handleDownloadFile = async (storagePath: string, fileName: string) => {
    const url = await getSignedUrl(storagePath);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    }
  };

  const loadTypes = async () => {
    const { data } = await supabase.from("document_types").select("*").order("name");
    setDocTypes((data as DocType[]) || []);
    if (data && data.length > 0 && !form.type) {
      setForm(prev => ({ ...prev, type: data[0].value }));
    }
  };

  const load = async () => {
    setLoading(true);
    await loadTypes();
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocs((data as Doc[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);


  const resetForm = () => {
    setForm({ name: "", type: "certificado", description: "", expiry_date: "", status: "vigente" });
    setSelectedFile(null);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setUploading(true);
    let file_url = editId ? docs.find(d => d.id === editId)?.file_url || null : null;
    let file_name = editId ? docs.find(d => d.id === editId)?.file_name || null : null;

    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-documents").upload(path, selectedFile);
      if (upErr) { toast.error("Erro no upload: " + upErr.message); setUploading(false); return; }
      // Store the storage path, not a public URL (bucket is private)
      file_url = path;
      file_name = selectedFile.name;
      file_name = selectedFile.name;
    }

    const payload = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      expiry_date: form.expiry_date || null,
      status: form.status,
      file_url,
      file_name,
    };

    if (editId) {
      const { error } = await supabase.from("documents").update(payload).eq("id", editId);
      if (error) toast.error(error.message); else toast.success("Documento atualizado!");
    } else {
      const { error } = await supabase.from("documents").insert(payload);
      if (error) toast.error(error.message); else toast.success("Documento cadastrado!");
    }

    setUploading(false);
    setDialogOpen(false);
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este documento?")) return;
    await supabase.from("documents").delete().eq("id", id);
    toast.success("Documento excluído");
    load();
  };

  const handleSaveType = async () => {
    if (!typeForm.name.trim() || !typeForm.value.trim()) {
      toast.error("Nome e valor são obrigatórios");
      return;
    }

    if (editTypeId) {
      const { error } = await supabase.from("document_types").update({
        name: typeForm.name,
        value: typeForm.value.toLowerCase().replace(/\s+/g, "_")
      }).eq("id", editTypeId);
      if (error) toast.error(error.message); else toast.success("Tipo de documento atualizado!");
    } else {
      const { error } = await supabase.from("document_types").insert({
        name: typeForm.name,
        value: typeForm.value.toLowerCase().replace(/\s+/g, "_")
      });
      if (error) toast.error(error.message); else toast.success("Tipo de documento cadastrado!");
    }

    setTypeForm({ name: "", value: "" });
    setEditTypeId(null);
    loadTypes();
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Excluir este tipo de documento?")) return;
    const { error } = await supabase.from("document_types").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir. Verifique se existem documentos usando este tipo.");
    else {
      toast.success("Tipo excluído");
      loadTypes();
    }
  };

  const openEdit = (doc: Doc) => {
    setForm({
      name: doc.name, type: doc.type, description: doc.description || "",
      expiry_date: doc.expiry_date || "", status: doc.status,
    });
    setEditId(doc.id);
    setSelectedFile(null);
    setDialogOpen(true);
  };


  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || d.type === filterType;
    return matchSearch && matchType;
  });

  const expiringSoon = docs.filter(d => {
    if (!d.expiry_date) return false;
    const diff = (new Date(d.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const expired = docs.filter(d => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < new Date();
  });

  const statusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find(o => o.value === status);
    return <Badge className={s?.color || ""}>{s?.label || status}</Badge>;
  };

  return (
    <AdminLayout title="Documentação">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <FileText className="text-primary" size={24} />
          <div><p className="text-2xl font-bold">{docs.length}</p><p className="text-xs text-muted-foreground">Total de Documentos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500" />
          <div><p className="text-2xl font-bold">{docs.filter(d => d.status === "vigente").length}</p><p className="text-xs text-muted-foreground">Vigentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="text-yellow-500" size={24} />
          <div><p className="text-2xl font-bold">{expiringSoon.length}</p><p className="text-xs text-muted-foreground">Vencendo em 30 dias</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-red-500" />
          <div><p className="text-2xl font-bold">{expired.length}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <Card className="mb-4 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="text-yellow-600" size={18} /><span className="font-semibold text-yellow-800">Documentos vencendo em breve:</span></div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {expiringSoon.map(d => <li key={d.id}>• {d.name} — vence em {new Date(d.expiry_date!).toLocaleDateString("pt-BR")}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar documentos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {docTypes.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
        </select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => setTypeDialogOpen(true)}>
              Gerenciar Tipos
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configurar categorias de documentos (ex: Alvará, Certidão)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus size={16} /> Novo Documento
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cadastrar e fazer upload de um novo documento</p>
          </TooltipContent>
        </Tooltip>
      </div>


      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum documento encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Validade</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Arquivo</th>
                <th className="text-right p-3">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{doc.name}</td>
                    <td className="p-3">{docTypes.find(t => t.value === doc.type)?.name || doc.type}</td>
                    <td className="p-3">{doc.expiry_date ? <span className="flex items-center gap-1"><Calendar size={14} />{new Date(doc.expiry_date).toLocaleDateString("pt-BR")}</span> : "—"}</td>
                    <td className="p-3">{statusBadge(doc.status)}</td>
                    <td className="p-3">{doc.file_url ? (
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleViewFile(doc.file_url!)}><Eye size={14} /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar documento em nova aba</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(doc.file_url!, doc.file_name || "documento")}><Download size={14} /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Baixar arquivo original</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>Editar</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar informações deste documento</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}><Trash2 size={14} className="text-destructive" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remover permanentemente</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Documento" : "Novo Documento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Alvará de Funcionamento 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {docTypes.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Validade</label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Observações opcionais" />
            </div>
            <div>
              <label className="text-sm font-medium">Arquivo (PDF, imagem, etc.)</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="w-full text-sm mt-1" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              {editId && !selectedFile && docs.find(d => d.id === editId)?.file_name && (
                <p className="text-xs text-muted-foreground mt-1">Arquivo atual: {docs.find(d => d.id === editId)?.file_name}</p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="w-full" onClick={handleSave} disabled={uploading}>
                  {uploading ? "Enviando..." : <><Upload size={16} /> {editId ? "Salvar Alterações" : "Cadastrar Documento"}</>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{editId ? "Confirmar alterações no documento" : "Finalizar cadastro e upload"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Types Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gerenciar Tipos de Documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input 
                  placeholder="Nome do Tipo (ex: Alvará)" 
                  value={typeForm.name} 
                  onChange={e => {
                    const val = e.target.value;
                    setTypeForm({ 
                      name: val, 
                      value: val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_") 
                    });
                  }} 
                />
              </div>
              <Button onClick={handleSaveType}>
                {editTypeId ? "Salvar" : "Adicionar"}
              </Button>
            </div>

            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-right p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {docTypes.map(type => (
                    <tr key={type.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-2">{type.name}</td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditTypeId(type.id);
                              setTypeForm({ name: type.name, value: type.value });
                            }}
                          >
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteType(type.id)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {editTypeId && (
              <Button variant="ghost" className="w-full" onClick={() => {
                setEditTypeId(null);
                setTypeForm({ name: "", value: "" });
              }}>
                Cancelar Edição
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};


export default AdminDocumentos;
