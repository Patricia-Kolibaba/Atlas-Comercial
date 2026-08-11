import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { HashRouter, Routes, Route, NavLink, Navigate, Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "./supabaseClient";
import ClientePage from "./ClientePage";
import {
  Plus, Upload, Users, Phone, Mail, Building2, Calendar, Clock,
  CheckCircle2, Circle, ChevronDown, X, LayoutGrid, List as ListIcon,
  UserPlus, Shuffle, Trash2, AlertCircle, Search, DollarSign,
  Settings2, ArrowRight, LogIn, LogOut, RotateCcw,
  LayoutDashboard, Package, BarChart3, Sliders, Eye, EyeOff, Edit3, RefreshCw
} from "lucide-react";

// ---------- helpers ----------
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 5);

const DEFAULT_STAGES = [
  { id: "novo", nome: "Novo Lead" },
  { id: "contato", nome: "Contato Feito" },
  { id: "proposta", nome: "Proposta Enviada" },
  { id: "negociacao", nome: "Negociação" },
  { id: "ganho", nome: "Fechado Ganho", closed: true, won: true, protected: true },
  { id: "perdido", nome: "Fechado Perdido", closed: true, won: false, protected: true },
];

const ACTIVITY_TYPES = ["Ligação", "Reunião", "E-mail", "Tarefa"];
const SITUACOES_CLIENTE = ["Revenda", "Cliente Final", "Cliente Software", "Cliente Corporativo"];
const COLUNAS_CLIENTES_DEF = [
  { key: "empresa", label: "Razão Social" },
  { key: "nome", label: "Contato" },
  { key: "telefone", label: "Telefone" },
  { key: "email", label: "E-mail" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "UF" },
  { key: "situacao", label: "Situação" },
  { key: "vendedora", label: "Vendedora", adminOnly: true },
];

function seedData() {
  const v1 = uid("v"); const v2 = uid("v");
  const c1 = uid("c"); const c2 = uid("c"); const c3 = uid("c"); const c4 = uid("c");
  const d1 = uid("d"); const d2 = uid("d"); const d3 = uid("d");
  return {
    stages: DEFAULT_STAGES,
    vendedoras: [
      { id: v1, nome: "Fernanda Souza", email: "fernanda@empresa.com" },
      { id: v2, nome: "Camila Rocha", email: "camila@empresa.com" },
    ],
    clients: [
      { id: c1, nome: "João Martins", empresa: "Grupo Martins Ltda", telefone: "(41) 99811-2233", email: "joao@martins.com", cidade: "Curitiba", estado: "PR", situacao: "Revenda", vendedoraId: v1 },
      { id: c2, nome: "Patrícia Lima", empresa: "Lima Contabilidade", telefone: "(41) 99022-1188", email: "patricia@limacont.com", cidade: "Curitiba", estado: "PR", situacao: "Cliente Final", vendedoraId: v1 },
      { id: c3, nome: "Roberto Alves", empresa: "Alves Distribuidora", telefone: "(41) 98877-4455", email: "roberto@alvesdist.com", cidade: "Londrina", estado: "PR", situacao: "Revenda", vendedoraId: v2 },
      { id: c4, nome: "Beatriz Nunes", empresa: "Nunes Engenharia", telefone: "(41) 99344-7766", email: "beatriz@nunesengenharia.com", cidade: "Maringá", estado: "PR", situacao: "Cliente Corporativo", vendedoraId: null },
    ],
    deals: [
      { id: d1, clientId: c1, titulo: "Plano anual - Martins Ltda", valor: 18000, etapa: "proposta", vendedoraId: v1, criadoEm: todayStr() },
      { id: d2, clientId: c2, titulo: "Consultoria - Lima Cont.", valor: 6500, etapa: "negociacao", vendedoraId: v1, criadoEm: todayStr() },
      { id: d3, clientId: c3, titulo: "Renovação - Alves Distrib.", valor: 24000, etapa: "novo", vendedoraId: v2, criadoEm: todayStr() },
    ],
    activities: [
      { id: uid("a"), clientId: c1, dealId: d1, vendedoraId: v1, tipo: "Ligação", descricao: "Ligar para alinhar proposta", data: todayStr(), hora: "09:00", concluida: false },
      { id: uid("a"), clientId: c2, dealId: d2, vendedoraId: v1, tipo: "E-mail", descricao: "Enviar contrato revisado", data: "2026-07-15", hora: "14:00", concluida: false },
      { id: uid("a"), clientId: c3, dealId: d3, vendedoraId: v2, tipo: "Reunião", descricao: "Reunião de apresentação", data: todayStr(), hora: "16:30", concluida: false },
      { id: uid("a"), clientId: c1, dealId: d1, vendedoraId: v1, tipo: "Ligação", descricao: "Primeiro contato", data: "2026-07-10", hora: "10:00", concluida: true },
    ],
  };
}

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors";
const inputStyle = { borderColor: "#D7DCE3", background: "#fff" };

// ---------------- Autenticação (Supabase Auth real) ----------------
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = ainda carregando
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    (async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle();
      if (error) { setProfileError(error.message); return; }
      setProfile(data);
    })();
  }, [session]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, profile, profileError, signIn, signOut, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError("E-mail ou senha incorretos.");
  };

  const sendReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Digite seu e-mail para redefinir a senha."); return; }
    setError(""); setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setForgotLoading(false);
    if (error) { setError("Não foi possível enviar o e-mail. Verifique o endereço."); return; }
    setForgotSent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] h-full w-full" style={{ background: "#F5F6F8", fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}>
      <div className="w-full max-w-sm rounded-xl border bg-white p-6" style={{ borderColor: "#E4E7EC" }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: "#1FBE7A", color: "#0E1620" }}>V</div>
          <span className="font-semibold text-lg" style={{ color: "#172433" }}>Vendaflow CRM</span>
        </div>

        {/* Modo: recuperar senha */}
        {forgotMode ? (
          forgotSent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#172433" }}>E-mail enviado!</p>
              <p className="text-xs mb-4" style={{ color: "#667085" }}>
                Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para redefinir sua senha.
              </p>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="text-sm font-medium" style={{ color: "#1FBE7A" }}>
                ← Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={sendReset}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#172433" }}>Redefinir senha</p>
              <p className="text-xs mb-4" style={{ color: "#667085" }}>
                Digite seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>
              {error && <div className="text-xs rounded-md px-2.5 py-1.5 mb-3" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
              <label className="flex flex-col gap-1 mb-4">
                <span className="text-xs font-medium" style={{ color: "#475467" }}>E-mail</span>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} />
              </label>
              <button type="submit" disabled={forgotLoading} className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 mb-3" style={{ background: "#1FBE7A" }}>
                {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
              <button type="button" onClick={() => { setForgotMode(false); setError(""); }}
                className="w-full text-sm text-center" style={{ color: "#667085" }}>
                ← Voltar para o login
              </button>
            </form>
          )
        ) : (
          /* Modo: login normal */
          <form onSubmit={submit}>
            {error && <div className="text-xs rounded-md px-2.5 py-1.5 mb-3" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
            <label className="flex flex-col gap-1 mb-3">
              <span className="text-xs font-medium" style={{ color: "#475467" }}>E-mail</span>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} />
            </label>
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#475467" }}>Senha</span>
                <button type="button" onClick={() => { setForgotMode(true); setError(""); }}
                  className="text-xs" style={{ color: "#1FBE7A" }}>
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#98A2B3", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="mb-5" />
            <button type="submit" disabled={loading} className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: "#1FBE7A" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <div className="text-xs mt-4 text-center" style={{ color: "#98A2B3" }}>
              Sua conta é criada pelo administrador no painel do Supabase.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------- Sidebar (novo menu, com rotas reais) ----------------
function AppSidebar({ isAdmin, pendingCount, nome, onLogout }) {
  const navItem = (to, label, Icon, badge) => (
    <NavLink
      to={to}
      className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
      style={({ isActive }) => ({
        background: isActive ? "rgba(31,190,122,0.16)" : "transparent",
        color: isActive ? "#3FE0A0" : "#B6C0CC",
      })}
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
      {!!badge && (
        <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: "#E5484D", color: "#fff" }}>{badge}</span>
      )}
    </NavLink>
  );

  return (
    <div className="w-60 shrink-0 flex flex-col" style={{ background: "#16202D" }}>
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: "#1FBE7A", color: "#0E1620" }}>V</div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Vendaflow CRM</span>
        </div>
        <div className="flex flex-col gap-1">
          {navItem("/dashboard", "Dashboard", LayoutDashboard)}
          {navItem("/atividades", "Atividades", Clock, pendingCount)}
          {navItem("/negociacoes", "Negociações", LayoutGrid)}
          {navItem("/clientes", "Clientes", Users)}
          {navItem("/produtos", "Produtos", Package)}
          {isAdmin && navItem("/relatorios", "Relatórios", BarChart3)}
          {isAdmin && navItem("/distribuir", "Distribuir", Shuffle)}
          {isAdmin && navItem("/importar", "Importar", Upload)}
          {isAdmin && navItem("/configuracoes", "Configurações", Sliders)}
        </div>
      </div>
      <div className="flex-1" />
      <div className="px-4 pb-5">
        <div className="text-xs mb-2 truncate" style={{ color: "#8A97A6" }}>{nome}</div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs font-medium" style={{ color: "#B6C0CC" }}>
          <LogOut size={13} /> Sair
        </button>
      </div>
    </div>
  );
}

function EmConstrucao({ titulo }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "#E4E7EC" }}>
      <div className="text-base font-semibold mb-1" style={{ color: "#172433" }}>{titulo}</div>
      <div className="text-sm" style={{ color: "#98A2B3" }}>Essa área faz parte da nova arquitetura e será construída na próxima etapa.</div>
    </div>
  );
}

// ---------------- CRM Shell (dados + rotas) ----------------
function CrmShell({ isAdmin, currentUser, nome, onLogout }) {
  const [db, setDb] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [toast, setToast] = useState(null);

  const lastSyncedRef = useRef(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase.from("crm_data").select("data").eq("id", "main").maybeSingle();
      if (error) { setLoadError(error.message); setLoaded(true); return; }
      let data = row?.data || null;
      if (!data) {
        data = seedData();
        const { error: insertErr } = await supabase.from("crm_data").insert({ id: "main", data });
        if (insertErr) { setLoadError(insertErr.message); setLoaded(true); return; }
      }
      if (!data.stages) data.stages = DEFAULT_STAGES;
      lastSyncedRef.current = JSON.stringify(data);
      setDb(data);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !db) return;
    const serialized = JSON.stringify(db);
    if (serialized === lastSyncedRef.current) return;
    const t = setTimeout(async () => {
      lastSyncedRef.current = serialized;
      const { error } = await supabase.from("crm_data").update({ data: db, updated_at: new Date().toISOString() }).eq("id", "main");
      if (error) console.error("Falha ao salvar no Supabase:", error.message);
    }, 400);
    return () => clearTimeout(t);
  }, [db, loaded]);

  useEffect(() => {
    const channel = supabase
      .channel("crm_data_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "crm_data", filter: "id=eq.main" }, (payload) => {
        const incoming = JSON.stringify(payload.new.data);
        if (incoming === lastSyncedRef.current) return;
        lastSyncedRef.current = incoming;
        setDb(payload.new.data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] p-6" style={{ background: "#F5F6F8" }}>
        <div className="max-w-md rounded-xl border bg-white p-5 text-sm" style={{ borderColor: "#F3B7B9", color: "#C0393E" }}>
          <div className="font-semibold mb-1">Não foi possível conectar ao Supabase</div>
          <div style={{ color: "#667085" }}>{loadError}</div>
        </div>
      </div>
    );
  }

  if (!loaded || !db) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]" style={{ background: "#F5F6F8" }}>
        <div className="text-sm" style={{ color: "#667085" }}>Carregando CRM…</div>
      </div>
    );
  }

  const scopedClients = db.clients.filter(c => isAdmin || c.vendedoraId === currentUser.id);
  const scopedDeals = db.deals.filter(d => isAdmin || d.vendedoraId === currentUser.id);
  const scopedActivities = db.activities.filter(a => isAdmin || a.vendedoraId === currentUser.id);

  const clientById = (id) => db.clients.find(c => c.id === id);
  const vendedoraById = (id) => db.vendedoras.find(v => v.id === id);
  const stageById = (id) => db.stages.find(s => s.id === id);

  const updateDeal = (dealId, patch) =>
    setDb(prev => ({ ...prev, deals: prev.deals.map(d => d.id === dealId ? { ...d, ...patch } : d) }));

  const addActivity = (act) =>
    setDb(prev => ({ ...prev, activities: [...prev.activities, { id: uid("a"), concluida: false, ...act }] }));

  const toggleActivity = (id) =>
    setDb(prev => ({ ...prev, activities: prev.activities.map(a => a.id === id ? { ...a, concluida: !a.concluida } : a) }));

  const registrarResultadoAtividade = (id, { texto, acao, novaData, novaHora }) =>
    setDb(prev => ({
      ...prev,
      activities: prev.activities.map(a => {
        if (a.id !== id) return a;
        const entrada = { texto: texto.trim(), acao, quando: `${todayStr()} ${nowTimeStr()}` };
        const historico = [...(a.historico || []), entrada];
        if (acao === "reagendar") {
          return { ...a, historico, resultado: texto.trim(), concluida: false, data: novaData, hora: novaHora };
        }
        return { ...a, historico, resultado: texto.trim(), concluida: true };
      }),
    }));

  const addClient = (client) =>
    setDb(prev => ({ ...prev, clients: [...prev.clients, { id: uid("c"), ...client }] }));

  const assignClient = (clientId, vendedoraId, autoCreateDeal = true) => {
    setDb(prev => {
      const clients = prev.clients.map(c => c.id === clientId ? { ...c, vendedoraId } : c);
      let deals = prev.deals;
      const client = prev.clients.find(c => c.id === clientId);
      const hasOpenDeal = prev.deals.some(d => d.clientId === clientId);
      if (autoCreateDeal && !hasOpenDeal && client) {
        deals = [...deals, {
          id: uid("d"), clientId, titulo: `Negócio - ${client.nome}`,
          valor: 0, etapa: prev.stages[0].id, vendedoraId, criadoEm: todayStr(),
        }];
      } else {
        deals = deals.map(d => d.clientId === clientId ? { ...d, vendedoraId } : d);
      }
      return { ...prev, clients, deals };
    });
  };

  const distributeAuto = () => {
    const unassigned = db.clients.filter(c => !c.vendedoraId);
    if (unassigned.length === 0 || db.vendedoras.length === 0) return;
    let i = 0;
    unassigned.forEach(c => {
      const v = db.vendedoras[i % db.vendedoras.length];
      assignClient(c.id, v.id, true);
      i++;
    });
    showToast(`${unassigned.length} cliente(s) distribuído(s) automaticamente.`);
  };

  const addStage = (nome) => {
    if (!nome.trim()) return;
    setDb(prev => {
      const stages = [...prev.stages];
      const insertAt = stages.findIndex(s => s.protected);
      const newStage = { id: uid("etapa"), nome: nome.trim() };
      stages.splice(insertAt === -1 ? stages.length : insertAt, 0, newStage);
      return { ...prev, stages };
    });
  };

  const removeStage = (stageId) => {
    const stage = stageById(stageId);
    if (stage?.protected) { showToast("Essa etapa é padrão e não pode ser excluída."); return; }
    const inUse = db.deals.some(d => d.etapa === stageId);
    if (inUse) { showToast("Mova os negócios dessa etapa antes de excluí-la."); return; }
    setDb(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== stageId) }));
  };

  const renameStage = (stageId, novoNome) => {
    if (!novoNome.trim()) return;
    setDb(prev => ({ ...prev, stages: prev.stages.map(s => s.id === stageId ? { ...s, nome: novoNome.trim() } : s) }));
  };

  const bulkAssignClients = (clientIds, vendedoraId) => {
    if (!clientIds.length) return;
    clientIds.forEach(id => assignClient(id, vendedoraId || null, true));
    const vend = db.vendedoras.find(v => v.id === vendedoraId);
    showToast(`${clientIds.length} cliente(s) atribuído(s) a ${vend ? vend.nome : "Não atribuído"}.`);
  };

  const deleteVendedora = (vendedoraId) => {
    const hasClients = db.clients.some(c => c.vendedoraId === vendedoraId);
    if (hasClients) { showToast("Essa vendedora ainda tem clientes atribuídos. Reatribua-os (na aba Clientes) antes de excluir."); return; }
    const nomeV = db.vendedoras.find(v => v.id === vendedoraId)?.nome || "Vendedora";
    setDb(prev => ({
      ...prev,
      vendedoras: prev.vendedoras.filter(v => v.id !== vendedoraId),
      deals: prev.deals.filter(d => d.vendedoraId !== vendedoraId),
      activities: prev.activities.filter(a => a.vendedoraId !== vendedoraId),
    }));
    showToast(`${nomeV} foi excluída.`);
  };

  const pendingCount = scopedActivities.filter(a => !a.concluida && a.data <= todayStr()).length;

  return (
    <HashRouter>
      <div className="flex h-full min-h-[640px] w-full overflow-hidden" style={{ background: "#F5F6F8", fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}>
        <AppSidebar isAdmin={isAdmin} pendingCount={pendingCount} nome={nome} onLogout={onLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#E4E7EC", background: "#fff" }}>
            <h1 className="text-lg font-semibold" style={{ color: "#172433" }}>Vendaflow CRM</h1>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: isAdmin ? "#172433" : "#1FBE7A" }}>
                {nome.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: "#172433" }}>{nome}</span>
              {isAdmin && <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EEF1F4", color: "#667085" }}>admin</span>}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<EmConstrucao titulo="Dashboard" />} />
              <Route path="/atividades" element={
                <AtividadesView
                  activities={scopedActivities} clientById={clientById}
                  toggleActivity={toggleActivity}
                  onNewActivity={() => setShowActivityModal(true)}
                  onEditActivity={(id) => setEditingActivityId(id)}
                  isAdmin={isAdmin} vendedoras={db.vendedoras} vendedoraById={vendedoraById}
                />
              } />
              <Route path="/negociacoes" element={
                <PipelineView
                  db={db} scopedDeals={scopedDeals} isAdmin={isAdmin}
                  clientById={clientById} vendedoraById={vendedoraById}
                  updateDeal={updateDeal} scopedActivities={scopedActivities}
                  onNewDeal={() => setShowDealModal(true)}
                  addStage={addStage} removeStage={removeStage} renameStage={renameStage}
                />
              } />
              <Route path="/clientes" element={
                <ClientesView
                  clients={scopedClients} isAdmin={isAdmin} vendedoraById={vendedoraById} currentUser={currentUser}
                  deals={db.deals} stages={db.stages} stageById={stageById}
                  onNewClient={() => setShowClientModal(true)}
                  vendedoras={db.vendedoras} assignClient={assignClient}
                  bulkAssignClients={bulkAssignClients}
                />
              } />
              <Route path="/clientes/:clienteId" element={
                <ClientePage
                  db={db} setDb={setDb} isAdmin={isAdmin} currentUser={currentUser}
                  vendedoraById={vendedoraById} stageById={stageById} showToast={showToast}
                />
              } />
              <Route path="/produtos" element={<EmConstrucao titulo="Produtos" />} />
              {isAdmin && <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />}
              {isAdmin && <Route path="/distribuir" element={
                <DistribuirView
                  clients={db.clients} vendedoras={db.vendedoras}
                  assignClient={assignClient} bulkAssignClients={bulkAssignClients} distributeAuto={distributeAuto}
                />
              } />}
              {isAdmin && <Route path="/importar" element={
                <ImportarView setDb={setDb} showToast={showToast} vendedoras={db.vendedoras} clients={db.clients} deleteVendedora={deleteVendedora} />
              } />}
              {isAdmin && <Route path="/configuracoes" element={<EmConstrucao titulo="Configurações" />} />}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>

        {showActivityModal && (
          <ActivityModal
            isAdmin={isAdmin} currentUser={currentUser}
            clients={isAdmin ? db.clients : scopedClients}
            deals={isAdmin ? db.deals : scopedDeals}
            vendedoras={db.vendedoras}
            onClose={() => setShowActivityModal(false)}
            onSave={(act) => { addActivity(act); setShowActivityModal(false); showToast("Atividade criada."); }}
          />
        )}
        {showDealModal && (
          <DealModal
            isAdmin={isAdmin} currentUser={currentUser}
            clients={isAdmin ? db.clients : scopedClients}
            vendedoras={db.vendedoras} stages={db.stages}
            onClose={() => setShowDealModal(false)}
            onSave={({ deal, atividade }) => {
              const newDealId = uid("d");
              setDb(prev => {
                const deals = [...prev.deals, { id: newDealId, criadoEm: todayStr(), ...deal }];
                const activities = atividade
                  ? [...prev.activities, { id: uid("a"), concluida: false, dealId: newDealId, clientId: deal.clientId, vendedoraId: deal.vendedoraId, ...atividade }]
                  : prev.activities;
                return { ...prev, deals, activities };
              });
              setShowDealModal(false);
              showToast(atividade ? "Negócio e atividade criados." : "Negócio criado.");
            }}
          />
        )}
        {showClientModal && (
          <ClientModal
            isAdmin={isAdmin} currentUser={currentUser} vendedoras={db.vendedoras}
            onClose={() => setShowClientModal(false)}
            onSave={(c) => { addClient(c); setShowClientModal(false); showToast("Cliente adicionado."); }}
          />
        )}
        {editingActivityId && (() => {
          const activity = db.activities.find(a => a.id === editingActivityId);
          if (!activity) return null;
          return (
            <ActivityResultModal
              activity={activity}
              client={clientById(activity.clientId)}
              onClose={() => setEditingActivityId(null)}
              onSave={(payload) => {
                registrarResultadoAtividade(editingActivityId, payload);
                setEditingActivityId(null);
                showToast(payload.acao === "reagendar" ? "Atividade reagendada." : "Atividade encerrada.");
              }}
            />
          );
        })()}

        {toast && (
          <div className="fixed bottom-5 right-5 rounded-lg px-4 py-3 text-sm text-white shadow-lg z-50" style={{ background: "#172433" }}>
            {toast}
          </div>
        )}
      </div>
    </HashRouter>
  );
}
function AtividadesView({ activities, clientById, toggleActivity, onNewActivity, onEditActivity, isAdmin, vendedoras, vendedoraById }) {
  const navigate = useNavigate();
  const [filtroVendedora, setFiltroVendedora] = useState("");
  const todayS = todayStr();
  const filtered = isAdmin && filtroVendedora ? activities.filter(a => a.vendedoraId === filtroVendedora) : activities;
  const enriched = filtered.map(a => ({ ...a, red: !a.concluida && a.data <= todayS }));
  const key = (a) => `${a.data}${a.hora || "00:00"}`;
  const hojeAtrasadas = enriched.filter(a => a.red).sort((a, b) => key(a).localeCompare(key(b)));
  const proximas = enriched.filter(a => !a.concluida && !a.red).sort((a, b) => key(a).localeCompare(key(b)));
  const concluidas = enriched.filter(a => a.concluida).sort((a, b) => key(b).localeCompare(key(a)));

  const irParaCliente = (a) => {
    if (a.clientId) navigate(`/clientes/${a.clientId}`);
  };

  const TabelaAtividades = ({ items }) => (
    <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#E4E7EC" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            <th className="text-left px-4 py-2.5 w-8"></th>
            <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Atividade</th>
            <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Data e hora</th>
            <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Pessoa de contato</th>
            {isAdmin && <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Vendedora</th>}
            <th className="text-left px-4 py-2.5 font-medium w-16" style={{ color: "#667085" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(a => {
            const client = clientById(a.clientId);
            const vend = isAdmin ? vendedoraById(a.vendedoraId) : null;
            const [y, m, d] = a.data.split("-");
            return (
              <tr
                key={a.id}
                onClick={() => irParaCliente(a)}
                className="border-t"
                style={{ borderColor: "#F0F1F3", background: a.red ? "#FFF8F8" : "#fff", cursor: a.clientId ? "pointer" : "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F6F8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = a.red ? "#FFF8F8" : "#fff"; }}
              >
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleActivity(a.id)} className="shrink-0 flex">
                    {a.concluida ? <CheckCircle2 size={18} style={{ color: "#1FBE7A" }} /> : <Circle size={18} style={{ color: a.red ? "#E5484D" : "#98A2B3" }} />}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div
                    className="font-semibold"
                    style={{
                      color: a.concluida ? "#98A2B3" : a.red ? "#C0393E" : "#172433",
                      textDecoration: a.concluida ? "line-through" : "none",
                    }}
                  >
                    {a.tipo}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#667085" }}>{a.descricao || "Sem descrição"}</div>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: a.red ? "#E5484D" : "#475467" }}>
                  <div className="flex items-center gap-1.5"><Calendar size={12} /> {d}/{m}<Clock size={12} className="ml-1.5" /> {a.hora}</div>
                </td>
                <td className="px-4 py-2.5" style={{ color: "#344054" }}>{client?.nome || "—"}</td>
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    {vend && <span className="text-[11px] font-medium rounded-full px-2 py-0.5" style={{ background: "#EEF1F4", color: "#344054" }}>{vend.nome}</span>}
                  </td>
                )}
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditActivity(a.id)}
                    title="Editar / registrar resultado"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                    style={{ color: "#344054", border: "1px solid #D7DCE3" }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const Section = ({ title, items, tone }) =>
    items.length > 0 && (
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tone === "red" ? "#E5484D" : "#98A2B3" }}>
          {title} · {items.length}
        </div>
        <TabelaAtividades items={items} />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-sm" style={{ color: "#667085" }}>{enriched.filter(a => !a.concluida).length} atividade(s) pendente(s)</div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <select
              value={filtroVendedora}
              onChange={(e) => setFiltroVendedora(e.target.value)}
              className="text-sm rounded-lg border px-2.5 py-1.5"
              style={{ borderColor: "#D7DCE3", color: "#344054" }}
            >
              <option value="">Todas as vendedoras</option>
              {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          )}
          <button onClick={onNewActivity} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "#1FBE7A" }}>
            <Plus size={14} /> Nova atividade
          </button>
        </div>
      </div>
      <Section title="Hoje e atrasadas" items={hojeAtrasadas} tone="red" />
      <Section title="Próximas" items={proximas} />
      <Section title="Concluídas" items={concluidas} />
      {enriched.length === 0 && (
        <div className="text-sm text-center py-16" style={{ color: "#98A2B3" }}>Nenhuma atividade cadastrada ainda.</div>
      )}
    </div>
  );
}

function PipelineView({ db, scopedDeals, isAdmin, clientById, vendedoraById, updateDeal, scopedActivities, onNewDeal, addStage, removeStage, renameStage }) {
  const [showStageMgr, setShowStageMgr] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [editingStageId, setEditingStageId] = useState(null);
  const [editingStageName, setEditingStageName] = useState("");

  const pendingCountFor = (dealId) => scopedActivities.filter(a => a.dealId === dealId && !a.concluida).length;

  const startEdit = (stage) => { setEditingStageId(stage.id); setEditingStageName(stage.nome); };
  const commitEdit = () => {
    if (editingStageId) renameStage(editingStageId, editingStageName);
    setEditingStageId(null);
  };

  const fmtDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm" style={{ color: "#667085" }}>
          {scopedDeals.length} negócio(s) · total {brl(scopedDeals.reduce((s, d) => s + (Number(d.valor) || 0), 0))}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowStageMgr(v => !v)} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ borderColor: "#D7DCE3", color: "#344054" }}>
              <Settings2 size={14} /> Etapas
            </button>
          )}
          <button onClick={onNewDeal} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "#1FBE7A" }}>
            <Plus size={14} /> Novo negócio
          </button>
        </div>
      </div>

      {showStageMgr && (
        <div className="mb-4 rounded-lg border p-3 flex flex-wrap items-center gap-2" style={{ borderColor: "#E4E7EC", background: "#fff" }}>
          {db.stages.map(s => (
            editingStageId === s.id ? (
              <span key={s.id} className="flex items-center gap-1 rounded-full pl-1 pr-1 py-1" style={{ background: "#F5F6F8" }}>
                <input
                  autoFocus
                  value={editingStageName}
                  onChange={e => setEditingStageName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingStageId(null); }}
                  className="text-xs rounded-full px-2 py-1 border"
                  style={{ borderColor: "#D7DCE3", width: 140 }}
                />
                <button onClick={commitEdit} className="rounded-full p-1" style={{ background: "#1FBE7A", color: "#fff" }}>
                  <CheckCircle2 size={12} />
                </button>
              </span>
            ) : (
              <span key={s.id} className="flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium" style={{ background: "#F5F6F8", color: "#344054" }}>
                <button onClick={() => startEdit(s)} className="hover:underline">{s.nome}</button>
                {!s.protected && (
                  <button onClick={() => removeStage(s.id)} className="rounded-full p-0.5 hover:bg-gray-200">
                    <X size={11} />
                  </button>
                )}
              </span>
            )
          ))}
          <div className="flex items-center gap-1 ml-2">
            <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Nova etapa" className={inputCls} style={{ ...inputStyle, width: 140, padding: "5px 8px" }} />
            <button onClick={() => { addStage(newStageName); setNewStageName(""); }} className="rounded-md p-1.5 text-white" style={{ background: "#172433" }}>
              <Plus size={13} />
            </button>
          </div>
          <div className="text-[11px] w-full" style={{ color: "#98A2B3" }}>Clique no nome de uma etapa para renomeá-la.</div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {db.stages.map(stage => {
          const stageDeals = scopedDeals.filter(d => d.etapa === stage.id);
          const total = stageDeals.reduce((s, d) => s + (Number(d.valor) || 0), 0);
          return (
            <div key={stage.id} className="w-72 shrink-0 rounded-xl" style={{ background: "#EEF1F4" }}>
              <div className="px-3 pt-3 pb-2">
                <div className="text-sm font-semibold" style={{ color: stage.won ? "#17A868" : stage.closed ? "#C0393E" : "#172433" }}>{stage.nome}</div>
                <div className="text-[11px]" style={{ color: "#98A2B3" }}>{stageDeals.length} · {brl(total)}</div>
              </div>
              <div className="flex flex-col gap-2 px-2 pb-3">
                {stageDeals.map(deal => {
                  const client = clientById(deal.clientId);
                  const vend = vendedoraById(deal.vendedoraId);
                  const pend = pendingCountFor(deal.id);
                  const previsao = fmtDate(deal.previsaoFechamento);
                  return (
                    <div key={deal.id} className="rounded-lg border bg-white p-3" style={{ borderColor: "#E4E7EC" }}>
                      <div className="text-sm font-semibold mb-0.5" style={{ color: "#172433" }}>{deal.titulo}</div>
                      <div className="text-xs mb-1.5 flex items-center gap-1" style={{ color: "#667085" }}>
                        <Building2 size={11} /> {client?.empresa || client?.nome || "—"}
                      </div>
                      {deal.contato && (
                        <div className="text-xs mb-1.5 flex items-center gap-1" style={{ color: "#667085" }}>
                          <Users size={11} /> {deal.contato}
                        </div>
                      )}
                      {previsao && (
                        <div className="text-xs mb-1.5 flex items-center gap-1" style={{ color: "#667085" }}>
                          <Calendar size={11} /> Previsão: {previsao}
                        </div>
                      )}
                      <div className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: "#1FBE7A" }}>
                        <DollarSign size={13} /> {brl(deal.valor)}
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={deal.etapa}
                          onChange={(e) => updateDeal(deal.id, { etapa: e.target.value })}
                          className="text-xs rounded-md border px-1.5 py-1"
                          style={{ borderColor: "#D7DCE3", color: "#344054" }}
                        >
                          {db.stages.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                        {pend > 0 && (
                          <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{pend} pend.</span>
                        )}
                      </div>
                      {isAdmin && vend && (
                        <div className="text-[11px] mt-2 pt-2 border-t" style={{ borderColor: "#F0F1F3", color: "#98A2B3" }}>{vend.nome}</div>
                      )}
                    </div>
                  );
                })}
                {stageDeals.length === 0 && (
                  <div className="text-[11px] text-center py-4" style={{ color: "#B4BCC6" }}>Sem negócios</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useColunasClientes(currentUser, isAdmin) {
  const storageKey = `colunas_clientes_${currentUser?.id || "geral"}`;
  const colunasPossiveis = COLUNAS_CLIENTES_DEF.filter(c => !c.adminOnly || isAdmin).map(c => c.key);

  const [ordem, setOrdem] = useState(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(salvo)) {
        const validas = salvo.filter(k => colunasPossiveis.includes(k));
        const faltando = colunasPossiveis.filter(k => !validas.includes(k));
        return [...validas, ...faltando];
      }
    } catch (e) { /* localStorage indisponível ou valor inválido — usa padrão */ }
    return colunasPossiveis;
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(ordem)); } catch (e) { /* segue sem salvar */ }
  }, [ordem, storageKey]);

  const mover = (key, direcao) => {
    setOrdem(prev => {
      const i = prev.indexOf(key);
      const j = i + direcao;
      if (j < 0 || j >= prev.length) return prev;
      const nova = [...prev];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      return nova;
    });
  };

  const resetar = () => setOrdem(colunasPossiveis);

  return { ordem, mover, resetar };
}

function ClientesView({ clients, isAdmin, vendedoraById, deals, stages, stageById, onNewClient, vendedoras, assignClient, bulkAssignClients, currentUser }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkVendedoraId, setBulkVendedoraId] = useState("");
  const [filtroVendedora, setFiltroVendedora] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [colunasAbertas, setColunasAbertas] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState(null);
  const [ordenarDirecao, setOrdenarDirecao] = useState("asc");

  const { ordem: ordemColunas, mover: moverColuna, resetar: resetarColunas } = useColunasClientes(currentUser, isAdmin);

  const dealByClientId = (id) => deals.find(d => d.clientId === id);

  const estadosDisponiveis = Array.from(new Set(clients.map(c => c.estado).filter(Boolean))).sort();

  const filtered = clients.filter(c => {
    if (!(c.nome + c.empresa + (c.cidade || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (filtroVendedora && c.vendedoraId !== filtroVendedora) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroSituacao && c.situacao !== filtroSituacao) return false;
    if (filtroEtapa) {
      const deal = dealByClientId(c.id);
      if (!deal || deal.etapa !== filtroEtapa) return false;
    }
    return true;
  });

  const valorParaOrdenar = (c, key) => {
    if (key === "vendedora") return (vendedoraById(c.vendedoraId)?.nome || "").toLowerCase();
    return String(c[key] || "").toLowerCase();
  };

  const sorted = ordenarPor
    ? [...filtered].sort((a, b) => {
        const va = valorParaOrdenar(a, ordenarPor);
        const vb = valorParaOrdenar(b, ordenarPor);
        const cmp = va.localeCompare(vb, "pt-BR");
        return ordenarDirecao === "asc" ? cmp : -cmp;
      })
    : filtered;

  const alternarOrdenacao = (key) => {
    if (ordenarPor === key) {
      setOrdenarDirecao(d => d === "asc" ? "desc" : "asc");
    } else {
      setOrdenarPor(key);
      setOrdenarDirecao("asc");
    }
  };

  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(c => c.id));
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const applyBulk = () => {
    if (!selected.length) return;
    bulkAssignClients(selected, bulkVendedoraId || null);
    setSelected([]);
    setBulkVendedoraId("");
  };

  const selectCls = "text-sm rounded-lg border px-2.5 py-2";
  const selectStyle = { borderColor: "#D7DCE3", color: "#344054" };

  const renderHeader = (key) => {
    const def = COLUNAS_CLIENTES_DEF.find(c => c.key === key);
    const ativo = ordenarPor === key;
    return (
      <th key={key} className="text-left px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: "#667085" }}>
        <button
          onClick={() => alternarOrdenacao(key)}
          className="flex items-center gap-1"
          style={{ color: ativo ? "#172433" : "#667085", fontWeight: ativo ? 700 : 500 }}
          title="Ordenar por esta coluna"
        >
          {def?.label}
          <span style={{ fontSize: 10, opacity: ativo ? 1 : 0.35 }}>{ativo && ordenarDirecao === "desc" ? "▼" : "▲"}</span>
        </button>
      </th>
    );
  };

  const renderCell = (c, key, vend) => {
    switch (key) {
      case "empresa":
        return <td key={key} className="px-4 py-2.5 font-medium" style={{ color: "#172433" }}><Link to={`/clientes/${c.id}`} className="hover:underline" style={{ color: "#172433" }}>{c.empresa || "—"}</Link></td>;
      case "nome":
        return <td key={key} className="px-4 py-2.5" style={{ color: "#475467" }}>{c.nome}</td>;
      case "telefone":
        return <td key={key} className="px-4 py-2.5" style={{ color: "#475467" }}>{c.telefone ? <div className="flex items-center gap-1"><Phone size={11} /> {c.telefone}</div> : <span style={{ color: "#B4BCC6" }}>—</span>}</td>;
      case "email":
        return <td key={key} className="px-4 py-2.5" style={{ color: "#475467" }}>{c.email ? <div className="flex items-center gap-1"><Mail size={11} /> {c.email}</div> : <span style={{ color: "#B4BCC6" }}>—</span>}</td>;
      case "cidade":
        return <td key={key} className="px-4 py-2.5" style={{ color: "#475467" }}>{c.cidade || "—"}</td>;
      case "estado":
        return <td key={key} className="px-4 py-2.5" style={{ color: "#475467" }}>{c.estado || "—"}</td>;
      case "situacao":
        return <td key={key} className="px-4 py-2.5">{c.situacao ? <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: "#EEF1F4", color: "#344054" }}>{c.situacao}</span> : <span className="text-xs" style={{ color: "#B4BCC6" }}>—</span>}</td>;
      case "vendedora":
        return (
          <td key={key} className="px-4 py-2.5">
            <select
              value={c.vendedoraId || ""}
              onChange={(e) => assignClient(c.id, e.target.value || null, true)}
              className="text-sm rounded-md border px-2 py-1"
              style={{ borderColor: "#D7DCE3", color: vend ? "#344054" : "#B4BCC6" }}
            >
              <option value="">Não atribuído</option>
              {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </td>
        );
      default:
        return <td key={key} className="px-4 py-2.5" />;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#98A2B3" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente ou empresa" className={inputCls} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        {isAdmin && (
          <select value={filtroVendedora} onChange={e => setFiltroVendedora(e.target.value)} className={selectCls} style={selectStyle}>
            <option value="">Todas as vendedoras</option>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        )}
        <select value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)} className={selectCls} style={selectStyle}>
          <option value="">Todas as etapas</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectCls} style={selectStyle}>
          <option value="">Todos os estados</option>
          {estadosDisponiveis.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <select value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)} className={selectCls} style={selectStyle}>
          <option value="">Todas as situações</option>
          {SITUACOES_CLIENTE.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filtroVendedora || filtroEtapa || filtroEstado || filtroSituacao || q) && (
          <button
            onClick={() => { setQ(""); setFiltroVendedora(""); setFiltroEtapa(""); setFiltroEstado(""); setFiltroSituacao(""); }}
            className="text-xs font-medium"
            style={{ color: "#667085" }}
          >
            Limpar filtros
          </button>
        )}
        <div className="relative ml-auto flex items-center gap-2">
          <button
            onClick={() => setColunasAbertas(v => !v)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "#D7DCE3", color: "#344054" }}
          >
            <Sliders size={14} /> Colunas
          </button>
          <button onClick={onNewClient} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ background: "#1FBE7A" }}>
            <Plus size={14} /> Novo cliente
          </button>

          {colunasAbertas && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setColunasAbertas(false)} />
              <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border bg-white shadow-lg p-3" style={{ borderColor: "#E4E7EC" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#98A2B3" }}>Ordem das colunas</div>
                <div className="flex flex-col gap-1">
                  {ordemColunas.map((key, i) => {
                    const def = COLUNAS_CLIENTES_DEF.find(c => c.key === key);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5" style={{ background: "#F9FAFB" }}>
                        <span className="text-sm" style={{ color: "#344054" }}>{def?.label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={i === 0}
                            onClick={() => moverColuna(key, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded"
                            style={{ color: i === 0 ? "#D7DCE3" : "#475467" }}
                          >▲</button>
                          <button
                            disabled={i === ordemColunas.length - 1}
                            onClick={() => moverColuna(key, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded"
                            style={{ color: i === ordemColunas.length - 1 ? "#D7DCE3" : "#475467" }}
                          >▼</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={resetarColunas} className="text-xs font-medium mt-2" style={{ color: "#667085" }}>
                  Restaurar ordem padrão
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isAdmin && selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#BEE6D2", background: "#F0FBF6" }}>
          <span className="text-sm font-medium" style={{ color: "#17A868" }}>{selected.length} selecionado(s)</span>
          <select
            value={bulkVendedoraId}
            onChange={(e) => setBulkVendedoraId(e.target.value)}
            className="text-sm rounded-md border px-2 py-1 ml-2"
            style={{ borderColor: "#D7DCE3", color: "#344054" }}
          >
            <option value="">Não atribuído</option>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
          <button onClick={applyBulk} className="rounded-md px-3 py-1.5 text-xs font-medium text-white" style={{ background: "#17A868" }}>
            Atribuir selecionados
          </button>
          <button onClick={() => setSelected([])} className="text-xs font-medium ml-auto" style={{ color: "#667085" }}>
            Limpar seleção
          </button>
        </div>
      )}
      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#E4E7EC", overflowX: "auto" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {isAdmin && (
                <th className="text-left px-4 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
              )}
              {ordemColunas.map(renderHeader)}
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              const vend = vendedoraById(c.vendedoraId);
              return (
                <tr key={c.id} className="border-t" style={{ borderColor: "#F0F1F3" }}>
                  {isAdmin && (
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} />
                    </td>
                  )}
                  {ordemColunas.map(key => renderCell(c, key, vend))}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 7} className="text-center py-8 text-sm" style={{ color: "#98A2B3" }}>Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DistribuirView({ clients, vendedoras, assignClient, bulkAssignClients, distributeAuto }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkVendedoraId, setBulkVendedoraId] = useState("");

  const unassignedAll = clients.filter(c => !c.vendedoraId);
  const unassigned = unassignedAll.filter(c => (c.nome + c.empresa).toLowerCase().includes(q.toLowerCase()));

  const allSelected = unassigned.length > 0 && unassigned.every(c => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : unassigned.map(c => c.id));
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const applyBulk = () => {
    if (!selected.length || !bulkVendedoraId) return;
    bulkAssignClients(selected, bulkVendedoraId);
    setSelected([]);
    setBulkVendedoraId("");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#98A2B3" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente ou empresa" className={inputCls} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <div className="text-sm" style={{ color: "#667085" }}>{unassignedAll.length} cliente(s) sem vendedora atribuída</div>
        <button onClick={distributeAuto} disabled={unassignedAll.length === 0 || vendedoras.length === 0} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 ml-auto" style={{ background: "#172433" }}>
          <Shuffle size={14} /> Distribuir automaticamente
        </button>
      </div>
      {vendedoras.length === 0 && (
        <div className="rounded-lg border px-4 py-3 text-sm mb-4 flex items-center gap-2" style={{ borderColor: "#F5D0B5", background: "#FFF7ED", color: "#9A5B10" }}>
          <AlertCircle size={15} /> Cadastre vendedoras primeiro na aba Importar.
        </div>
      )}
      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#BEE6D2", background: "#F0FBF6" }}>
          <span className="text-sm font-medium" style={{ color: "#17A868" }}>{selected.length} selecionado(s)</span>
          <select
            value={bulkVendedoraId}
            onChange={(e) => setBulkVendedoraId(e.target.value)}
            className="text-sm rounded-md border px-2 py-1 ml-2"
            style={{ borderColor: "#D7DCE3", color: "#344054" }}
          >
            <option value="">Selecionar vendedora</option>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
          <button onClick={applyBulk} disabled={!bulkVendedoraId} className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40" style={{ background: "#17A868" }}>
            Atribuir selecionados
          </button>
          <button onClick={() => setSelected([])} className="text-xs font-medium ml-auto" style={{ color: "#667085" }}>
            Limpar seleção
          </button>
        </div>
      )}
      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#E4E7EC" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              <th className="text-left px-4 py-2.5 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Cliente</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Empresa</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Atribuir a</th>
            </tr>
          </thead>
          <tbody>
            {unassigned.map(c => (
              <tr key={c.id} className="border-t" style={{ borderColor: "#F0F1F3" }}>
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} />
                </td>
                <td className="px-4 py-2.5 font-medium" style={{ color: "#172433" }}>{c.nome}</td>
                <td className="px-4 py-2.5" style={{ color: "#475467" }}>{c.empresa}</td>
                <td className="px-4 py-2.5">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) assignClient(c.id, e.target.value, true); }}
                    className="text-sm rounded-md border px-2 py-1"
                    style={{ borderColor: "#D7DCE3", color: "#344054" }}
                  >
                    <option value="" disabled>Selecionar vendedora</option>
                    {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {unassigned.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-sm" style={{ color: "#98A2B3" }}>
                {unassignedAll.length === 0 ? "Todos os clientes já foram distribuídos 🎉" : "Nenhum cliente encontrado para essa busca."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportarView({ setDb, showToast, vendedoras, clients, deleteVendedora }) {
  const [vendPreview, setVendPreview] = useState(null);
  const [clientPreview, setClientPreview] = useState(null);

  const pick = (row, keys) => {
    const foundKey = Object.keys(row).find(k => keys.some(kw => k.toLowerCase().includes(kw)));
    return foundKey ? String(row[foundKey] || "").trim() : "";
  };

  const parseFile = (file, onDone) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => onDone(res.data),
    });
  };

  const handleVendFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    parseFile(file, (rows) => {
      const parsed = rows.map(r => ({
        nome: pick(r, ["nome", "name", "vendedor"]),
        email: pick(r, ["email", "e-mail"]),
      })).filter(r => r.nome);
      setVendPreview(parsed);
    });
  };
  
  const handleClientFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    parseFile(file, (rows) => {
      const parsed = rows.map(r => ({
        nome: pick(r, ["nome", "name", "cliente", "revenda"]),
        empresa: pick(r, ["empresa", "company", "revenda", "fantasia", "razao"]),
        telefone: pick(r, ["telefone", "phone", "fone", "celular"]),
        email: pick(r, ["email", "e-mail"]),
        cidade: pick(r, ["cidade", "city"]),
        estado: pick(r, ["estado", "uf"]).toUpperCase().slice(0, 2),
        situacao: pick(r, ["situacao", "situação", "tipo", "classificacao"]) || SITUACOES_CLIENTE[0],
      })).filter(r => r.nome);
      setClientPreview(parsed);
    });
  };

  const confirmVend = () => {
    setDb(prev => ({ ...prev, vendedoras: [...prev.vendedoras, ...vendPreview.map(v => ({ id: uid("v"), ...v }))] }));
    showToast(`${vendPreview.length} vendedora(s) importada(s).`);
    setVendPreview(null);
  };

  const confirmClients = () => {
    setDb(prev => ({ ...prev, clients: [...prev.clients, ...clientPreview.map(c => ({ id: uid("c"), vendedoraId: null, ...c }))] }));
    showToast(`${clientPreview.length} cliente(s) importado(s). Distribua-os na aba Distribuir.`);
    setClientPreview(null);
  };

  const Card = ({ title, hint, onFile, preview, onConfirm, columns }) => (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E4E7EC" }}>
      <div className="font-semibold text-sm mb-1" style={{ color: "#172433" }}>{title}</div>
      <div className="text-xs mb-3" style={{ color: "#98A2B3" }}>{hint}</div>
      <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm cursor-pointer" style={{ borderColor: "#D7DCE3", color: "#667085" }}>
        <Upload size={16} /> Selecionar arquivo CSV
        <input type="file" accept=".csv" onChange={onFile} className="hidden" />
      </label>
      {preview && (
        <div className="mt-4">
          <div className="text-xs mb-2" style={{ color: "#475467" }}>{preview.length} linha(s) encontrada(s). Prévia:</div>
          <div className="rounded-lg border overflow-hidden mb-3" style={{ borderColor: "#F0F1F3" }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: "#F9FAFB" }}>{columns.map(c => <th key={c} className="text-left px-2.5 py-1.5 font-medium" style={{ color: "#667085" }}>{c}</th>)}</tr></thead>
              <tbody>
                {preview.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#F5F6F8" }}>
                    {columns.map(c => <td key={c} className="px-2.5 py-1.5" style={{ color: "#344054" }}>{r[c.toLowerCase()] ?? Object.values(r)[columns.indexOf(c)]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={onConfirm} className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "#1FBE7A" }}>
            Confirmar importação
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Importar vendedoras"
          hint="CSV com colunas: nome, email"
          onFile={handleVendFile}
          preview={vendPreview}
          onConfirm={confirmVend}
          columns={["nome", "email"]}
        />
        <Card
          title="Importar clientes"
          hint="CSV com colunas: nome, empresa, telefone, email — depois distribua na aba Distribuir"
          onFile={handleClientFile}
          preview={clientPreview}
          onConfirm={confirmClients}
          columns={["nome", "empresa", "telefone", "email", "estado"]}
        />
      </div>

      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E4E7EC" }}>
        <div className="font-semibold text-sm mb-1" style={{ color: "#172433" }}>Vendedoras cadastradas</div>
        <div className="text-xs mb-3" style={{ color: "#98A2B3" }}>Para excluir uma vendedora, primeiro reatribua os clientes dela na aba Clientes.</div>
        {vendedoras.length === 0 ? (
          <div className="text-sm py-4 text-center" style={{ color: "#98A2B3" }}>Nenhuma vendedora cadastrada ainda.</div>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "#F0F1F3" }}>
            {vendedoras.map(v => {
              const count = clients.filter(c => c.vendedoraId === v.id).length;
              return (
                <div key={v.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#172433" }}>{v.nome}</div>
                    <div className="text-xs" style={{ color: "#98A2B3" }}>{v.email || "sem e-mail"} · {count} cliente(s)</div>
                  </div>
                  <button
                    onClick={() => deleteVendedora(v.id)}
                    disabled={count > 0}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "#FDEDEE", color: "#E5484D" }}
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children, onSubmit, submitLabel = "Salvar" }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(15,20,26,0.45)" }}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-base" style={{ color: "#172433" }}>{title}</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ borderColor: "#D7DCE3", color: "#344054" }}>Cancelar</button>
          <button onClick={onSubmit} className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "#1FBE7A" }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: "#475467" }}>{label}</span>
      {children}
    </label>
  );
}

function ActivityModal({ isAdmin, currentUser, clients, deals, vendedoras, onClose, onSave }) {
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [tipo, setTipo] = useState(ACTIVITY_TYPES[0]);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(todayStr());
  const [hora, setHora] = useState(nowTimeStr());
  const [vendedoraId, setVendedoraId] = useState(isAdmin ? (vendedoras[0]?.id || "") : currentUser.id);
  const [error, setError] = useState("");

  const submit = () => {
    if (!clientId || !data || !hora || !vendedoraId) { setError("Preencha cliente, data, horário e vendedora."); return; }
    const deal = deals.find(d => d.clientId === clientId);
    onSave({ clientId, dealId: deal?.id || null, vendedoraId, tipo, descricao, data, hora });
  };

  return (
    <ModalShell title="Nova atividade" onClose={onClose} onSubmit={submit}>
      {error && <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
      <Field label="Cliente">
        <select value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls} style={inputStyle}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.empresa}</option>)}
        </select>
      </Field>
      {isAdmin && (
        <Field label="Vendedora responsável">
          <select value={vendedoraId} onChange={e => setVendedoraId(e.target.value)} className={inputCls} style={inputStyle}>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </Field>
      )}
      <Field label="Tipo">
        <select value={tipo} onChange={e => setTipo(e.target.value)} className={inputCls} style={inputStyle}>
          {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Descrição">
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className={inputCls} style={inputStyle} placeholder="O que precisa ser feito?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data *">
          <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} style={inputStyle} required />
        </Field>
        <Field label="Horário *">
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputCls} style={inputStyle} required />
        </Field>
      </div>
    </ModalShell>
  );
}

function ActivityResultModal({ activity, client, onClose, onSave }) {
  const [texto, setTexto] = useState(activity.resultado || "");
  const [acao, setAcao] = useState("encerrar");
  const [novaData, setNovaData] = useState(activity.data);
  const [novaHora, setNovaHora] = useState(activity.hora);
  const [error, setError] = useState("");

  const submit = () => {
    if (!texto.trim()) { setError("Escreva o que foi feito nesta atividade."); return; }
    if (acao === "reagendar" && (!novaData || !novaHora)) { setError("Preencha a nova data e horário."); return; }
    onSave({ texto, acao, novaData, novaHora });
  };

  const historico = [...(activity.historico || [])].reverse();

  return (
    <ModalShell title={`${activity.tipo} — ${client?.nome || "Cliente"}`} onClose={onClose} onSubmit={submit} submitLabel={acao === "reagendar" ? "Salvar e reagendar" : "Salvar e encerrar"}>
      {error && <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}

      {activity.descricao && (
        <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#F5F6F8", color: "#667085" }}>
          <strong>Combinado: </strong>{activity.descricao}
        </div>
      )}

      <Field label="O que foi feito *">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={3}
          className={inputCls}
          style={inputStyle}
          placeholder="Ex: Liguei, cliente pediu para retornar na próxima semana."
          autoFocus
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAcao("encerrar")}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          style={acao === "encerrar" ? { borderColor: "#1FBE7A", background: "#F0FBF6", color: "#17A868" } : { borderColor: "#D7DCE3", color: "#667085" }}
        >
          <CheckCircle2 size={14} /> Encerrar atividade
        </button>
        <button
          type="button"
          onClick={() => setAcao("reagendar")}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          style={acao === "reagendar" ? { borderColor: "#F5A524", background: "#FFF8EC", color: "#B06B00" } : { borderColor: "#D7DCE3", color: "#667085" }}
        >
          <RefreshCw size={14} /> Reagendar
        </button>
      </div>

      {acao === "reagendar" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nova data *">
            <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Novo horário *">
            <input type="time" value={novaHora} onChange={e => setNovaHora(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
        </div>
      )}

      {historico.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#98A2B3" }}>Histórico</div>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-auto">
            {historico.map((h, i) => (
              <div key={i} className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#F9FAFB", color: "#475467" }}>
                <div style={{ color: "#98A2B3" }}>{h.quando} · {h.acao === "reagendar" ? "Reagendada" : "Encerrada"}</div>
                {h.texto}
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function DealModal({ isAdmin, currentUser, clients, vendedoras, stages, onClose, onSave }) {
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [titulo, setTitulo] = useState("");
  const [contato, setContato] = useState("");
  const [previsaoFechamento, setPrevisaoFechamento] = useState("");
  const [valor, setValor] = useState("");
  const [etapa, setEtapa] = useState(stages[0]?.id || "");
  const [vendedoraId, setVendedoraId] = useState(isAdmin ? (vendedoras[0]?.id || "") : currentUser.id);
  const [error, setError] = useState("");

  const [agendarAtividade, setAgendarAtividade] = useState(false);
  const [atTipo, setAtTipo] = useState(ACTIVITY_TYPES[0]);
  const [atDescricao, setAtDescricao] = useState("");
  const [atData, setAtData] = useState(todayStr());
  const [atHora, setAtHora] = useState(nowTimeStr());

  const submit = () => {
    if (!clientId || !titulo.trim() || !vendedoraId) { setError("Preencha revenda, nome do projeto e vendedora."); return; }
    if (agendarAtividade && (!atData || !atHora)) { setError("Preencha data e horário da atividade, ou desmarque \"Agendar atividade\"."); return; }
    const deal = { clientId, titulo: titulo.trim(), contato: contato.trim(), previsaoFechamento, valor: Number(valor) || 0, etapa, vendedoraId };
    const atividade = agendarAtividade ? { tipo: atTipo, descricao: atDescricao, data: atData, hora: atHora } : null;
    onSave({ deal, atividade });
  };

  return (
    <ModalShell title="Novo negócio" onClose={onClose} onSubmit={submit}>
      {error && <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
      <Field label="Revenda / Cliente">
        <select value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls} style={inputStyle}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.empresa}</option>)}
        </select>
      </Field>
      <Field label="Nome do projeto">
        <input value={titulo} onChange={e => setTitulo(e.target.value)} className={inputCls} style={inputStyle} placeholder="Ex: Implantação de ponto - Empresa X" />
      </Field>
      <Field label="Pessoa de contato da revenda">
        <input value={contato} onChange={e => setContato(e.target.value)} className={inputCls} style={inputStyle} placeholder="Nome de quem você fala na revenda" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Previsão de fechamento">
          <input type="date" value={previsaoFechamento} onChange={e => setPrevisaoFechamento(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Valor (R$)">
          <input type="number" value={valor} onChange={e => setValor(e.target.value)} className={inputCls} style={inputStyle} placeholder="0" />
        </Field>
      </div>
      <Field label="Etapa inicial">
        <select value={etapa} onChange={e => setEtapa(e.target.value)} className={inputCls} style={inputStyle}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </Field>
      {isAdmin && (
        <Field label="Vendedora responsável">
          <select value={vendedoraId} onChange={e => setVendedoraId(e.target.value)} className={inputCls} style={inputStyle}>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </Field>
      )}

      <div className="rounded-lg border mt-1" style={{ borderColor: "#E4E7EC" }}>
        <button
          type="button"
          onClick={() => setAgendarAtividade(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
          style={{ color: "#172433" }}
        >
          <span className="flex items-center gap-2"><Calendar size={14} /> Agendar atividade para esse negócio</span>
          <span className="text-xs rounded-full px-2 py-0.5" style={{ background: agendarAtividade ? "#E7F9F1" : "#F5F6F8", color: agendarAtividade ? "#17A868" : "#98A2B3" }}>
            {agendarAtividade ? "Sim" : "Não"}
          </span>
        </button>
        {agendarAtividade && (
          <div className="px-3 pb-3 flex flex-col gap-3 border-t pt-3" style={{ borderColor: "#F0F1F3" }}>
            <Field label="Tipo">
              <select value={atTipo} onChange={e => setAtTipo(e.target.value)} className={inputCls} style={inputStyle}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Descrição">
              <textarea value={atDescricao} onChange={e => setAtDescricao(e.target.value)} rows={2} className={inputCls} style={inputStyle} placeholder="O que precisa ser feito?" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data *">
                <input type="date" value={atData} onChange={e => setAtData(e.target.value)} className={inputCls} style={inputStyle} required />
              </Field>
              <Field label="Horário *">
                <input type="time" value={atHora} onChange={e => setAtHora(e.target.value)} className={inputCls} style={inputStyle} required />
              </Field>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ClientModal({ isAdmin, currentUser, vendedoras, onClose, onSave }) {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [situacao, setSituacao] = useState(SITUACOES_CLIENTE[0]);
  const [vendedoraId, setVendedoraId] = useState(isAdmin ? "" : currentUser.id);
  const [error, setError] = useState("");

  const submit = () => {
    if (!nome.trim()) { setError("Informe ao menos o nome do cliente."); return; }
    onSave({ nome: nome.trim(), empresa: empresa.trim(), telefone: telefone.trim(), email: email.trim(), cidade: cidade.trim(), estado: estado.trim().toUpperCase(), situacao, vendedoraId: vendedoraId || null });
  };

  return (
    <ModalShell title="Novo cliente" onClose={onClose} onSubmit={submit}>
      {error && <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
      <Field label="Razão Social"><input value={empresa} onChange={e => setEmpresa(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="Contato (nome da pessoa)"><input value={nome} onChange={e => setNome(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input value={telefone} onChange={e => setTelefone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="E-mail"><input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cidade"><input value={cidade} onChange={e => setCidade(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="Estado (UF)"><input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className={inputCls} style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="SP" /></Field>
      </div>
      <Field label="Situação">
        <select value={situacao} onChange={e => setSituacao(e.target.value)} className={inputCls} style={inputStyle}>
          {SITUACOES_CLIENTE.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      {isAdmin && (
        <Field label="Vendedora responsável (opcional)">
          <select value={vendedoraId} onChange={e => setVendedoraId(e.target.value)} className={inputCls} style={inputStyle}>
            <option value="">Não atribuído</option>
            {vendedoras.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </Field>
      )}
    </ModalShell>
  );
}

// ---------------- Root ----------------
function AuthenticatedApp() {
  const { session, profile, profileError, signOut, loading } = useAuth();
  const [matchDb, setMatchDb] = useState(null);
  const [matchLoaded, setMatchLoaded] = useState(false);

  // busca só os dados necessários para casar o e-mail logado com uma vendedora cadastrada
  useEffect(() => {
    if (!profile || profile.role === "admin") { setMatchLoaded(true); return; }
    (async () => {
      const { data } = await supabase.from("crm_data").select("data").eq("id", "main").maybeSingle();
      setMatchDb(data?.data || null);
      setMatchLoaded(true);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[500px]" style={{ background: "#F5F6F8" }}><div className="text-sm" style={{ color: "#667085" }}>Carregando…</div></div>;
  }

  if (!session) return <LoginPage />;

  if (profileError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] p-6" style={{ background: "#F5F6F8" }}>
        <div className="max-w-md rounded-xl border bg-white p-5 text-sm" style={{ borderColor: "#F3B7B9", color: "#C0393E" }}>
          <div className="font-semibold mb-1">Erro ao carregar seu perfil</div>
          <div style={{ color: "#667085" }}>{profileError}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-full min-h-[500px]" style={{ background: "#F5F6F8" }}><div className="text-sm" style={{ color: "#667085" }}>Carregando seu perfil…</div></div>;
  }

  const isAdmin = profile.role === "admin";

  if (isAdmin) {
    return <CrmShell isAdmin nome={profile.nome} currentUser={{ id: "admin", nome: profile.nome, role: "admin" }} onLogout={signOut} />;
  }

  if (!matchLoaded) {
    return <div className="flex items-center justify-center h-full min-h-[500px]" style={{ background: "#F5F6F8" }}><div className="text-sm" style={{ color: "#667085" }}>Carregando…</div></div>;
  }

  const matched = matchDb?.vendedoras?.find(v => v.email && profile.email && v.email.toLowerCase() === profile.email.toLowerCase());

  if (!matched) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] p-6" style={{ background: "#F5F6F8" }}>
        <div className="max-w-md rounded-xl border bg-white p-5 text-sm text-center" style={{ borderColor: "#F5D0B5" }}>
          <div className="font-semibold mb-1" style={{ color: "#172433" }}>Conta ainda não vinculada</div>
          <div style={{ color: "#667085" }}>
            Seu login funcionou, mas o e-mail <strong>{profile.email}</strong> ainda não está cadastrado como vendedora no CRM.
            Peça para o administrador conferir esse e-mail na aba Importar.
          </div>
          <button onClick={signOut} className="mt-4 text-xs font-medium" style={{ color: "#98A2B3" }}>Sair</button>
        </div>
      </div>
    );
  }

  return <CrmShell isAdmin={false} nome={matched.nome} currentUser={{ id: matched.id, nome: matched.nome, role: "vendedora" }} onLogout={signOut} />;
}

export default function Root() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
