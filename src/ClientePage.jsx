import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, Building2, User, MapPin, Calendar, Clock,
  CheckCircle2, Edit2, Save, Trash2, Plus, FileText, DollarSign,
  Package, BarChart3, MessageSquare, Paperclip, TrendingUp, TrendingDown,
  AlertCircle, X, Target, Globe, Download, Image, File, CreditCard,
  ShoppingCart, Receipt, MessageCircle, Hash, Briefcase, Tag, Activity,
  Flag, Eye, ChevronRight, Info, Phone as PhoneIcon
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 5);

// ── cores ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F6F8",
  border: "#E4E7EC",
  white: "#fff",
  dark: "#172433",
  text: "#344054",
  secondary: "#667085",
  muted: "#98A2B3",
  green: "#1FBE7A",
  greenDark: "#17A868",
  greenBg: "#E7F9F1",
  greenBg2: "#F0FBF6",
  red: "#E5484D",
  redBg: "#FDEDEE",
  orange: "#F59E0B",
  orangeBg: "#FFF7ED",
  input: "#D7DCE3",
  row: "#F0F1F3",
};

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#1FBE7A]";
const inputStyle = { borderColor: C.input, background: C.white, color: C.dark };

// ── componentes utilitários ───────────────────────────────────────────────────
function Badge({ children, color = C.text, bg = "#EEF1F4" }) {
  return (
    <span
      className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs" style={{ color: C.muted }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: color || C.dark }}>{value || "—"}</div>
    </div>
  );
}

// ── Observação Fixa ───────────────────────────────────────────────────────────
function ObservacaoFixa({ client, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState(client.observacaoFixa || "");

  const save = () => {
    onUpdate({ observacaoFixa: texto });
    setEditing(false);
  };

  const hasObs = client.observacaoFixa && client.observacaoFixa.trim();

  if (!hasObs && !editing) {
    return (
      <button
        onClick={() => { setTexto(""); setEditing(true); }}
        className="w-full flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm transition-colors hover:border-yellow-300"
        style={{ borderColor: C.input, color: C.muted }}
      >
        <Flag size={14} /> Adicionar observação fixa...
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        borderLeft: "4px solid #F59E0B",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "#92400E" }}>
          <Flag size={12} /> Observação Fixa
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={save} className="rounded-md px-2.5 py-1 text-xs font-medium text-white" style={{ background: C.green }}>
                Salvar
              </button>
              <button
                onClick={() => { setTexto(client.observacaoFixa || ""); setEditing(false); }}
                className="rounded-md px-2 py-1 text-xs font-medium"
                style={{ color: C.secondary }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setTexto(client.observacaoFixa || ""); setEditing(true); }} className="rounded-md p-1.5 hover:bg-yellow-100">
                <Edit2 size={12} style={{ color: "#92400E" }} />
              </button>
              <button onClick={() => { onUpdate({ observacaoFixa: "" }); setTexto(""); }} className="rounded-md p-1.5 hover:bg-yellow-100">
                <Trash2 size={12} style={{ color: "#92400E" }} />
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-2.5 py-2 text-sm outline-none resize-none"
          style={{ borderColor: "#FDE68A", background: "#FFFDF5", color: C.dark }}
          placeholder="Ex: Não ligar após 17h. Falar sempre com João. Não conceder desconto acima de 8%."
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#78350F" }}>
          {client.observacaoFixa}
        </p>
      )}
    </div>
  );
}

// ── Card Resumo ───────────────────────────────────────────────────────────────
function ClientSummaryCard({ client, vendedoraById, onUpdate }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const vendedora = vendedoraById(client.vendedoraId);
  const initials = (client.nome || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const startEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value || "");
  };
  const commitEdit = () => {
    if (editingField) onUpdate({ [editingField]: tempValue });
    setEditingField(null);
  };

  const InlineField = ({ field, value, placeholder, type = "text" }) =>
    editingField === field ? (
      <input
        autoFocus
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") setEditingField(null);
        }}
        className="rounded-md px-1.5 py-0.5 text-sm border w-full"
        style={{ borderColor: C.green, outline: "none", color: C.dark, background: "#F9FAFB" }}
      />
    ) : (
      <button
        onClick={() => startEdit(field, value)}
        className="text-left text-sm w-full hover:underline truncate"
        style={{ color: value ? C.dark : C.muted }}
        title="Clique para editar"
      >
        {value || placeholder}
      </button>
    );

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
      {/* Avatar + nome */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-base font-bold text-white select-none"
          style={{ background: C.dark }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base leading-tight mb-0.5" style={{ color: C.dark }}>
            {client.nome}
          </div>
          <InlineField field="cargo" value={client.cargo} placeholder="Cargo (clique para editar)" />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              color={client.situacao === "inativo" ? C.red : C.greenDark}
              bg={client.situacao === "inativo" ? C.redBg : C.greenBg}
            >
              {client.situacao === "inativo" ? "Inativo" : "Ativo"}
            </Badge>
            {client.situacao !== "inativo" ? (
              <button onClick={() => onUpdate({ situacao: "inativo" })} className="text-xs" style={{ color: C.muted }}>
                Inativar
              </button>
            ) : (
              <button onClick={() => onUpdate({ situacao: "ativo" })} className="text-xs font-medium" style={{ color: C.green }}>
                Ativar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dados de contato */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Building2 size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="empresa" value={client.empresa} placeholder="Empresa" />
        </div>
        <div className="flex items-center gap-2">
          <Phone size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="telefone" value={client.telefone} placeholder="Telefone" type="tel" />
        </div>
        <div className="flex items-center gap-2">
          <Mail size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <InlineField field="email" value={client.email} placeholder="E-mail" type="email" />
        </div>
        {(client.cidade || client.estado) && (
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: C.muted, flexShrink: 0 }} />
            <span className="text-sm" style={{ color: C.secondary }}>
              {[client.cidade, client.estado].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Proprietário */}
      <div className="pt-3 border-t" style={{ borderColor: C.row }}>
        <div className="text-xs mb-1.5" style={{ color: C.muted }}>Proprietário</div>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: vendedora ? C.green : C.muted }}
          >
            {vendedora ? vendedora.nome[0].toUpperCase() : "?"}
          </div>
          <span className="text-sm" style={{ color: C.text }}>
            {vendedora?.nome || "Não atribuído"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Painel de Indicadores ─────────────────────────────────────────────────────
function IndicatorsPanel({ client, pedidos }) {
  const ano = new Date().getFullYear();
  const pedidosAno = pedidos.filter((p) => p.data && p.data.startsWith(String(ano)));
  const totalAno = pedidosAno.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const totalTodos = pedidos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const qtdPedidos = pedidos.length;
  const pedidosOrdenados = [...pedidos].sort((a, b) =>
    (b.data || "").localeCompare(a.data || "")
  );
  const ultimaCompra = pedidosOrdenados[0]?.data || null;
  const ticketMedio = qtdPedidos > 0 ? totalTodos / qtdPedidos : 0;

  const diasSemComprar = useMemo(() => {
    if (!ultimaCompra) return null;
    const diff = Date.now() - new Date(ultimaCompra).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [ultimaCompra]);

  const metaAnual = Number(client.metaAnual) || 0;
  const percentualMeta = metaAnual > 0 ? Math.min(100, Math.round((totalAno / metaAnual) * 100)) : null;

  const diasColor =
    diasSemComprar === null
      ? C.muted
      : diasSemComprar > 60
      ? C.red
      : diasSemComprar > 30
      ? C.orange
      : C.greenDark;
  const diasBg =
    diasSemComprar === null
      ? "#F9FAFB"
      : diasSemComprar > 60
      ? C.redBg
      : diasSemComprar > 30
      ? C.orangeBg
      : C.greenBg;

  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col gap-4" style={{ borderColor: C.border }}>
      {/* Destaque: dias sem comprar */}
      <div
        className="rounded-lg p-3 flex items-center gap-3"
        style={{ background: diasBg }}
      >
        <div className="text-3xl font-extrabold leading-none" style={{ color: diasColor }}>
          {diasSemComprar !== null ? diasSemComprar : "—"}
        </div>
        <div>
          <div className="text-xs font-semibold" style={{ color: diasColor }}>
            dias sem comprar
          </div>
          {ultimaCompra ? (
            <div className="text-xs mt-0.5" style={{ color: C.secondary }}>
              Última: {fmtDate(ultimaCompra)}
            </div>
          ) : (
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>
              Sem pedidos cadastrados
            </div>
          )}
        </div>
      </div>

      {/* Barra de meta */}
      {metaAnual > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs" style={{ color: C.muted }}>
              Meta anual ({ano})
            </div>
            <div
              className="text-xs font-bold"
              style={{ color: percentualMeta >= 100 ? C.greenDark : C.text }}
            >
              {percentualMeta}%
            </div>
          </div>
          <div
            className="rounded-full h-2 w-full overflow-hidden"
            style={{ background: "#EEF1F4" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percentualMeta}%`,
                background:
                  percentualMeta >= 100
                    ? C.green
                    : percentualMeta >= 75
                    ? "#3B82F6"
                    : percentualMeta >= 50
                    ? C.orange
                    : C.red,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs font-medium" style={{ color: C.secondary }}>
              {brl(totalAno)}
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              {brl(metaAnual)}
            </div>
          </div>
        </div>
      )}

      {/* Grid de indicadores */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Total no ano" value={brl(totalAno)} />
        <StatItem label="Ticket médio" value={brl(ticketMedio)} />
        <StatItem label="Qtd. pedidos" value={qtdPedidos || "—"} />
        <StatItem label="Última compra" value={fmtDate(ultimaCompra)} />
      </div>

      {/* Campos extras do cliente */}
      {(client.potencialCompra ||
        client.segmento ||
        client.cidade ||
        client.revendaOuClienteFinal ||
        client.condicaoComercial ||
        Number(client.limiteCredito) > 0 ||
        client.equipamentosAdquiridos) && (
        <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: C.row }}>
          {client.potencialCompra && (
            <StatItem label="Potencial de compra" value={client.potencialCompra} />
          )}
          {client.segmento && <StatItem label="Segmento" value={client.segmento} />}
          {(client.cidade || client.estado) && (
            <StatItem
              label="Localização"
              value={[client.cidade, client.estado].filter(Boolean).join(" — ")}
            />
          )}
          {client.revendaOuClienteFinal && (
            <StatItem
              label="Tipo"
              value={client.revendaOuClienteFinal === "revenda" ? "Revenda" : "Cliente Final"}
            />
          )}
          {client.condicaoComercial && (
            <StatItem label="Cond. Comercial" value={client.condicaoComercial} />
          )}
          {Number(client.limiteCredito) > 0 && (
            <StatItem label="Limite de Crédito" value={brl(client.limiteCredito)} />
          )}
          {client.equipamentosAdquiridos && (
            <StatItem label="Equipamentos" value={client.equipamentosAdquiridos} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Abas ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "historico", label: "Histórico" },
  { id: "ligacoes", label: "Ligações" },
  { id: "emails", label: "E-mails" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "arquivos", label: "Arquivos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "pedidos", label: "Pedidos" },
  { id: "dashboard", label: "Dashboard" },
  { id: "negocios", label: "Negócios" },
  { id: "dados", label: "Dados" },
];

// ── Aba Histórico ─────────────────────────────────────────────────────────────
function TabHistorico({ activities, ligacoes, pedidos, arquivos, vendedoraById, onAddObservacao }) {
  const [filtro, setFiltro] = useState("todos");
  const [novaObs, setNovaObs] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const FILTROS = [
    { id: "todos", label: "Todos" },
    { id: "ligacao", label: "Ligações" },
    { id: "email", label: "E-mails" },
    { id: "pedido", label: "Pedidos" },
    { id: "arquivo", label: "Arquivos" },
    { id: "observacao", label: "Observações" },
  ];

  const allEvents = useMemo(() => {
    const evts = [];
    activities.forEach((a) =>
      evts.push({ ...a, _tipo: (a.tipo || "").toLowerCase(), _data: a.data, _hora: a.hora || "00:00" })
    );
    ligacoes.forEach((l) =>
      evts.push({ ...l, _tipo: "ligacao", _data: l.data, _hora: l.hora || "00:00" })
    );
    pedidos.forEach((p) =>
      evts.push({ ...p, _tipo: "pedido", _data: p.data, _hora: "00:00" })
    );
    arquivos.forEach((a) =>
      evts.push({ ...a, _tipo: "arquivo", _data: a.criadoEm ? a.criadoEm.slice(0, 10) : null, _hora: "00:00" })
    );
    return evts
      .filter((e) => e._data)
      .sort((a, b) =>
        `${b._data}${b._hora}`.localeCompare(`${a._data}${a._hora}`)
      );
  }, [activities, ligacoes, pedidos, arquivos]);

  const filtered = useMemo(() => {
    if (filtro === "todos") return allEvents;
    return allEvents.filter((e) => {
      const t = e._tipo;
      if (filtro === "ligacao") return t === "ligação" || t === "ligacao";
      if (filtro === "email") return t === "e-mail" || t === "email";
      if (filtro === "pedido") return t === "pedido";
      if (filtro === "arquivo") return t === "arquivo";
      if (filtro === "observacao") return t === "observação" || t === "tarefa" || t === "observacao";
      return false;
    });
  }, [allEvents, filtro]);

  const typeConfig = (tipo) => {
    const t = (tipo || "").toLowerCase();
    if (t.includes("ligaç") || t === "ligacao") return { icon: Phone, color: "#3B82F6", bg: "#EFF6FF" };
    if (t.includes("reunião") || t.includes("reuniao")) return { icon: Calendar, color: "#8B5CF6", bg: "#F5F3FF" };
    if (t.includes("e-mail") || t === "email") return { icon: Mail, color: C.orange, bg: C.orangeBg };
    if (t === "pedido") return { icon: ShoppingCart, color: C.greenDark, bg: C.greenBg };
    if (t === "arquivo") return { icon: Paperclip, color: C.secondary, bg: "#F5F6F8" };
    if (t === "observação" || t === "observacao") return { icon: FileText, color: "#6B7280", bg: "#F3F4F6" };
    if (t === "tarefa") return { icon: CheckCircle2, color: C.muted, bg: "#F9FAFB" };
    return { icon: Activity, color: C.secondary, bg: "#F5F6F8" };
  };

  const saveObs = () => {
    if (!novaObs.trim()) return;
    onAddObservacao(novaObs.trim());
    setNovaObs("");
    setShowAdd(false);
  };

  return (
    <div>
      {/* Filtros + botão adicionar */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: filtro === f.id ? C.dark : "#EEF1F4",
              color: filtro === f.id ? "#fff" : C.text,
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ml-auto"
          style={{ background: C.green, color: "#fff" }}
        >
          <Plus size={12} /> Observação
        </button>
      </div>

      {/* Formulário nova observação */}
      {showAdd && (
        <div
          className="mb-4 rounded-xl border bg-white p-4"
          style={{ borderColor: C.border }}
        >
          <textarea
            autoFocus
            value={novaObs}
            onChange={(e) => setNovaObs(e.target.value)}
            placeholder="Registrar observação sobre este cliente..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none mb-3"
            style={{ borderColor: C.input, background: "#F9FAFB", color: C.dark }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: C.border, color: C.secondary }}
            >
              Cancelar
            </button>
            <button
              onClick={saveObs}
              className="text-sm px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: C.green }}
            >
              Registrar
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex flex-col gap-3">
        {filtered.map((evt, i) => {
          const cfg = typeConfig(evt._tipo || evt.tipo);
          const Icon = cfg.icon;
          const vend = vendedoraById(evt.vendedoraId || evt.responsavelId);
          return (
            <div key={evt.id || i} className="flex gap-3">
              <div className="shrink-0 mt-1">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ background: cfg.bg }}
                >
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
              </div>
              <div
                className="flex-1 rounded-xl border bg-white p-3.5"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: C.dark }}>
                      {evt.tipo || (evt._tipo === "pedido" ? "Pedido" : evt._tipo === "arquivo" ? "Arquivo" : "Registro")}
                      {evt.titulo && ` · ${evt.titulo}`}
                      {evt.numero && ` #${evt.numero}`}
                      {evt.nome && evt._tipo === "arquivo" && ` · ${evt.nome}`}
                    </div>
                    {(evt.descricao || evt.observacoes || evt.resultado || evt.categoria) && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: C.secondary }}>
                        {evt.descricao || evt.observacoes || evt.resultado || evt.categoria}
                      </div>
                    )}
                    {evt.valor > 0 && (
                      <div className="text-xs font-semibold mt-0.5" style={{ color: C.greenDark }}>
                        {brl(evt.valor)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs shrink-0 text-right" style={{ color: C.muted }}>
                    <div>{fmtDate(evt._data)}</div>
                    {evt._hora && evt._hora !== "00:00" && <div>{evt._hora}</div>}
                    {vend && <div className="mt-0.5 font-medium">{vend.nome}</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-center py-12" style={{ color: C.muted }}>
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aba Ligações ──────────────────────────────────────────────────────────────
function TabLigacoes({ ligacoes, currentUser, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    data: todayStr(),
    hora: nowTimeStr(),
    duracao: "",
    resultado: "",
    observacoes: "",
  });

  const save = () => {
    if (!form.data) return;
    onAdd({ ...form, responsavelId: currentUser.id });
    setShowForm(false);
    setForm({ data: todayStr(), hora: nowTimeStr(), duracao: "", resultado: "", observacoes: "" });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: C.green }}
        >
          <Plus size={14} /> Registrar ligação
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Data *</span>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Hora</span>
              <input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Duração</span>
              <input placeholder="Ex: 15 min" value={form.duracao} onChange={(e) => setForm((f) => ({ ...f, duracao: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Resultado</span>
              <input placeholder="Ex: Interesse confirmado" value={form.resultado} onChange={(e) => setForm((f) => ({ ...f, resultado: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
          </div>
          <label className="flex flex-col gap-1 mb-3">
            <span className="text-xs font-medium" style={{ color: C.secondary }}>Observações</span>
            <textarea rows={2} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} className={inputCls + " resize-none"} style={inputStyle} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
              Cancelar
            </button>
            <button onClick={save} className="text-sm px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: C.green }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Data", "Hora", "Duração", "Resultado", "Observações"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-xs" style={{ color: C.secondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...ligacoes]
              .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
              .map((l) => (
                <tr key={l.id} className="border-t" style={{ borderColor: C.row }}>
                  <td className="px-4 py-2.5" style={{ color: C.text }}>{fmtDate(l.data)}</td>
                  <td className="px-4 py-2.5" style={{ color: C.secondary }}>{l.hora || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: C.secondary }}>{l.duracao || "—"}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: C.dark }}>{l.resultado || "—"}</td>
                  <td className="px-4 py-2.5 max-w-xs truncate" style={{ color: C.secondary }}>{l.observacoes || "—"}</td>
                </tr>
              ))}
            {ligacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm" style={{ color: C.muted }}>
                  Nenhuma ligação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba E-mails ───────────────────────────────────────────────────────────────
function TabEmails({ emailsHistorico, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assunto: "",
    remetente: "",
    destinatario: "",
    data: todayStr(),
    status: "enviado",
  });

  const save = () => {
    if (!form.assunto.trim()) return;
    onAdd(form);
    setShowForm(false);
    setForm({ assunto: "", remetente: "", destinatario: "", data: todayStr(), status: "enviado" });
  };

  const statusCfg = {
    enviado: { label: "Enviado", color: "#3B82F6", bg: "#EFF6FF" },
    recebido: { label: "Recebido", color: C.greenDark, bg: C.greenBg },
    aguardando: { label: "Aguardando", color: C.orange, bg: C.orangeBg },
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: C.green }}
        >
          <Plus size={14} /> Registrar e-mail
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Assunto *</span>
              <input value={form.assunto} onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Remetente</span>
              <input value={form.remetente} onChange={(e) => setForm((f) => ({ ...f, remetente: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Destinatário</span>
              <input value={form.destinatario} onChange={(e) => setForm((f) => ({ ...f, destinatario: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Data</span>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Status</span>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputCls} style={inputStyle}>
                <option value="enviado">Enviado</option>
                <option value="recebido">Recebido</option>
                <option value="aguardando">Aguardando resposta</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
              Cancelar
            </button>
            <button onClick={save} className="text-sm px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: C.green }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Assunto", "Remetente", "Destinatário", "Data", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-xs" style={{ color: C.secondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...emailsHistorico]
              .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
              .map((e) => {
                const sc = statusCfg[e.status] || statusCfg.enviado;
                return (
                  <tr key={e.id} className="border-t" style={{ borderColor: C.row }}>
                    <td className="px-4 py-2.5 font-medium max-w-xs truncate" style={{ color: C.dark }}>{e.assunto || "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: C.secondary }}>{e.remetente || "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: C.secondary }}>{e.destinatario || "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.secondary }}>{fmtDate(e.data)}</td>
                    <td className="px-4 py-2.5">
                      <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            {emailsHistorico.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm" style={{ color: C.muted }}>
                  Nenhum e-mail registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba WhatsApp ──────────────────────────────────────────────────────────────
function TabWhatsApp({ clientNome }) {
  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: C.border }}
    >
      <div
        className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: C.border, background: "#F0FBF6" }}
      >
        <MessageCircle size={18} style={{ color: C.green }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: C.dark }}>
            {clientNome}
          </div>
          <div className="text-xs" style={{ color: C.secondary }}>WhatsApp</div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ background: "#E7F9F1" }}
        >
          <MessageCircle size={28} style={{ color: C.green }} />
        </div>
        <div className="text-sm font-semibold" style={{ color: C.dark }}>
          Integração WhatsApp
        </div>
        <div
          className="text-xs text-center max-w-xs leading-relaxed"
          style={{ color: C.secondary }}
        >
          Para visualizar e enviar mensagens via WhatsApp, conecte sua conta através de uma integração
          como Z-API, Evolution API ou Twilio.
        </div>
        <button
          className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: "#25D366" }}
        >
          Configurar integração
        </button>
      </div>
    </div>
  );
}

// ── Aba Arquivos ──────────────────────────────────────────────────────────────
const CATEGORIAS_ARQUIVO = [
  "Contratos",
  "Propostas",
  "Catálogos",
  "Fotos",
  "Vídeos",
  "PDFs",
  "Planilhas",
  "Outros",
];

function TabArquivos({ arquivos, onAdd, onDelete }) {
  const [catAtiva, setCatAtiva] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", categoria: "Outros", url: "" });

  const filtered =
    catAtiva === "Todos" ? arquivos : arquivos.filter((a) => a.categoria === catAtiva);

  const save = () => {
    if (!form.nome.trim()) return;
    onAdd(form);
    setShowForm(false);
    setForm({ nome: "", categoria: "Outros", url: "" });
  };

  const iconForCat = (cat) => {
    if (cat === "Fotos" || cat === "Vídeos") return Image;
    if (cat === "Planilhas") return BarChart3;
    if (cat === "PDFs") return FileText;
    return File;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["Todos", ...CATEGORIAS_ARQUIVO].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatAtiva(cat)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: catAtiva === cat ? C.dark : "#EEF1F4",
                color: catAtiva === cat ? "#fff" : C.text,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shrink-0"
          style={{ background: C.green }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Nome do arquivo *</span>
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Categoria</span>
              <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className={inputCls} style={inputStyle}>
                {CATEGORIAS_ARQUIVO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>URL (link do arquivo)</span>
              <input
                placeholder="https://drive.google.com/..."
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
              Cancelar
            </button>
            <button onClick={save} className="text-sm px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: C.green }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((a) => {
          const Icon = iconForCat(a.categoria);
          return (
            <div
              key={a.id}
              className="rounded-xl border bg-white p-3 flex items-center gap-3"
              style={{ borderColor: C.border }}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#EEF1F4" }}
              >
                <Icon size={16} style={{ color: C.secondary }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: C.dark }}>
                  {a.nome}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  {a.categoria} · {fmtDate(a.criadoEm ? a.criadoEm.slice(0, 10) : null)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md p-1.5 hover:bg-gray-100"
                    title="Visualizar"
                  >
                    <Eye size={13} style={{ color: C.secondary }} />
                  </a>
                )}
                {a.url && (
                  <a
                    href={a.url}
                    download
                    className="rounded-md p-1.5 hover:bg-gray-100"
                    title="Baixar"
                  >
                    <Download size={13} style={{ color: C.secondary }} />
                  </a>
                )}
                <button
                  onClick={() => onDelete(a.id)}
                  className="rounded-md p-1.5 hover:bg-red-50"
                  title="Excluir"
                >
                  <Trash2 size={13} style={{ color: C.red }} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-sm text-center py-10" style={{ color: C.muted }}>
            Nenhum arquivo nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aba Financeiro ────────────────────────────────────────────────────────────
function TabFinanceiro({ client }) {
  const limiteCredito = Number(client.limiteCredito) || 0;

  const secoes = [
    { title: "Boletos", desc: "Nenhum boleto cadastrado." },
    { title: "Duplicatas", desc: "Nenhuma duplicata cadastrada." },
    { title: "Títulos em aberto", desc: "Nenhum título em aberto." },
    { title: "Histórico financeiro", desc: "Nenhum histórico disponível." },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Limite de Crédito</div>
          <div className="text-xl font-bold" style={{ color: C.dark }}>{brl(limiteCredito)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Saldo Disponível</div>
          <div className="text-xl font-bold" style={{ color: C.greenDark }}>{brl(limiteCredito)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#FDE8E8" }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Em aberto</div>
          <div className="text-xl font-bold" style={{ color: C.red }}>{brl(0)}</div>
        </div>
      </div>

      {/* Seções */}
      {secoes.map(({ title, desc }) => (
        <div key={title} className="rounded-xl border bg-white" style={{ borderColor: C.border }}>
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "#F0F1F3" }}
          >
            <div className="text-sm font-semibold" style={{ color: C.dark }}>{title}</div>
            <button
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: C.green }}
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>
          <div className="px-4 py-8 text-center text-sm" style={{ color: C.muted }}>
            {desc}
          </div>
        </div>
      ))}

      {/* Aviso integração */}
      <div
        className="rounded-lg border px-4 py-3 flex items-start gap-2"
        style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}
      >
        <Info size={15} style={{ color: "#92400E", marginTop: 1 }} />
        <div className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
          Para dados financeiros completos (boletos, duplicatas, inadimplência em tempo real),
          conecte o sistema a um ERP ou integração financeira de sua preferência.
        </div>
      </div>
    </div>
  );
}

// ── Aba Pedidos ───────────────────────────────────────────────────────────────
function TabPedidos({ pedidos, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    numero: "",
    data: todayStr(),
    valor: "",
    situacao: "pendente",
    transportadora: "",
    previsaoEntrega: "",
    notaFiscal: "",
    produtos: "",
  });
  const [expandedId, setExpandedId] = useState(null);

  const save = () => {
    onAdd({ ...form, valor: Number(form.valor) || 0 });
    setShowForm(false);
    setForm({
      numero: "",
      data: todayStr(),
      valor: "",
      situacao: "pendente",
      transportadora: "",
      previsaoEntrega: "",
      notaFiscal: "",
      produtos: "",
    });
  };

  const statusCfg = {
    pendente: { label: "Pendente", color: C.orange, bg: C.orangeBg },
    aprovado: { label: "Aprovado", color: "#3B82F6", bg: "#EFF6FF" },
    entregue: { label: "Entregue", color: C.greenDark, bg: C.greenBg },
    cancelado: { label: "Cancelado", color: C.red, bg: C.redBg },
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: C.green }}
        >
          <Plus size={14} /> Novo pedido
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Número</span>
              <input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Data</span>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Valor (R$)</span>
              <input type="number" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Situação</span>
              <select value={form.situacao} onChange={(e) => setForm((f) => ({ ...f, situacao: e.target.value }))} className={inputCls} style={inputStyle}>
                {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Transportadora</span>
              <input value={form.transportadora} onChange={(e) => setForm((f) => ({ ...f, transportadora: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Previsão entrega</span>
              <input type="date" value={form.previsaoEntrega} onChange={(e) => setForm((f) => ({ ...f, previsaoEntrega: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Nota Fiscal</span>
              <input value={form.notaFiscal} onChange={(e) => setForm((f) => ({ ...f, notaFiscal: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-medium" style={{ color: C.secondary }}>Produtos</span>
              <input placeholder="Ex: Produto A x2, Produto B x1" value={form.produtos} onChange={(e) => setForm((f) => ({ ...f, produtos: e.target.value }))} className={inputCls} style={inputStyle} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.border, color: C.secondary }}>
              Cancelar
            </button>
            <button onClick={save} className="text-sm px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: C.green }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Nº", "Data", "Valor", "Situação", "Transportadora", "Previsão"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-xs" style={{ color: C.secondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...pedidos]
              .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
              .map((p) => {
                const sc = statusCfg[p.situacao] || statusCfg.pendente;
                const isOpen = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: C.row }}
                      onClick={() => setExpandedId(isOpen ? null : p.id)}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: C.dark }}>
                        #{p.numero || p.id.slice(-6)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.secondary }}>
                        {fmtDate(p.data)}
                      </td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: C.greenDark }}>
                        {brl(p.valor)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: C.secondary }}>
                        {p.transportadora || "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.secondary }}>
                        {fmtDate(p.previsaoEntrega)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t" style={{ borderColor: C.row, background: "#F9FAFB" }}>
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-xs font-medium" style={{ color: C.secondary }}>Nota Fiscal: </span>
                              <span style={{ color: C.text }}>{p.notaFiscal || "—"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-xs font-medium" style={{ color: C.secondary }}>Produtos: </span>
                              <span style={{ color: C.text }}>{p.produtos || "—"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm" style={{ color: C.muted }}>
                  Nenhum pedido cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba Dashboard ─────────────────────────────────────────────────────────────
function TabDashboard({ pedidos, client }) {
  const anoAtual = new Date().getFullYear();
  const anoAnterior = anoAtual - 1;

  const pedidosPorMes = useMemo(() => {
    const meses = Array(12)
      .fill(0)
      .map((_, i) => ({
        mes: i + 1,
        label: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i],
        anoAtual: 0,
        anoAnterior: 0,
      }));
    pedidos.forEach((p) => {
      if (!p.data) return;
      const ano = Number(p.data.slice(0, 4));
      const mes = Number(p.data.slice(5, 7)) - 1;
      if (ano === anoAtual) meses[mes].anoAtual += Number(p.valor) || 0;
      if (ano === anoAnterior) meses[mes].anoAnterior += Number(p.valor) || 0;
    });
    return meses;
  }, [pedidos, anoAtual, anoAnterior]);

  const totalAtual = pedidosPorMes.reduce((s, m) => s + m.anoAtual, 0);
  const totalAnterior = pedidosPorMes.reduce((s, m) => s + m.anoAnterior, 0);
  const variacaoPct =
    totalAnterior > 0
      ? ((totalAtual - totalAnterior) / totalAnterior * 100).toFixed(1)
      : null;
  const maxVal = Math.max(
    ...pedidosPorMes.flatMap((m) => [m.anoAtual, m.anoAnterior]),
    1
  );

  const pedidosOrdenados = [...pedidos].sort((a, b) =>
    (b.data || "").localeCompare(a.data || "")
  );
  const ultimaCompra = pedidosOrdenados[0]?.data;
  const diasSemComprar = ultimaCompra
    ? Math.floor((Date.now() - new Date(ultimaCompra).getTime()) / 86400000)
    : null;
  const ticketMedio =
    pedidos.length > 0
      ? pedidos.reduce((s, p) => s + (Number(p.valor) || 0), 0) / pedidos.length
      : 0;

  // Alertas inteligentes
  const alertas = useMemo(() => {
    const list = [];
    if (diasSemComprar !== null && diasSemComprar > 60)
      list.push({ icon: "🔴", texto: `Cliente sem comprar há ${diasSemComprar} dias`, color: C.red, bg: C.redBg });
    else if (diasSemComprar !== null && diasSemComprar > 30)
      list.push({ icon: "🟡", texto: `Último pedido há ${diasSemComprar} dias`, color: "#92400E", bg: C.orangeBg });

    const meta = Number(client.metaAnual) || 0;
    if (meta > 0) {
      const pct = (totalAtual / meta) * 100;
      if (pct >= 90)
        list.push({ icon: "🟢", texto: `Cliente próximo da meta (${pct.toFixed(0)}%)`, color: C.greenDark, bg: C.greenBg });
    }
    if (variacaoPct !== null && Number(variacaoPct) < -30)
      list.push({ icon: "🟠", texto: `Queda de ${Math.abs(variacaoPct)}% no faturamento vs. ano anterior`, color: "#9A3412", bg: "#FFF7ED" });
    if (client.potencialCompra === "Alto")
      list.push({ icon: "🟣", texto: "Alto potencial de compra identificado", color: "#5B21B6", bg: "#F5F3FF" });
    return list;
  }, [diasSemComprar, client, totalAtual, variacaoPct]);

  return (
    <div className="flex flex-col gap-5">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: C.secondary }}>
            Alertas inteligentes
          </div>
          <div className="flex flex-col gap-2">
            {alertas.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: a.bg, color: a.color }}>
                <span>{a.icon}</span> {a.texto}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Total {anoAtual}</div>
          <div className="text-xl font-bold" style={{ color: C.dark }}>{brl(totalAtual)}</div>
          {variacaoPct !== null && (
            <div
              className="text-xs flex items-center gap-1 mt-1"
              style={{ color: Number(variacaoPct) >= 0 ? C.greenDark : C.red }}
            >
              {Number(variacaoPct) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
              {variacaoPct}% vs {anoAnterior}
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Total {anoAnterior}</div>
          <div className="text-xl font-bold" style={{ color: C.secondary }}>{brl(totalAnterior)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Ticket médio</div>
          <div className="text-xl font-bold" style={{ color: C.dark }}>{brl(ticketMedio)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Qtd. pedidos</div>
          <div className="text-xl font-bold" style={{ color: C.dark }}>{pedidos.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Dias sem comprar</div>
          <div
            className="text-xl font-bold"
            style={{
              color:
                diasSemComprar === null
                  ? C.muted
                  : diasSemComprar > 60
                  ? C.red
                  : diasSemComprar > 30
                  ? C.orange
                  : C.greenDark,
            }}
          >
            {diasSemComprar !== null ? diasSemComprar : "—"}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="text-xs mb-1" style={{ color: C.muted }}>Última compra</div>
          <div className="text-base font-bold" style={{ color: C.dark }}>{fmtDate(ultimaCompra)}</div>
        </div>
      </div>

      {/* Gráfico evolução mensal */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: C.border }}>
        <div className="text-sm font-semibold mb-4" style={{ color: C.dark }}>
          Evolução mensal de compras
        </div>
        <div className="flex items-end gap-1.5 h-36">
          {pedidosPorMes.map((m) => (
            <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="w-full flex items-end gap-0.5 h-28">
                <div
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    background: "#DDE3EA",
                    height: `${(m.anoAnterior / maxVal) * 100}%`,
                    minHeight: m.anoAnterior > 0 ? 3 : 0,
                  }}
                  title={`${m.label} ${anoAnterior}: ${brl(m.anoAnterior)}`}
                />
                <div
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    background: C.green,
                    height: `${(m.anoAtual / maxVal) * 100}%`,
                    minHeight: m.anoAtual > 0 ? 3 : 0,
                  }}
                  title={`${m.label} ${anoAtual}: ${brl(m.anoAtual)}`}
                />
              </div>
              <div className="text-[10px] font-medium" style={{ color: C.muted }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: C.green }} />
            <span className="text-xs" style={{ color: C.secondary }}>{anoAtual}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#DDE3EA" }} />
            <span className="text-xs" style={{ color: C.secondary }}>{anoAnterior}</span>
          </div>
        </div>
        {pedidos.length === 0 && (
          <div className="text-xs text-center mt-3" style={{ color: C.muted }}>
            Cadastre pedidos na aba Pedidos para visualizar os gráficos.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aba Negócios ──────────────────────────────────────────────────────────────
function TabNegocios({ deals, stageById, vendedoraById }) {
  return (
    <div className="flex flex-col gap-3">
      {deals.map((deal) => {
        const stage = stageById(deal.etapa);
        const vend = vendedoraById(deal.vendedoraId);
        const sc = {
          color: stage?.won ? C.greenDark : stage?.closed ? C.red : C.text,
          bg: stage?.won ? C.greenBg : stage?.closed ? C.redBg : "#EEF1F4",
        };
        return (
          <div
            key={deal.id}
            className="rounded-xl border bg-white p-4"
            style={{ borderColor: C.border }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-2" style={{ color: C.dark }}>
                  {deal.titulo}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={sc.color} bg={sc.bg}>
                    {stage?.nome || deal.etapa}
                  </Badge>
                  {vend && (
                    <span className="text-xs" style={{ color: C.muted }}>{vend.nome}</span>
                  )}
                  {deal.previsaoFechamento && (
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: C.muted }}
                    >
                      <Calendar size={10} /> {fmtDate(deal.previsaoFechamento)}
                    </span>
                  )}
                  {deal.contato && (
                    <span className="text-xs" style={{ color: C.secondary }}>
                      Contato: {deal.contato}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-lg font-bold shrink-0" style={{ color: C.green }}>
                {brl(deal.valor)}
              </div>
            </div>
          </div>
        );
      })}
      {deals.length === 0 && (
        <div className="text-sm text-center py-12" style={{ color: C.muted }}>
          Nenhum negócio vinculado a este cliente.
        </div>
      )}
    </div>
  );
}

// ── Aba Dados do Cliente ──────────────────────────────────────────────────────
function TabDados({ client, onUpdate }) {
  const [form, setForm] = useState({ ...client });
  const [saved, setSaved] = useState(false);

  const save = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const F = ({ label, name, type = "text", options, span = 1 }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: C.secondary }}>{label}</span>
        {options ? (
          <select
            value={form[name] || ""}
            onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">—</option>
            {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={form[name] || ""}
            onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
            className={inputCls}
            style={inputStyle}
          />
        )}
      </label>
    </div>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
          style={{ background: saved ? C.greenDark : C.green }}
        >
          <Save size={14} /> {saved ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>

      <div
        className="rounded-xl border bg-white p-5 flex flex-col gap-6"
        style={{ borderColor: C.border }}
      >
        {/* Identificação */}
        <section>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Identificação
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Nome" name="nome" span={2} />
            <F label="Empresa" name="empresa" />
            <F label="Cargo" name="cargo" />
            <F label="CPF / CNPJ" name="cpfCnpj" />
            <F label="Inscrição Estadual" name="inscricaoEstadual" />
            <F label="Segmento" name="segmento" />
            <F label="Site" name="site" type="url" />
            <F label="Tipo" name="revendaOuClienteFinal" options={[{ v: "revenda", l: "Revenda" }, { v: "cliente_final", l: "Cliente Final" }]} />
            <F label="Situação" name="situacao" options={[{ v: "ativo", l: "Ativo" }, { v: "inativo", l: "Inativo" }]} />
          </div>
        </section>

        {/* Contato */}
        <section>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Contato
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Telefone" name="telefone" type="tel" />
            <F label="Celular" name="celulares" type="tel" />
            <F label="E-mail principal" name="email" type="email" />
            <F label="E-mails adicionais" name="emailsAdicionais" />
          </div>
        </section>

        {/* Endereço */}
        <section>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Endereço
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Endereço" name="endereco" span={2} />
            <F label="Número" name="numero" />
            <F label="Complemento" name="complemento" />
            <F label="Bairro" name="bairro" />
            <F label="CEP" name="cep" />
            <F label="Cidade" name="cidade" />
            <F label="Estado (UF)" name="estado" />
            <F label="País" name="pais" />
          </div>
        </section>

        {/* Comercial */}
        <section>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Informações Comerciais
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F
              label="Potencial de Compra"
              name="potencialCompra"
              options={[{ v: "Alto", l: "Alto" }, { v: "Médio", l: "Médio" }, { v: "Baixo", l: "Baixo" }]}
            />
            <F label="Condição Comercial" name="condicaoComercial" />
            <F label="Forma de Pagamento Preferencial" name="formaPagamentoPreferencial" />
            <F label="Transportadora Preferencial" name="transportadoraPreferencial" />
            <F label="Limite de Crédito (R$)" name="limiteCredito" type="number" />
            <F label="Meta Anual (R$)" name="metaAnual" type="number" />
            <F label="Equipamentos Adquiridos" name="equipamentosAdquiridos" span={2} />
            <F label="Requisitos Técnicos" name="requisitosTecnicos" span={2} />
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
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

  const client = db.clients.find((c) => c.id === clienteId);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <User size={40} style={{ color: C.muted }} />
        <div className="text-base font-semibold" style={{ color: C.dark }}>
          Cliente não encontrado
        </div>
        <button
          onClick={() => navigate("/clientes")}
          className="text-sm font-medium"
          style={{ color: C.green }}
        >
          ← Voltar para clientes
        </button>
      </div>
    );
  }

  // Dados filtrados por cliente
  const clientDeals = db.deals.filter((d) => d.clientId === clienteId);
  const clientActivities = db.activities.filter((a) => a.clientId === clienteId);
  const clientLigacoes = (db.ligacoes || []).filter((l) => l.clientId === clienteId);
  const clientPedidos = (db.pedidos || []).filter((p) => p.clientId === clienteId);
  const clientArquivos = (db.arquivos || []).filter((a) => a.clientId === clienteId);
  const clientEmailsHist = (db.emailsHistorico || []).filter((e) => e.clientId === clienteId);

  // Handlers
  const updateClient = (patch) => {
    setDb((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === clienteId ? { ...c, ...patch } : c)),
    }));
  };

  const addLigacao = (lig) => {
    setDb((prev) => ({
      ...prev,
      ligacoes: [...(prev.ligacoes || []), { id: uid("lig"), clientId: clienteId, ...lig }],
    }));
    showToast("Ligação registrada.");
  };

  const addEmailHistorico = (em) => {
    setDb((prev) => ({
      ...prev,
      emailsHistorico: [
        ...(prev.emailsHistorico || []),
        { id: uid("em"), clientId: clienteId, ...em },
      ],
    }));
    showToast("E-mail registrado.");
  };

  const addArquivo = (arq) => {
    setDb((prev) => ({
      ...prev,
      arquivos: [
        ...(prev.arquivos || []),
        {
          id: uid("arq"),
          clientId: clienteId,
          criadoEm: new Date().toISOString(),
          usuarioNome: currentUser.nome,
          ...arq,
        },
      ],
    }));
    showToast("Arquivo adicionado.");
  };

  const deleteArquivo = (id) => {
    setDb((prev) => ({
      ...prev,
      arquivos: (prev.arquivos || []).filter((a) => a.id !== id),
    }));
    showToast("Arquivo removido.");
  };

  const addPedido = (ped) => {
    setDb((prev) => ({
      ...prev,
      pedidos: [
        ...(prev.pedidos || []),
        { id: uid("ped"), clientId: clienteId, ...ped },
      ],
    }));
    showToast("Pedido cadastrado.");
  };

  const addActivityObs = (descricao) => {
    setDb((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          id: uid("a"),
          clientId: clienteId,
          dealId: null,
          vendedoraId: currentUser.id,
          tipo: "Observação",
          descricao,
          data: todayStr(),
          hora: nowTimeStr(),
          concluida: true,
        },
      ],
    }));
    showToast("Observação registrada.");
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
          style={{ color: C.secondary }}
        >
          <ArrowLeft size={14} /> Clientes
        </button>
        <ChevronRight size={14} style={{ color: C.muted }} />
        <span className="text-sm font-medium" style={{ color: C.dark }}>
          {client.nome}
        </span>
        {client.empresa && (
          <>
            <ChevronRight size={14} style={{ color: C.muted }} />
            <span className="text-sm" style={{ color: C.secondary }}>
              {client.empresa}
            </span>
          </>
        )}
      </div>

      {/* Layout de duas colunas */}
      <div className="flex gap-5 items-start">
        {/* Coluna esquerda — 30% */}
        <div className="w-[30%] shrink-0 flex flex-col gap-4 sticky top-0 self-start">
          <ObservacaoFixa client={client} onUpdate={updateClient} />
          <ClientSummaryCard
            client={client}
            vendedoraById={vendedoraById}
            onUpdate={updateClient}
          />
          <IndicatorsPanel client={client} pedidos={clientPedidos} />
        </div>

        {/* Coluna direita — 70% */}
        <div className="flex-1 min-w-0">
          {/* Menu de abas */}
          <div
            className="flex border-b mb-5 overflow-x-auto"
            style={{ borderColor: C.border }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: abaAtiva === tab.id ? C.green : "transparent",
                  color: abaAtiva === tab.id ? C.green : C.secondary,
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba ativa */}
          {abaAtiva === "historico" && (
            <TabHistorico
              activities={clientActivities}
              ligacoes={clientLigacoes}
              pedidos={clientPedidos}
              arquivos={clientArquivos}
              vendedoraById={vendedoraById}
              onAddObservacao={addActivityObs}
            />
          )}
          {abaAtiva === "ligacoes" && (
            <TabLigacoes
              ligacoes={clientLigacoes}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onAdd={addLigacao}
            />
          )}
          {abaAtiva === "emails" && (
            <TabEmails emailsHistorico={clientEmailsHist} onAdd={addEmailHistorico} />
          )}
          {abaAtiva === "whatsapp" && <TabWhatsApp clientNome={client.nome} />}
          {abaAtiva === "arquivos" && (
            <TabArquivos
              arquivos={clientArquivos}
              onAdd={addArquivo}
              onDelete={deleteArquivo}
            />
          )}
          {abaAtiva === "financeiro" && <TabFinanceiro client={client} />}
          {abaAtiva === "pedidos" && (
            <TabPedidos pedidos={clientPedidos} onAdd={addPedido} />
          )}
          {abaAtiva === "dashboard" && (
            <TabDashboard pedidos={clientPedidos} client={client} />
          )}
          {abaAtiva === "negocios" && (
            <TabNegocios
              deals={clientDeals}
              stageById={stageById}
              vendedoraById={vendedoraById}
            />
          )}
          {abaAtiva === "dados" && (
            <TabDados client={client} onUpdate={updateClient} />
          )}
        </div>
      </div>
    </div>
  );
}
