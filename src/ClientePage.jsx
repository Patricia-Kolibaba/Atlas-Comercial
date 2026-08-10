import React, { useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, Building2, User, MapPin, Calendar, Clock,
  CheckCircle2, Edit2, Save, Trash2, Plus, FileText, DollarSign,
  Package, BarChart3, MessageSquare, Paperclip, TrendingUp, TrendingDown,
  AlertCircle, X, Target, Globe, Download, Image, File, CreditCard,
  ShoppingCart, Receipt, MessageCircle, Hash, Briefcase, Tag, Activity,
  Flag, Eye, ChevronRight, Info, Phone as PhoneIcon
} from "lucide-react";

// ── cores ─────────────────────────────────────────────────────────────────────
const C = {
  green:     "#1FBE7A",
  dark:      "#172433",
  sidebar:   "#16202D",
  border:    "#E4E7EC",
  bg:        "#F5F6F8",
  white:     "#FFFFFF",
  muted:     "#8899A6",
  secondary: "#4B5563",
  row:       "#E4E7EC",
  red:       "#EF4444",
  redBg:     "#FEF2F2",
  orange:    "#F59E0B",
  orangeBg:  "#FFFBEB",
  blue:      "#3B82F6",
  blueBg:    "#EFF6FF",
  purple:    "#8B5CF6",
  purpleBg:  "#F5F3FF",
};

// ── helpers ───────────────────────────────────────────────────────────────────
let _uidCounter = Date.now();
function uid(prefix = "x") { return `${prefix}_${(++_uidCounter).toString(36)}`; }

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return "—"; }
}

function fmtCurrency(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysSince(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / 86400000);
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

// ── InlineField ───────────────────────────────────────────────────────────────
function InlineField({ field, value, placeholder, type = "text", onSave, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  function handleSave() {
    onSave && onSave(field, val);
    setEditing(false);
  }

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        rows={3}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        className="w-full text-sm rounded border px-2 py-1 resize-none"
        style={{ borderColor: C.green, outline: "none", color: C.dark }}
      />
    ) : (
      <input
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        className="w-full text-sm rounded border px-2 py-0.5"
        style={{ borderColor: C.green, outline: "none", color: C.dark }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="text-sm cursor-pointer group flex items-center gap-1"
      style={{ color: value ? C.dark : C.muted }}
    >
      {value || placeholder}
      <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: C.muted }} />
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color = C.green, bg }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color, background: bg || `${color}18` }}>
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: HISTÓRICO
// ══════════════════════════════════════════════════════════════════════════════
function TabHistorico({ activities, deals, ligacoes, emailsHistorico }) {
  const [filtro, setFiltro] = useState("todos");

  const iconFor = (t = "") => {
    const l = t.toLowerCase();
    if (l.includes("ligaç") || l === "ligacao") return { icon: Phone, color: C.blue, bg: C.blueBg };
    if (l.includes("e-mail") || l === "email") return { icon: Mail, color: C.orange, bg: C.orangeBg };
    if (l.includes("whatsapp") || l.includes("mensa")) return { icon: MessageCircle, color: C.green, bg: `${C.green}15` };
    if (l.includes("negócio") || l.includes("deal")) return { icon: Briefcase, color: C.purple, bg: C.purpleBg };
    if (l.includes("pedido")) return { icon: ShoppingCart, color: C.dark, bg: "#F3F4F6" };
    return { icon: Activity, color: C.muted, bg: "#F3F4F6" };
  };

  const timeline = useMemo(() => {
    const items = [];
    (activities || []).forEach(a => {
      items.push({ id: a.id, tipo: a.tipo || "atividade", texto: a.titulo || a.descricao, data: a.data || a.criadoEm, concluida: a.concluida });
    });
    (ligacoes || []).forEach(l => {
      items.push({ id: l.id, tipo: "ligacao", texto: l.assunto || "Ligação registrada", data: l.data, duracao: l.duracao });
    });
    (emailsHistorico || []).forEach(e => {
      items.push({ id: e.id, tipo: "email", texto: e.assunto || "E-mail", data: e.data });
    });
    return items.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  }, [activities, ligacoes, emailsHistorico]);

  const filtrados = filtro === "todos" ? timeline : timeline.filter(t => {
    if (filtro === "ligacao") return t.tipo === "ligacao";
    if (filtro === "email") return t.tipo === "e-mail" || t.tipo === "email";
    if (filtro === "atividade") return !["ligacao", "email"].includes(t.tipo);
    return true;
  });

  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "atividade", label: "Atividades" },
    { id: "ligacao", label: "Ligações" },
    { id: "email", label: "E-mails" },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filtros.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className="text-xs px-3 py-1 rounded-full border font-medium transition-all"
            style={{
              background: filtro === f.id ? C.green : C.white,
              color: filtro === f.id ? C.white : C.secondary,
              borderColor: filtro === f.id ? C.green : C.border,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhum registro encontrado.</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: C.border }} />
          {filtrados.map(item => {
            const { icon: Icon, color, bg } = iconFor(item.tipo);
            return (
              <div key={item.id} className="relative mb-4">
                <div className="absolute -left-4 top-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={10} style={{ color }} />
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.white }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: C.dark }}>{item.texto || "—"}</span>
                    {item.concluida !== undefined && (
                      <span className="text-xs" style={{ color: item.concluida ? C.green : C.muted }}>
                        {item.concluida ? "✓ Concluída" : "Pendente"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: C.muted }}>{fmtDate(item.data)}</span>
                    {item.duracao && <span className="text-xs" style={{ color: C.muted }}>{item.duracao}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: LIGAÇÕES
// ══════════════════════════════════════════════════════════════════════════════
function TabLigacoes({ ligacoes, onAdd }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10), assunto: "", duracao: "", resultado: "", anotacoes: "" });

  function submit(e) {
    e.preventDefault();
    if (!form.assunto.trim()) return;
    onAdd({ ...form, criadoEm: new Date().toISOString() });
    setForm({ data: new Date().toISOString().slice(0, 10), assunto: "", duracao: "", resultado: "", anotacoes: "" });
    setShow(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>Ligações ({ligacoes.length})</span>
        <button onClick={() => setShow(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: C.green, color: C.white }}>
          <Plus size={12} /> Registrar ligação
        </button>
      </div>

      {show && (
        <form onSubmit={submit} className="mb-4 rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: C.green, background: "#F0FDF9" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Duração</label>
              <input type="text" placeholder="ex: 10 min" value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Assunto *</label>
            <input type="text" placeholder="Ex: Apresentação do produto" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} required />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Resultado</label>
            <input type="text" placeholder="Ex: Interessado, enviar proposta" value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Anotações</label>
            <textarea rows={2} value={form.anotacoes} onChange={e => setForm(f => ({ ...f, anotacoes: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5 resize-none" style={{ borderColor: C.border }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShow(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.green, color: C.white }}>Salvar</button>
          </div>
        </form>
      )}

      {ligacoes.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhuma ligação registrada.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...ligacoes].reverse().map(l => (
            <div key={l.id} className="rounded-xl border p-3 flex gap-3" style={{ borderColor: C.border, background: C.white }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.blueBg }}>
                <Phone size={14} style={{ color: C.blue }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: C.dark }}>{l.assunto}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{fmtDate(l.data)}</span>
                </div>
                {l.resultado && <p className="text-xs mt-0.5" style={{ color: C.secondary }}>{l.resultado}</p>}
                {l.anotacoes && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{l.anotacoes}</p>}
                {l.duracao && <span className="text-xs mt-1 inline-block" style={{ color: C.muted }}>⏱ {l.duracao}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: E-MAILS
// ══════════════════════════════════════════════════════════════════════════════
function TabEmails({ emailsHistorico, onAdd }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10), assunto: "", direcao: "enviado", corpo: "" });

  function submit(e) {
    e.preventDefault();
    if (!form.assunto.trim()) return;
    onAdd({ ...form, criadoEm: new Date().toISOString() });
    setForm({ data: new Date().toISOString().slice(0, 10), assunto: "", direcao: "enviado", corpo: "" });
    setShow(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>E-mails ({emailsHistorico.length})</span>
        <button onClick={() => setShow(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: C.green, color: C.white }}>
          <Plus size={12} /> Registrar e-mail
        </button>
      </div>

      {show && (
        <form onSubmit={submit} className="mb-4 rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: C.green, background: "#F0FDF9" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Direção</label>
              <select value={form.direcao} onChange={e => setForm(f => ({ ...f, direcao: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }}>
                <option value="enviado">Enviado</option>
                <option value="recebido">Recebido</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Assunto *</label>
            <input type="text" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} required />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Corpo</label>
            <textarea rows={3} value={form.corpo} onChange={e => setForm(f => ({ ...f, corpo: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5 resize-none" style={{ borderColor: C.border }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShow(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.green, color: C.white }}>Salvar</button>
          </div>
        </form>
      )}

      {emailsHistorico.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhum e-mail registrado.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...emailsHistorico].reverse().map(e => (
            <div key={e.id} className="rounded-xl border p-3 flex gap-3" style={{ borderColor: C.border, background: C.white }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: e.direcao === "recebido" ? C.blueBg : C.orangeBg }}>
                <Mail size={14} style={{ color: e.direcao === "recebido" ? C.blue : C.orange }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: C.dark }}>{e.assunto}</span>
                  <div className="flex items-center gap-2">
                    <Badge label={e.direcao === "recebido" ? "Recebido" : "Enviado"} color={e.direcao === "recebido" ? C.blue : C.orange} />
                    <span className="text-xs" style={{ color: C.muted }}>{fmtDate(e.data)}</span>
                  </div>
                </div>
                {e.corpo && <p className="text-xs mt-1 line-clamp-2" style={{ color: C.muted }}>{e.corpo}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: WHATSAPP
// ══════════════════════════════════════════════════════════════════════════════
function TabWhatsApp({ client }) {
  const tel = (client.telefone || "").replace(/\D/g, "");
  const link = tel ? `https://wa.me/55${tel}` : null;

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#DCF8C6" }}>
        <MessageCircle size={28} style={{ color: "#25D366" }} />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold mb-1" style={{ color: C.dark }}>Conversa no WhatsApp</p>
        <p className="text-sm" style={{ color: C.muted }}>
          {tel ? `Número: ${client.telefone}` : "Telefone não cadastrado"}
        </p>
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
          style={{ background: "#25D366", color: "#fff" }}>
          <MessageCircle size={16} /> Abrir conversa
        </a>
      ) : (
        <p className="text-xs" style={{ color: C.muted }}>Cadastre o telefone no card à esquerda para habilitar.</p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ARQUIVOS
// ══════════════════════════════════════════════════════════════════════════════
function TabArquivos({ arquivos, onAdd, clientId }) {
  const [show, setShow] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Contrato");
  const [observacao, setObservacao] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const categorias = ["Contrato", "Proposta", "NF / Boleto", "Foto", "Planilha", "Outro"];

  function escolherArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setArquivoSelecionado(file);
    if (!nome) setNome(file.name);
  }

  async function submit(e) {
    e.preventDefault();
    setErro("");
    if (!arquivoSelecionado) { setErro("Escolha um arquivo antes de salvar."); return; }
    if (!nome.trim()) { setErro("Dê um nome para o arquivo."); return; }

    setEnviando(true);
    try {
      const extensao = arquivoSelecionado.name.split(".").pop();
      const caminhoNoStorage = `${clientId}/${Date.now()}_${arquivoSelecionado.name}`;

      const { error: erroUpload } = await supabase
        .storage
        .from("arquivos-clientes")
        .upload(caminhoNoStorage, arquivoSelecionado);

      if (erroUpload) { setErro("Não foi possível enviar o arquivo: " + erroUpload.message); setEnviando(false); return; }

      const { data: urlData } = supabase
        .storage
        .from("arquivos-clientes")
        .getPublicUrl(caminhoNoStorage);

      onAdd({
        nome: nome.trim(),
        categoria,
        observacao,
        url: urlData.publicUrl,
        tipoArquivo: extensao,
      });

      setNome(""); setCategoria("Contrato"); setObservacao("");
      setArquivoSelecionado(null);
      setShow(false);
    } catch (err) {
      setErro("Erro inesperado ao enviar o arquivo.");
    }
    setEnviando(false);
  }

  const iconForCat = (cat = "") => {
    if (cat === "Foto") return <Image size={16} style={{ color: C.purple }} />;
    if (cat === "Planilha") return <BarChart3 size={16} style={{ color: C.green }} />;
    if (cat.includes("NF") || cat.includes("Boleto")) return <Receipt size={16} style={{ color: C.orange }} />;
    return <FileText size={16} style={{ color: C.blue }} />;
  };

  const byCategory = useMemo(() => {
    return categorias.reduce((acc, cat) => {
      const items = arquivos.filter(a => a.categoria === cat);
      if (items.length) acc[cat] = items;
      return acc;
    }, {});
  }, [arquivos]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>Arquivos ({arquivos.length})</span>
        <button onClick={() => setShow(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: C.green, color: C.white }}>
          <Plus size={12} /> Adicionar arquivo
        </button>
      </div>

      {show && (
        <form onSubmit={submit} className="mb-4 rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: C.green, background: "#F0FDF9" }}>
          {erro && (
            <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{erro}</div>
          )}

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Arquivo *</label>
            <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm cursor-pointer"
              style={{ borderColor: C.border, color: C.secondary, background: C.white }}>
              <Paperclip size={16} />
              {arquivoSelecionado ? arquivoSelecionado.name : "Clique para escolher um arquivo (PDF, JPG, PNG, ODT...)"}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.odt,.ods,.odp"
                onChange={escolherArquivo}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} required />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Observação</label>
            <input value={observacao} onChange={e => setObservacao(e.target.value)}
              className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShow(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button type="submit" disabled={enviando} className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60" style={{ background: C.green, color: C.white }}>
              {enviando ? "Enviando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {arquivos.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhum arquivo adicionado.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: C.muted }}>{cat}</div>
              <div className="flex flex-col gap-1.5">
                {items.map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: C.border, background: C.white }}>
                    {iconForCat(a.categoria)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: C.dark }}>{a.nome}</div>
                      {a.observacao && <div className="text-xs truncate" style={{ color: C.muted }}>{a.observacao}</div>}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: C.muted }}>{fmtDate(a.criadoEm)}</span>
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <Download size={14} style={{ color: C.green }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: FINANCEIRO
// ══════════════════════════════════════════════════════════════════════════════
function TabFinanceiro({ client, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    limiteCredito: client.limiteCredito || "",
    condicaoPagamento: client.condicaoPagamento || "",
    formaPagamento: client.formaPagamento || "",
    banco: client.banco || "",
    agencia: client.agencia || "",
    conta: client.conta || "",
    observacaoFinanceira: client.observacaoFinanceira || "",
  });

  function save() {
    onSave(form);
    setEditing(false);
  }

  const Field = ({ label, name, type = "text" }) => (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>{label}</label>
      {editing ? (
        <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
      ) : (
        <div className="text-sm" style={{ color: form[name] ? C.dark : C.muted }}>{form[name] || "—"}</div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>Dados Financeiros</span>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button onClick={save} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.green, color: C.white }}>Salvar</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
            <Edit2 size={12} /> Editar
          </button>
        )}
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.white }}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Limite de crédito" name="limiteCredito" />
          <Field label="Condição de pagamento" name="condicaoPagamento" />
          <Field label="Forma de pagamento" name="formaPagamento" />
          <Field label="Banco" name="banco" />
          <Field label="Agência" name="agencia" />
          <Field label="Conta" name="conta" />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Observação financeira</label>
          {editing ? (
            <textarea rows={3} value={form.observacaoFinanceira} onChange={e => setForm(f => ({ ...f, observacaoFinanceira: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5 resize-none" style={{ borderColor: C.border }} />
          ) : (
            <div className="text-sm" style={{ color: form.observacaoFinanceira ? C.dark : C.muted }}>{form.observacaoFinanceira || "—"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PEDIDOS
// ══════════════════════════════════════════════════════════════════════════════
function TabPedidos({ pedidos, onAdd }) {
  const [show, setShow] = useState(false);
  const [expandId, setExpandId] = useState(null);
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10), numeroPedido: "", valor: "", status: "Pendente", descricao: "" });

  const statusColor = { "Pendente": C.orange, "Em andamento": C.blue, "Entregue": C.green, "Cancelado": C.red };

  function submit(e) {
    e.preventDefault();
    if (!form.numeroPedido.trim()) return;
    onAdd({ ...form, criadoEm: new Date().toISOString() });
    setForm({ data: new Date().toISOString().slice(0, 10), numeroPedido: "", valor: "", status: "Pendente", descricao: "" });
    setShow(false);
  }

  const total = pedidos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm font-medium" style={{ color: C.dark }}>Pedidos ({pedidos.length})</span>
          {pedidos.length > 0 && (
            <span className="ml-2 text-sm" style={{ color: C.green }}>Total: {fmtCurrency(total)}</span>
          )}
        </div>
        <button onClick={() => setShow(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: C.green, color: C.white }}>
          <Plus size={12} /> Novo pedido
        </button>
      </div>

      {show && (
        <form onSubmit={submit} className="mb-4 rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: C.green, background: "#F0FDF9" }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Nº Pedido *</label>
              <input value={form.numeroPedido} onChange={e => setForm(f => ({ ...f, numeroPedido: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} required />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Valor (R$)</label>
              <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }}>
                {Object.keys(statusColor).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Descrição</label>
              <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShow(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.green, color: C.white }}>Salvar</button>
          </div>
        </form>
      )}

      {pedidos.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhum pedido registrado.</div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: C.secondary }}>Nº Pedido</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: C.secondary }}>Data</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: C.secondary }}>Valor</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: C.secondary }}>Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {[...pedidos].reverse().map(p => (
                <React.Fragment key={p.id}>
                  <tr className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: C.border }}
                    onClick={() => setExpandId(expandId === p.id ? null : p.id)}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: C.dark }}>{p.numeroPedido}</td>
                    <td className="px-4 py-2.5" style={{ color: C.secondary }}>{fmtDate(p.data)}</td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: C.green }}>{fmtCurrency(p.valor)}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={p.status} color={statusColor[p.status] || C.muted} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ChevronRight size={14} style={{ color: C.muted, transform: expandId === p.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                    </td>
                  </tr>
                  {expandId === p.id && p.descricao && (
                    <tr style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
                      <td colSpan={5} className="px-4 py-3 text-xs" style={{ color: C.secondary }}>{p.descricao}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function TabDashboard({ client, pedidos, deals, activities }) {
  // Agrupa pedidos por mês (últimos 6)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const total = pedidos.filter(p => (p.data || "").startsWith(key)).reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
      months.push({ key, label, total });
    }
    return months;
  }, [pedidos]);

  const maxVal = Math.max(...monthlyData.map(m => m.total), 1);
  const totalGeral = pedidos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
  const dias = daysSince(client.ultimaCompra);

  // Alertas inteligentes
  const alertas = [];
  if (dias !== null && dias > 60) alertas.push({ tipo: "danger", msg: `${dias} dias sem comprar — requer atenção urgente.` });
  else if (dias !== null && dias > 30) alertas.push({ tipo: "warning", msg: `${dias} dias desde a última compra.` });
  if (!client.email) alertas.push({ tipo: "warning", msg: "E-mail não cadastrado — comunicação limitada." });
  if (!client.telefone) alertas.push({ tipo: "warning", msg: "Telefone não cadastrado." });
  const abertos = deals.filter(d => d.status !== "ganho" && d.status !== "perdido").length;
  if (abertos > 0) alertas.push({ tipo: "info", msg: `${abertos} negócio${abertos > 1 ? "s" : ""} em aberto no pipeline.` });
  if (alertas.length === 0) alertas.push({ tipo: "success", msg: "Tudo certo! Cliente ativo e sem pendências." });

  const alertColor = { danger: C.red, warning: C.orange, info: C.blue, success: C.green };
  const alertBg = { danger: C.redBg, warning: C.orangeBg, info: C.blueBg, success: `${C.green}12` };

  return (
    <div className="flex flex-col gap-6">
      {/* Gráfico de barras */}
      <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.white }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: C.dark }}>Faturamento mensal</span>
          <span className="text-sm font-bold" style={{ color: C.green }}>{fmtCurrency(totalGeral)} total</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {monthlyData.map(m => {
            const pct = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.green }}>
                  {m.total > 0 ? fmtCurrency(m.total) : ""}
                </div>
                <div className="w-full rounded-t-md transition-all duration-500 relative" style={{ height: `${Math.max(pct, 3)}%`, background: m.total > 0 ? C.green : C.border }} />
                <div className="text-xs" style={{ color: C.muted }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas inteligentes */}
      <div>
        <div className="text-sm font-semibold mb-3" style={{ color: C.dark }}>Alertas inteligentes</div>
        <div className="flex flex-col gap-2">
          {alertas.map((a, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: alertBg[a.tipo] }}>
              <AlertCircle size={15} style={{ color: alertColor[a.tipo], flexShrink: 0, marginTop: 1 }} />
              <span className="text-sm" style={{ color: C.dark }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total de pedidos", value: pedidos.length, color: C.dark },
          { label: "Negócios abertos", value: abertos, color: C.blue },
          { label: "Atividades", value: activities.length, color: C.green },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-3 text-center" style={{ borderColor: C.border, background: C.white }}>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: NEGÓCIOS
// ══════════════════════════════════════════════════════════════════════════════
function TabNegocios({ deals, stageById, navigate }) {
  const statusColor = { ganho: C.green, perdido: C.red };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>Negócios ({deals.length})</span>
      </div>
      {deals.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>Nenhum negócio vinculado a este cliente.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {deals.map(d => {
            const stage = stageById(d.stageId);
            const isOpen = d.status !== "ganho" && d.status !== "perdido";
            return (
              <div key={d.id} className="rounded-xl border p-3 flex gap-3 items-center hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: C.border, background: C.white }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isOpen ? `${C.green}15` : isOpen === false && d.status === "ganho" ? `${C.green}15` : C.redBg }}>
                  <Briefcase size={14} style={{ color: isOpen ? C.green : d.status === "ganho" ? C.green : C.red }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: C.dark }}>{d.titulo || d.nome || "Negócio sem título"}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {stage ? stage.nome : "Sem etapa"} · {fmtDate(d.criadoEm)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: C.green }}>{fmtCurrency(d.valor)}</div>
                  {d.status && <Badge label={d.status} color={statusColor[d.status] || C.blue} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: DADOS
// ══════════════════════════════════════════════════════════════════════════════
function TabDados({ client, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...client });

  function save() {
    onSave(form);
    setEditing(false);
  }

  const F = ({ label, name, type = "text", span = 1 }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>{label}</label>
      {editing ? (
        <input type={type} value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: C.border }} />
      ) : (
        <div className="text-sm" style={{ color: form[name] ? C.dark : C.muted }}>{form[name] || "—"}</div>
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <div className="text-xs font-semibold uppercase mb-3 pb-1.5 border-b" style={{ color: C.muted, borderColor: C.border }}>{title}</div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium" style={{ color: C.dark }}>Dados completos</span>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => { setForm({ ...client }); setEditing(false); }} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>Cancelar</button>
            <button onClick={save} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.green, color: C.white }}>Salvar</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
            <Edit2 size={12} /> Editar
          </button>
        )}
      </div>

      <div className="rounded-xl border p-5 flex flex-col gap-6" style={{ borderColor: C.border, background: C.white }}>
        <Section title="Identificação">
          <F label="Nome completo" name="nome" span={2} />
          <F label="Empresa" name="empresa" />
          <F label="CNPJ / CPF" name="cpfCnpj" />
          <F label="Cargo" name="cargo" />
          <F label="Segmento" name="segmento" />
        </Section>

        <Section title="Contato">
          <F label="Telefone" name="telefone" type="tel" />
          <F label="WhatsApp" name="whatsapp" type="tel" />
          <F label="E-mail principal" name="email" type="email" />
          <F label="E-mails adicionais" name="emailsAdicionais" />
          <F label="Site" name="site" type="url" />
        </Section>

        <Section title="Endereço">
          <F label="CEP" name="cep" />
          <F label="Estado" name="estado" />
          <F label="Cidade" name="cidade" />
          <F label="Bairro" name="bairro" />
          <F label="Rua / Logradouro" name="rua" span={2} />
          <F label="Número" name="numero" />
          <F label="Complemento" name="complemento" />
        </Section>

        <Section title="Comercial">
          <F label="Origem" name="origem" />
          <F label="Tags" name="tags" />
          <F label="Última compra" name="ultimaCompra" type="date" />
          <F label="Meta anual (R$)" name="metaAnual" type="number" />
        </Section>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: C.secondary }}>Observações gerais</label>
          {editing ? (
            <textarea rows={4} value={form.observacoes || ""} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full text-sm border rounded-lg px-2 py-1.5 resize-none" style={{ borderColor: C.border }} />
          ) : (
            <div className="text-sm" style={{ color: form.observacoes ? C.dark : C.muted }}>{form.observacoes || "—"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COLUNA ESQUERDA: Card de resumo do cliente
// ══════════════════════════════════════════════════════════════════════════════
function ClientSummaryCard({ client, updateClient, vendedoraById }) {
  const vendedora = vendedoraById(client.vendedoraId);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, background: C.white }}>
      {/* Header com avatar */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base"
            style={{ background: C.green, color: C.white }}>
            {initials(client.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-base truncate" style={{ color: C.dark }}>{client.nome}</div>
            <InlineField field="cargo" value={client.cargo} placeholder="Cargo (clique para editar)"
              onSave={(f, v) => updateClient({ [f]: v })} />
          </div>
        </div>

        {/* Status ativo/inativo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateClient({ ativo: true })}
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: client.ativo !== false ? C.green : "transparent", color: client.ativo !== false ? C.white : C.muted, border: `1px solid ${client.ativo !== false ? C.green : C.border}` }}>
            Ativo
          </button>
          <button
            onClick={() => updateClient({ ativo: false })}
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: client.ativo === false ? C.red : "transparent", color: client.ativo === false ? C.white : C.muted, border: `1px solid ${client.ativo === false ? C.red : C.border}` }}>
            Inativar
          </button>
        </div>
      </div>

      {/* Dados de contato */}
      <div className="px-4 py-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Building2 size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="empresa" value={client.empresa} placeholder="Empresa"
            onSave={(f, v) => updateClient({ [f]: v })} />
        </div>
        <div className="flex items-center gap-2">
          <Hash size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="cpfCnpj" value={client.cpfCnpj} placeholder="CNPJ / CPF"
            onSave={(f, v) => updateClient({ [f]: v })} />
        </div>
        <div className="flex items-center gap-2">
          <Phone size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="telefone" value={client.telefone} placeholder="Telefone" type="tel"
            onSave={(f, v) => updateClient({ [f]: v })} />
        </div>
        <div className="flex items-center gap-2">
          <Mail size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="email" value={client.email} placeholder="E-mail" type="email"
            onSave={(f, v) => updateClient({ [f]: v })} />
        </div>
        {(client.cidade || client.estado) && (
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: C.muted, flexShrink: 0 }} />
            <span className="text-sm" style={{ color: C.secondary }}>{[client.cidade, client.estado].filter(Boolean).join(", ")}</span>
          </div>
        )}
      </div>

      {/* Proprietário */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: C.row }}>
        <div className="text-xs mb-2" style={{ color: C.muted }}>Proprietário</div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: C.green, color: C.white }}>
            {initials(vendedora?.nome || "?")}
          </div>
          <span className="text-sm font-medium" style={{ color: C.dark }}>{vendedora?.nome || "Não atribuído"}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COLUNA ESQUERDA: Indicadores
// ══════════════════════════════════════════════════════════════════════════════
function IndicadoresCard({ client, pedidos, deals }) {
  const dias = daysSince(client.ultimaCompra);
  const totalFaturado = pedidos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
  const ticketMedio = pedidos.length > 0 ? totalFaturado / pedidos.length : 0;
  const metaAnual = parseFloat(client.metaAnual) || 0;
  const metaPct = metaAnual > 0 ? Math.min((totalFaturado / metaAnual) * 100, 100) : 0;
  const dealsAbertos = deals.filter(d => d.status !== "ganho" && d.status !== "perdido").length;

  const diasColor = dias === null ? C.muted : dias > 60 ? C.red : dias > 30 ? C.orange : C.green;

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-4" style={{ borderColor: C.border, background: C.white }}>
      <div className="text-xs font-semibold uppercase" style={{ color: C.muted }}>Indicadores</div>

      {/* Dias sem comprar */}
      <div className="rounded-xl px-3 py-3 text-center" style={{ background: dias !== null && dias > 30 ? `${diasColor}10` : C.bg }}>
        <div className="text-3xl font-bold" style={{ color: diasColor }}>
          {dias !== null ? dias : "—"}
        </div>
        <div className="text-xs mt-0.5" style={{ color: C.muted }}>dias sem comprar</div>
        {client.ultimaCompra && (
          <div className="text-xs mt-1" style={{ color: C.muted }}>Última: {fmtDate(client.ultimaCompra)}</div>
        )}
      </div>

      {/* Meta anual */}
      {metaAnual > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: C.secondary }}>Meta anual</span>
            <span className="text-xs font-medium" style={{ color: C.green }}>{metaPct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: C.bg }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${metaPct}%`, background: metaPct >= 100 ? C.green : metaPct >= 60 ? C.blue : C.orange }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: C.muted }}>{fmtCurrency(totalFaturado)}</span>
            <span className="text-xs" style={{ color: C.muted }}>{fmtCurrency(metaAnual)}</span>
          </div>
        </div>
      )}

      {/* KPIs simples */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Faturado", value: fmtCurrency(totalFaturado), color: C.green },
          { label: "Ticket médio", value: fmtCurrency(ticketMedio), color: C.dark },
          { label: "Pedidos", value: pedidos.length, color: C.dark },
          { label: "Negócios abertos", value: dealsAbertos, color: C.blue },
        ].map(k => (
          <div key={k.label} className="rounded-lg px-2.5 py-2" style={{ background: C.bg }}>
            <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs" style={{ color: C.muted }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COLUNA ESQUERDA: Observação Fixa
// ══════════════════════════════════════════════════════════════════════════════
function ObservacaoFixaCard({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  function save() {
    onSave(val);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${C.orange}60`, background: C.orangeBg }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Flag size={13} style={{ color: C.orange }} />
          <span className="text-xs font-semibold" style={{ color: C.orange }}>Observação fixa</span>
        </div>
        <button onClick={() => editing ? save() : setEditing(true)} className="text-xs" style={{ color: C.orange }}>
          {editing ? <Save size={13} /> : <Edit2 size={13} />}
        </button>
      </div>
      {editing ? (
        <div>
          <textarea autoFocus rows={4} value={val} onChange={e => setVal(e.target.value)}
            className="w-full text-sm rounded-lg border px-2 py-1.5 resize-none"
            style={{ borderColor: `${C.orange}60`, background: C.white, outline: "none" }} />
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => { setVal(value || ""); setEditing(false); }} className="text-xs" style={{ color: C.muted }}>Cancelar</button>
            <button onClick={save} className="text-xs font-medium" style={{ color: C.orange }}>Salvar</button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap" style={{ color: val ? "#78350F" : C.muted }}>
          {val || "Clique para adicionar uma observação fixada sobre este cliente..."}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function ClientePage({
  db,
  setDb,
  isAdmin,
  currentUser,
  vendedoraById,
  stageById,
  showToast,
}) {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("historico");

  // Guard: db ainda não carregou do Supabase
  if (!db || !db.clients) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: C.muted }}>Carregando...</div>
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === clienteId);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <User size={40} style={{ color: C.muted }} />
        <div className="text-base font-semibold" style={{ color: C.dark }}>Cliente não encontrado</div>
        <button onClick={() => navigate("/clientes")} className="text-sm font-medium" style={{ color: C.green }}>
          ← Voltar para clientes
        </button>
      </div>
    );
  }

  // Dados filtrados por cliente
  const clientDeals      = (db.deals      || []).filter(d => d.clientId === clienteId);
  const clientActivities = (db.activities || []).filter(a => a.clientId === clienteId);
  const clientLigacoes   = (db.ligacoes   || []).filter(l => l.clientId === clienteId);
  const clientPedidos    = (db.pedidos    || []).filter(p => p.clientId === clienteId);
  const clientArquivos   = (db.arquivos   || []).filter(a => a.clientId === clienteId);
  const clientEmailsHist = (db.emailsHistorico || []).filter(e => e.clientId === clienteId);

  // Handlers
  const updateClient = (patch) => {
    setDb(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === clienteId ? { ...c, ...patch } : c),
    }));
  };

  const addLigacao = (lig) => {
    setDb(prev => ({ ...prev, ligacoes: [...(prev.ligacoes || []), { id: uid("lig"), clientId: clienteId, ...lig }] }));
    showToast("Ligação registrada.");
  };

  const addEmailHistorico = (em) => {
    setDb(prev => ({ ...prev, emailsHistorico: [...(prev.emailsHistorico || []), { id: uid("em"), clientId: clienteId, ...em }] }));
    showToast("E-mail registrado.");
  };

  const addArquivo = (arq) => {
    setDb(prev => ({ ...prev, arquivos: [...(prev.arquivos || []), { id: uid("arq"), clientId: clienteId, criadoEm: new Date().toISOString(), usuarioNome: currentUser?.nome, ...arq }] }));
    showToast("Arquivo adicionado.");
  };

  const addPedido = (ped) => {
    setDb(prev => ({ ...prev, pedidos: [...(prev.pedidos || []), { id: uid("ped"), clientId: clienteId, ...ped }] }));
    showToast("Pedido registrado.");
  };

  const ABAS = [
    { id: "historico",  label: "Histórico"  },
    { id: "ligacoes",   label: "Ligações"   },
    { id: "emails",     label: "E-mails"    },
    { id: "whatsapp",   label: "WhatsApp"   },
    { id: "arquivos",   label: "Arquivos"   },
    { id: "financeiro", label: "Financeiro" },
    { id: "pedidos",    label: "Pedidos"    },
    { id: "dashboard",  label: "Dashboard"  },
    { id: "negocios",   label: "Negócios"   },
    { id: "dados",      label: "Dados"      },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 border-b" style={{ background: C.white, borderColor: C.border }}>
        <button onClick={() => navigate("/clientes")}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: C.secondary }}>
          <ArrowLeft size={16} /> Clientes
        </button>
        <span style={{ color: C.border }}>/</span>
        <span className="text-sm font-semibold" style={{ color: C.dark }}>{client.nome}</span>
        {client.ativo === false && <Badge label="Inativo" color={C.red} />}
      </div>

      {/* Layout 2 colunas */}
      <div className="flex gap-5 p-6 max-w-screen-xl mx-auto">

        {/* Coluna esquerda — sticky */}
        <div className="w-72 flex-shrink-0">
          <div className="flex flex-col gap-4 sticky top-16">
            <ObservacaoFixaCard
              value={client.observacaoFixa}
              onSave={v => updateClient({ observacaoFixa: v })}
            />
            <ClientSummaryCard
              client={client}
              updateClient={updateClient}
              vendedoraById={vendedoraById}
            />
            <IndicadoresCard
              client={client}
              pedidos={clientPedidos}
              deals={clientDeals}
            />
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex-1 min-w-0">
          {/* Abas horizontais */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, background: C.white }}>
            <div className="flex border-b overflow-x-auto" style={{ borderColor: C.border }}>
              {ABAS.map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    color: abaAtiva === aba.id ? C.green : C.secondary,
                    borderBottom: abaAtiva === aba.id ? `2px solid ${C.green}` : "2px solid transparent",
                    background: "transparent",
                  }}>
                  {aba.label}
                </button>
              ))}
            </div>

            {/* Conteúdo da aba */}
            <div className="p-5">
              {abaAtiva === "historico" && (
                <TabHistorico activities={clientActivities} deals={clientDeals} ligacoes={clientLigacoes} emailsHistorico={clientEmailsHist} />
              )}
              {abaAtiva === "ligacoes" && (
                <TabLigacoes ligacoes={clientLigacoes} onAdd={addLigacao} />
              )}
              {abaAtiva === "emails" && (
                <TabEmails emailsHistorico={clientEmailsHist} onAdd={addEmailHistorico} />
              )}
              {abaAtiva === "whatsapp" && (
                <TabWhatsApp client={client} />
              )}
             {abaAtiva === "arquivos" && (
                <TabArquivos arquivos={clientArquivos} onAdd={addArquivo} clientId={clienteId} />
              )}
              {abaAtiva === "financeiro" && (
                <TabFinanceiro client={client} onSave={updateClient} />
              )}
              {abaAtiva === "pedidos" && (
                <TabPedidos pedidos={clientPedidos} onAdd={addPedido} />
              )}
              {abaAtiva === "dashboard" && (
                <TabDashboard client={client} pedidos={clientPedidos} deals={clientDeals} activities={clientActivities} />
              )}
              {abaAtiva === "negocios" && (
                <TabNegocios deals={clientDeals} stageById={stageById} navigate={navigate} />
              )}
              {abaAtiva === "dados" && (
                <TabDados client={client} onSave={updateClient} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
