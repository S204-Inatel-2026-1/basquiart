import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronRight, Search, Image as ImageIcon } from 'lucide-react';
import { Group, User } from '../types';
import { api, type GroupInviteSummary } from '../services/api';

export const GroupsPage = ({
  user,
  onSelectGroup,
  initialSearchQuery = '',
}: {
  user: User;
  onSelectGroup: (g: Group) => void;
  initialSearchQuery?: string;
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null);
  const [inviteReceiverId, setInviteReceiverId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccessId, setInviteSuccessId] = useState<number | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<GroupInviteSummary[]>([]);
  const [pendingInvitesError, setPendingInvitesError] = useState('');
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [acceptingInviteId, setAcceptingInviteId] = useState<number | null>(null);

  const fetchGroups = () => {
    api.groups.listMine()
      .then(data => setGroups(data))
      .catch(err => { console.error(err); setGroups([]); });
    api.groups.listPublic()
      .then(data => setPublicGroups(data))
      .catch(err => {
        console.error(err);
        fetch('/api/groups/public')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch public groups');
            return res.json();
          })
          .then(data => setPublicGroups(data))
          .catch(fallbackErr => { console.error(fallbackErr); setPublicGroups([]); });
      });
    setPendingInvitesError('');
    setIsLoadingInvites(true);
    api.groups.listInvites()
      .then(data => {
        const pending = data
          .filter((invite) => invite.receiverId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPendingInvites(pending);
      })
      .catch(err => {
        console.error(err);
        setPendingInvites([]);
        setPendingInvitesError(
          err instanceof Error
            ? err.message
            : 'Nao foi possivel carregar convites pendentes.'
        );
      })
      .finally(() => {
        setIsLoadingInvites(false);
      });
  };

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => { setSearchQuery(initialSearchQuery); }, [initialSearchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const query = searchQuery.trim().toLowerCase();
        const combined = [...groups, ...publicGroups].filter(
          (group, index, self) => self.findIndex((item) => item.id === group.id) === index
        );
        const filtered = combined.filter((group) =>
          group.name.toLowerCase().includes(query) ||
          group.description.toLowerCase().includes(query)
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, groups, publicGroups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.groups.create(name, description, visibility);
      setName('');
      setDescription('');
      setVisibility('public');
      setCoverUrl(null);
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar coletivo');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const inviteId = Number(inviteCode.trim());
    if (!Number.isInteger(inviteId) || inviteId <= 0) {
      setJoinError('Informe um ID de convite válido.');
      return;
    }

    try {
      await api.groups.acceptInvite(inviteId);
      setInviteCode('');
      setShowJoin(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
      setJoinError(err instanceof Error ? err.message : 'Não foi possível entrar no coletivo.');
    }
  };

  const openInviteModal = (groupId: number) => {
    setInviteGroupId(groupId);
    setInviteReceiverId('');
    setInviteError('');
    setInviteSuccessId(null);
    setShowInvite(true);
  };

  const closeInviteModal = () => {
    setShowInvite(false);
    setInviteGroupId(null);
    setInviteReceiverId('');
    setInviteError('');
    setInviteSuccessId(null);
    setIsSubmittingInvite(false);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccessId(null);

    if (!inviteGroupId) {
      setInviteError('Grupo invalido para convite.');
      return;
    }

    const receiverId = Number(inviteReceiverId.trim());
    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      setInviteError('Informe um ID de usuario valido.');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const inviteId = await api.groups.sendInvite(inviteGroupId, receiverId);
      setInviteSuccessId(inviteId);
      setInviteReceiverId('');
    } catch (err) {
      console.error(err);
      setInviteError(err instanceof Error ? err.message : 'Nao foi possivel criar o convite.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleAcceptPendingInvite = async (inviteId: number) => {
    setPendingInvitesError('');
    setAcceptingInviteId(inviteId);
    try {
      await api.groups.acceptInvite(inviteId);
      setPendingInvites((previous) => previous.filter((invite) => invite.id !== inviteId));
      fetchGroups();
    } catch (err) {
      console.error(err);
      setPendingInvitesError(
        err instanceof Error
          ? err.message
          : 'Nao foi possivel aceitar este convite.'
      );
    } finally {
      setAcceptingInviteId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-12">
        <div className="text-center sm:text-left">
          <h1 className="font-serif text-6xl mb-2">Coletivos de Arte</h1>
          <p className="text-muted font-sans text-sm tracking-wide">Participe de círculos exclusivos de mentes criativas.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowJoin(true)} className="elegant-btn-outline">PARTICIPAR DO GRUPO</button>
          <button onClick={() => setShowCreate(true)} className="elegant-btn-primary">CRIAR NOVO</button>
        </div>
      </div>

      <div className="mb-12 relative">
        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder=""
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white soft-card py-5 pl-16 pr-6 font-serif text-xl focus:ring-2 focus:ring-gold/20 transition-all outline-none"
          aria-label="Buscar coletivos"
        />
        {isSearching && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="mb-16">
          <h2 className="font-sans text-[10px] tracking-widest font-bold text-gold uppercase mb-6">Resultados da Busca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {searchResults.map(group => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="soft-card p-8 flex flex-col justify-between hover:border-gold/30 cursor-pointer group bg-gold/5"
                onClick={() => onSelectGroup(group)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-3xl group-hover:text-gold transition-colors">{group.name}</h3>
                    <ChevronRight className="text-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="font-sans text-sm text-muted leading-relaxed mb-8">{group.description}</p>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-ink/5">
                  <div className="flex items-center gap-2 font-sans text-[10px] tracking-widest font-bold uppercase text-muted">
                    <Users size={14} /> {group.member_count} Membros
                  </div>
                  <div className="font-sans text-[10px] tracking-widest font-bold uppercase text-gold/60">Coletivo Público</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase mb-6">Convites Pendentes</h2>
      {pendingInvitesError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-sans text-xs text-red-500">
            Falha no fluxo de convites: {pendingInvitesError}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {pendingInvites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="soft-card p-8 flex flex-col gap-6 border border-gold/20 bg-gold/5"
          >
            <div className="space-y-3">
              <h3 className="font-serif text-2xl">Convite #{invite.id}</h3>
              <p className="font-sans text-xs tracking-wide text-muted">
                Grupo #{invite.groupId} • Enviado por usuario #{invite.senderId}
              </p>
              <p className="font-sans text-[11px] text-muted">
                Recebido em {new Date(invite.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleAcceptPendingInvite(invite.id)}
                disabled={acceptingInviteId === invite.id}
                className="elegant-btn-primary"
              >
                {acceptingInviteId === invite.id ? 'ACEITANDO...' : 'ACEITAR'}
              </button>
            </div>
          </motion.div>
        ))}
        {isLoadingInvites && (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-ink/10">
            <p className="font-serif text-xl text-muted italic">Carregando convites pendentes...</p>
          </div>
        )}
        {!isLoadingInvites && pendingInvites.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-ink/10">
            <p className="font-serif text-xl text-muted italic">Nenhum convite pendente no momento.</p>
          </div>
        )}
      </div>

      <h2 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase mb-6">Seus Coletivos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {groups.map(group => (
          <motion.div
            key={group.id}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="soft-card overflow-hidden flex flex-col hover:border-gold/30 cursor-pointer group"
            onClick={() => onSelectGroup(group)}
          >
            {group.cover_url && (
              <div className="h-32 w-full overflow-hidden">
                <img src={group.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
              </div>
            )}
            <div className="p-8 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-serif text-3xl group-hover:text-gold transition-colors">{group.name}</h3>
                  <ChevronRight className="text-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
                <p className="font-sans text-sm text-muted leading-relaxed mb-8">{group.description}</p>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-ink/5">
                <div className="flex items-center gap-2 font-sans text-[10px] tracking-widest font-bold uppercase text-muted">
                  <Users size={14} /> {group.member_count} Membros
                </div>
                <div className="font-sans text-[10px] tracking-widest font-bold uppercase text-gold/60">
                  {group.invite_code
                    ? `Código: ${group.invite_code}`
                    : group.visibility === 'private'
                      ? 'Coletivo Privado'
                      : 'Coletivo Público'}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInviteModal(group.id);
                  }}
                  className="font-sans text-[9px] tracking-widest font-bold uppercase text-muted hover:text-gold transition-colors"
                >
                  Convidar
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-ink/10">
            <p className="font-serif text-xl text-muted italic">Nenhum coletivo participando ainda.</p>
          </div>
        )}
      </div>

      <h2 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase mb-6">Coletivos Públicos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {publicGroups.map(group => {
          const isMember = groups.some(g => g.id === group.id);
          return (
            <motion.div
              key={group.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="soft-card overflow-hidden flex flex-col hover:border-gold/30 cursor-pointer group"
              onClick={() => onSelectGroup(group)}
            >
              {group.cover_url && (
                <div className="h-32 w-full overflow-hidden">
                  <img src={group.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                </div>
              )}
              <div className="p-8 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <h3 className="font-serif text-3xl group-hover:text-gold transition-colors">{group.name}</h3>
                      {isMember && (
                        <span className="font-sans text-[8px] tracking-widest font-bold text-gold uppercase mt-1">Você é membro</span>
                      )}
                    </div>
                    <ChevronRight className="text-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="font-sans text-sm text-muted leading-relaxed mb-8">{group.description}</p>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-ink/5">
                  <div className="flex items-center gap-2 font-sans text-[10px] tracking-widest font-bold uppercase text-muted">
                    <Users size={14} /> {group.member_count} Membros
                  </div>
                  <div className="font-sans text-[10px] tracking-widest font-bold uppercase text-gold/60">Coletivo Público</div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {publicGroups.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-ink/10">
            <p className="font-serif text-xl text-muted italic">Nenhum outro coletivo público disponível.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Novo Coletivo</h3>
              <p className="text-muted text-sm mb-8">Estabeleça um espaço privado para seu círculo interno.</p>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Foto de Capa</label>
                  <div
                    className="w-full h-32 rounded-xl border border-dashed border-ink/10 bg-paper/50 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 hover:border-gold/30 transition-all relative overflow-hidden group"
                    onClick={() => document.getElementById('group-cover-upload')?.click()}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <ImageIcon size={24} className="mb-2 text-muted group-hover:text-gold transition-colors" />
                        <span className="font-sans text-[8px] tracking-[0.2em] font-bold uppercase text-muted group-hover:text-gold">Upload Capa</span>
                      </>
                    )}
                    <input id="group-cover-upload" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="" className="elegant-input" required />
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Descrição</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="" className="elegant-input min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Visibilidade</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`flex-1 py-3 rounded-xl font-sans text-[10px] tracking-widest font-bold uppercase transition-all ${visibility === 'public' ? 'bg-gold text-ink' : 'bg-paper text-muted border border-ink/5'}`}
                    >
                      Público
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`flex-1 py-3 rounded-xl font-sans text-[10px] tracking-widest font-bold uppercase transition-all ${visibility === 'private' ? 'bg-gold text-ink' : 'bg-paper text-muted border border-ink/5'}`}
                    >
                      Privado
                    </button>
                  </div>
                  <p className="text-[10px] text-muted italic mt-2">
                    {visibility === 'public' ? 'Qualquer pessoa pode encontrar e participar deste coletivo.' : 'Apenas aqueles com um código de convite podem participar.'}
                  </p>
                </div>
                {createError && <p className="text-red-500 text-xs font-sans">{createError}</p>}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); }} className="flex-1 elegant-btn-outline">CANCELAR</button>
                  <button type="submit" className="flex-1 elegant-btn-primary">CRIAR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showJoin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Participar do Coletivo</h3>
              <p className="text-muted text-sm mb-8">Insira o ID numérico do convite para obter acesso.</p>
              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">ID do Convite</label>
                  <input
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder=""
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="elegant-input text-center font-semibold"
                    required
                  />
                </div>
                {joinError && <p className="text-red-500 text-xs font-sans">{joinError}</p>}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setShowJoin(false); setJoinError(''); }} className="flex-1 elegant-btn-outline">CANCELAR</button>
                  <button type="submit" className="flex-1 elegant-btn-primary">PARTICIPAR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Convidar para Coletivo</h3>
              <p className="text-muted text-sm mb-8">Informe o ID numerico do usuario para gerar um convite.</p>
              <form onSubmit={handleCreateInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">ID do Usuario</label>
                  <input
                    value={inviteReceiverId}
                    onChange={(e) => setInviteReceiverId(e.target.value)}
                    placeholder=""
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="elegant-input text-center font-semibold"
                    required
                  />
                </div>
                {inviteError && <p className="text-red-500 text-xs font-sans">{inviteError}</p>}
                {inviteSuccessId && (
                  <p className="text-green-600 text-xs font-sans">
                    Convite criado com sucesso. ID do convite: {inviteSuccessId}
                  </p>
                )}
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeInviteModal} className="flex-1 elegant-btn-outline">
                    CANCELAR
                  </button>
                  <button type="submit" disabled={isSubmittingInvite} className="flex-1 elegant-btn-primary">
                    {isSubmittingInvite ? 'ENVIANDO...' : 'ENVIAR CONVITE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
