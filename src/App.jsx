import React, { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";
import { supabase } from "./supabaseClient";
import {
  Plus, Upload, Users, Phone, Mail, Building2, Calendar, Clock,
  CheckCircle2, Circle, ChevronDown, X, LayoutGrid, List as ListIcon,
  UserPlus, Shuffle, Trash2, AlertCircle, Search, DollarSign,
  Settings2, ArrowRight, LogIn, RotateCcw
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
      { id: c1, nome: "João Martins", empresa: "Grupo Martins Ltda", telefone: "(41) 99811-2233", email: "joao@martins.com", vendedoraId: v1 },
      { id: c2, nome: "Patrícia Lima", empresa: "Lima Contabilidade", telefone: "(41) 99022-1188", email: "patricia@limacont.com", vendedoraId: v1 },
      { id: c3, nome: "Roberto Alves", empresa: "Alves Distribuidora", telefone: "(41) 98877-4455", email: "roberto@alvesdist.com", vendedoraId: v2 },
      { id: c4, nome: "Beatriz Nunes", empresa: "Nunes Engenharia", telefone: "(41) 99344-7766", email: "beatriz@nunesengenharia.com", vendedoraId: null },
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

export default function CRM() {
  const [db, setDb] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("admin");
  const [view, setView] = useState("atividades");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [toast, setToast] = useState(null);

  const lastSyncedRef = useRef(null); // avoids re-saving data that just arrived from realtime
  const [loadError, setLoadError] = useState(null);

  // load initial data from Supabase (creates the row with seed data on first run)
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

  // save to Supabase whenever local data changes (skip if it's identical to what we last synced)
  useEffect(() => {
    if (!loaded || !db) return;
    const serialized = JSON.stringify(db);
    if (serialized === lastSyncedRef.current) return;
    const t = setTimeout(async () => {
      lastSyncedRef.current = serialized;
      const { error } = await supabase.from("crm_data").update({ data: db, updated_at: new Date().toISOString() }).eq("id", "main");
      if (error) console.error("Falha ao salvar no Supabase:", error.message);
    }, 400); // small debounce so rapid edits don't spam the database
    return () => clearTimeout(t);
  }, [db, loaded]);

  // live sync: pick up changes made by teammates in real time
  useEffect(() => {
    const channel = supabase
      .channel("crm_data_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "crm_data", filter: "id=eq.main" }, (payload) => {
        const incoming = JSON.stringify(payload.new.data);
        if (incoming === lastSyncedRef.current) return; // it's our own write coming back
        lastSyncedRef.current = incoming;
        setDb(payload.new.data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const users = useMemo(() => {
    if (!db) return [];
    return [{ id: "admin", nome: "Administrador", role: "admin" },
      ...db.vendedoras.map(v => ({ id: v.id, nome: v.nome, role: "vendedora" }))];
  }, [db]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] p-6" style={{ background: "#F5F6F8" }}>
        <div className="max-w-md rounded-xl border bg-white p-5 text-sm" style={{ borderColor: "#F3B7B9", color: "#C0393E" }}>
          <div className="font-semibold mb-1">Não foi possível conectar ao Supabase</div>
          <div style={{ color: "#667085" }}>{loadError}</div>
          <div className="mt-2" style={{ color: "#667085" }}>Confira se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas e se a tabela crm_data foi criada (veja o README).</div>
        </div>
      </div>
    );
  }

  if (!loaded || !db || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]" style={{ background: "#F5F6F8" }}>
        <div className="text-sm" style={{ color: "#667085" }}>Carregando CRM…</div>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";
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

  const addDeal = (deal) =>
    setDb(prev => ({ ...prev, deals: [...prev.deals, { id: uid("d"), criadoEm: todayStr(), ...deal }] }));

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
    const nome = db.vendedoras.find(v => v.id === vendedoraId)?.nome || "Vendedora";
    setDb(prev => ({
      ...prev,
      vendedoras: prev.vendedoras.filter(v => v.id !== vendedoraId),
      deals: prev.deals.filter(d => d.vendedoraId !== vendedoraId),
      activities: prev.activities.filter(a => a.vendedoraId !== vendedoraId),
    }));
    if (currentUserId === vendedoraId) setCurrentUserId("admin");
    showToast(`${nome} foi excluída.`);
  };

  return (
    <div className="flex h-full min-h-[640px] w-full overflow-hidden" style={{ background: "#F5F6F8", fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" }}>
      <Sidebar
        view={view} setView={setView} isAdmin={isAdmin}
        pendingCount={scopedActivities.filter(a => !a.concluida && a.data <= todayStr()).length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          view={view} isAdmin={isAdmin} currentUser={currentUser} users={users}
          showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
          setCurrentUserId={setCurrentUserId}
        />

        <div className="flex-1 overflow-auto p-5">
          {view === "atividades" && (
            <AtividadesView
              activities={scopedActivities} clientById={clientById}
              toggleActivity={toggleActivity}
              onNewActivity={() => setShowActivityModal(true)}
              isAdmin={isAdmin} vendedoras={db.vendedoras} vendedoraById={vendedoraById}
            />
          )}
          {view === "pipeline" && (
            <PipelineView
              db={db} scopedDeals={scopedDeals} isAdmin={isAdmin}
              clientById={clientById} vendedoraById={vendedoraById}
              updateDeal={updateDeal} scopedActivities={scopedActivities}
              onNewDeal={() => setShowDealModal(true)}
              addStage={addStage} removeStage={removeStage} renameStage={renameStage}
            />
          )}
          {view === "clientes" && (
            <ClientesView
              clients={scopedClients} isAdmin={isAdmin} vendedoraById={vendedoraById}
              deals={db.deals} stages={db.stages} stageById={stageById}
              onNewClient={() => setShowClientModal(true)}
              vendedoras={db.vendedoras} assignClient={assignClient}
              bulkAssignClients={bulkAssignClients}
            />
          )}
          {view === "distribuir" && isAdmin && (
            <DistribuirView
              clients={db.clients} vendedoras={db.vendedoras}
              assignClient={assignClient} bulkAssignClients={bulkAssignClients} distributeAuto={distributeAuto}
            />
          )}
          {view === "importar" && isAdmin && (
            <ImportarView setDb={setDb} showToast={showToast} vendedoras={db.vendedoras} clients={db.clients} deleteVendedora={deleteVendedora} />
          )}
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

      {toast && (
        <div className="fixed bottom-5 right-5 rounded-lg px-4 py-3 text-sm text-white shadow-lg z-50" style={{ background: "#172433" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------- Sidebar (nav tabs) ----------------
function Sidebar({ view, setView, isAdmin, pendingCount }) {
  const navItem = (key, label, Icon, badge) => (
    <button
      onClick={() => setView(key)}
      className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
      style={{
        background: view === key ? "rgba(31,190,122,0.16)" : "transparent",
        color: view === key ? "#3FE0A0" : "#B6C0CC",
      }}
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
      {!!badge && (
        <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: "#E5484D", color: "#fff" }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div className="w-60 shrink-0 flex flex-col" style={{ background: "#16202D" }}>
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: "#1FBE7A", color: "#0E1620" }}>V</div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Vendaflow CRM</span>
        </div>
        <div className="flex flex-col gap-1">
          {navItem("atividades", "Atividades", Clock, pendingCount)}
          {navItem("pipeline", "Negócios", LayoutGrid)}
          {navItem("clientes", "Clientes", Users)}
          {isAdmin && navItem("distribuir", "Distribuir", Shuffle)}
          {isAdmin && navItem("importar", "Importar", Upload)}
        </div>
      </div>
      <div className="flex-1" />
      <div className="px-4 pb-5 text-[11px] leading-snug" style={{ color: "#4F5D6B" }}>
        Dados compartilhados entre todos os usuários deste CRM.
      </div>
    </div>
  );
}

// ---------------- Atividades (dedicated tab) ----------------
function AtividadesView({ activities, clientById, toggleActivity, onNewActivity, isAdmin, vendedoras, vendedoraById }) {
  const [filtroVendedora, setFiltroVendedora] = useState("");
  const todayS = todayStr();
  const filtered = isAdmin && filtroVendedora ? activities.filter(a => a.vendedoraId === filtroVendedora) : activities;
  const enriched = filtered.map(a => ({ ...a, red: !a.concluida && a.data <= todayS }));
  const key = (a) => `${a.data}${a.hora || "00:00"}`;
  const hojeAtrasadas = enriched.filter(a => a.red).sort((a, b) => key(a).localeCompare(key(b)));
  const proximas = enriched.filter(a => !a.concluida && !a.red).sort((a, b) => key(a).localeCompare(key(b)));
  const concluidas = enriched.filter(a => a.concluida).sort((a, b) => key(b).localeCompare(key(a)));

  const Row = ({ a }) => {
    const client = clientById(a.clientId);
    const vend = isAdmin ? vendedoraById(a.vendedoraId) : null;
    const [y, m, d] = a.data.split("-");
    return (
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: a.red ? "#F3B7B9" : "#E4E7EC", background: a.red ? "#FFF8F8" : "#fff" }}
      >
        <button onClick={() => toggleActivity(a.id)} className="shrink-0">
          {a.concluida ? <CheckCircle2 size={19} style={{ color: "#1FBE7A" }} /> : <Circle size={19} style={{ color: a.red ? "#E5484D" : "#98A2B3" }} />}
        </button>
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-semibold truncate"
            style={{
              color: a.concluida ? "#98A2B3" : a.red ? "#C0393E" : "#172433",
              textDecoration: a.concluida ? "line-through" : "none",
            }}
          >
            {a.tipo} · {client?.nome || "Cliente"}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "#667085" }}>{a.descricao || "Sem descrição"}</div>
        </div>
        {vend && (
          <span className="text-[11px] font-medium shrink-0 rounded-full px-2 py-0.5" style={{ background: "#EEF1F4", color: "#344054" }}>{vend.nome}</span>
        )}
        <div className="text-xs shrink-0 flex items-center gap-1.5" style={{ color: a.red ? "#E5484D" : "#98A2B3" }}>
          <Calendar size={12} /> {d}/{m} <Clock size={12} className="ml-1" /> {a.hora}
        </div>
      </div>
    );
  };

  const Section = ({ title, items, tone }) =>
    items.length > 0 && (
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tone === "red" ? "#E5484D" : "#98A2B3" }}>
          {title} · {items.length}
        </div>
        <div className="flex flex-col gap-2">{items.map(a => <Row key={a.id} a={a} />)}</div>
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

// ---------------- Top bar ----------------
function TopBar({ view, isAdmin, currentUser, users, showUserMenu, setShowUserMenu, setCurrentUserId }) {
  const titles = { atividades: "Atividades", pipeline: "Negócios", clientes: "Clientes", distribuir: "Distribuir clientes", importar: "Importar dados" };
  return (
    <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#E4E7EC", background: "#fff" }}>
      <h1 className="text-lg font-semibold" style={{ color: "#172433" }}>{titles[view] || ""}</h1>
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(v => !v)}
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium"
          style={{ borderColor: "#D7DCE3", color: "#172433" }}
        >
          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: isAdmin ? "#172433" : "#1FBE7A" }}>
            {currentUser.nome.slice(0, 1).toUpperCase()}
          </div>
          {currentUser.nome} {isAdmin && <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EEF1F4", color: "#667085" }}>admin</span>}
          <ChevronDown size={14} />
        </button>
        {showUserMenu && (
          <div className="absolute right-0 mt-1 w-56 rounded-lg border bg-white shadow-lg z-30 py-1" style={{ borderColor: "#E4E7EC" }}>
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase" style={{ color: "#98A2B3" }}>Entrar como</div>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { setCurrentUserId(u.id); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                style={{ color: u.id === currentUser.id ? "#1FBE7A" : "#344054" }}
              >
                <LogIn size={13} /> {u.nome} {u.role === "admin" && <span className="text-[10px] ml-auto uppercase" style={{ color: "#98A2B3" }}>admin</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Pipeline (Kanban) ----------------
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

// ---------------- Clientes ----------------
function ClientesView({ clients, isAdmin, vendedoraById, deals, stages, stageById, onNewClient, vendedoras, assignClient, bulkAssignClients }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkVendedoraId, setBulkVendedoraId] = useState("");
  const [filtroVendedora, setFiltroVendedora] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const dealByClientId = (id) => deals.find(d => d.clientId === id);

  const estadosDisponiveis = Array.from(new Set(clients.map(c => c.estado).filter(Boolean))).sort();

  const filtered = clients.filter(c => {
    if (!(c.nome + c.empresa).toLowerCase().includes(q.toLowerCase())) return false;
    if (filtroVendedora && c.vendedoraId !== filtroVendedora) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroEtapa) {
      const deal = dealByClientId(c.id);
      if (!deal || deal.etapa !== filtroEtapa) return false;
    }
    return true;
  });

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
        {(filtroVendedora || filtroEtapa || filtroEstado || q) && (
          <button
            onClick={() => { setQ(""); setFiltroVendedora(""); setFiltroEtapa(""); setFiltroEstado(""); }}
            className="text-xs font-medium"
            style={{ color: "#667085" }}
          >
            Limpar filtros
          </button>
        )}
        <button onClick={onNewClient} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ml-auto" style={{ background: "#1FBE7A" }}>
          <Plus size={14} /> Novo cliente
        </button>
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
      <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#E4E7EC" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {isAdmin && (
                <th className="text-left px-4 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
              )}
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Cliente</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Empresa</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>UF</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Contato</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Etapa</th>
              {isAdmin && <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#667085" }}>Vendedora</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const deal = deals.find(d => d.clientId === c.id);
              const stage = deal ? stageById(deal.etapa) : null;
              const vend = vendedoraById(c.vendedoraId);
              return (
                <tr key={c.id} className="border-t" style={{ borderColor: "#F0F1F3" }}>
                  {isAdmin && (
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-medium" style={{ color: "#172433" }}>{c.nome}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475467" }}>{c.empresa}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475467" }}>{c.estado || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475467" }}>
                    <div className="flex items-center gap-1"><Phone size={11} /> {c.telefone}</div>
                    <div className="flex items-center gap-1 mt-0.5"><Mail size={11} /> {c.email}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    {stage ? <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: stage.won ? "#E7F9F1" : stage.closed ? "#FDEDEE" : "#EEF1F4", color: stage.won ? "#17A868" : stage.closed ? "#E5484D" : "#344054" }}>{stage.nome}</span> : <span className="text-xs" style={{ color: "#B4BCC6" }}>—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5">
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
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 7 : 5} className="text-center py-8 text-sm" style={{ color: "#98A2B3" }}>Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Distribuir ----------------
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

// ---------------- Importar ----------------
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
        empresa: pick(r, ["empresa", "company", "revenda", "fantasia"]),
        telefone: pick(r, ["telefone", "phone", "fone", "celular"]),
        email: pick(r, ["email", "e-mail"]),
        estado: pick(r, ["estado", "uf"]).toUpperCase().slice(0, 2),
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

// ---------------- Modals ----------------
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
  const [estado, setEstado] = useState("");
  const [vendedoraId, setVendedoraId] = useState(isAdmin ? "" : currentUser.id);
  const [error, setError] = useState("");

  const submit = () => {
    if (!nome.trim()) { setError("Informe ao menos o nome do cliente."); return; }
    onSave({ nome: nome.trim(), empresa: empresa.trim(), telefone: telefone.trim(), email: email.trim(), estado: estado.trim().toUpperCase(), vendedoraId: vendedoraId || null });
  };

  return (
    <ModalShell title="Novo cliente" onClose={onClose} onSubmit={submit}>
      {error && <div className="text-xs rounded-md px-2.5 py-1.5" style={{ background: "#FDEDEE", color: "#E5484D" }}>{error}</div>}
      <Field label="Nome"><input value={nome} onChange={e => setNome(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="Empresa"><input value={empresa} onChange={e => setEmpresa(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input value={telefone} onChange={e => setTelefone(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="E-mail"><input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      </div>
      <Field label="Estado (UF)"><input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className={inputCls} style={{ ...inputStyle, width: 80, textTransform: "uppercase" }} placeholder="SP" /></Field>
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
