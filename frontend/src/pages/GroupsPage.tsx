import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronRight, Search, Image as ImageIcon, LogOut, Trash2 } from 'lucide-react';
import { Group, User } from '../types';
import { api, type GroupInviteSummary } from '../services/api';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  cardMotion,
  interactiveCardMotion,
  itemMotion,
  modalBackdropMotion,
  modalPanelMotion,
  staggerContainer,
  subtleButtonMotion,
} from '../lib/motion';

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
  const [pendingInvitesSuccess, setPendingInvitesSuccess] = useState('');
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [acceptingInviteId, setAcceptingInviteId] = useState<number | null>(null);
  const [joiningPublicGroupId, setJoiningPublicGroupId] = useState<number | null>(null);
  const [publicJoinError, setPublicJoinError] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<Group | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState('');
  const [leavingGroupId, setLeavingGroupId] = useState<number | null>(null);
  const [leaveTargetGroup, setLeaveTargetGroup] = useState<Group | null>(null);
  const [leaveGroupError, setLeaveGroupError] = useState('');

  const fetchGroups = (options: { clearInviteFeedback?: boolean } = { clearInviteFeedback: true }) => {
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
    if (options.clearInviteFeedback) {
      setPendingInvitesSuccess('');
    }
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
            : 'Não foi possível carregar convites pendentes.'
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
      setInviteError('Grupo inválido para convite.');
      return;
    }

    const receiverId = Number(inviteReceiverId.trim());
    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      setInviteError('Informe um ID de usuário válido.');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const inviteId = await api.groups.sendInvite(inviteGroupId, receiverId);
      setInviteSuccessId(inviteId);
      setInviteReceiverId('');
    } catch (err) {
      console.error(err);
      setInviteError(err instanceof Error ? err.message : 'Não foi possível criar o convite.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleAcceptPendingInvite = async (inviteId: number) => {
    setPendingInvitesError('');
    setPendingInvitesSuccess('');
    setAcceptingInviteId(inviteId);
    try {
      await api.groups.acceptInvite(inviteId);
      setPendingInvites((previous) => previous.filter((invite) => invite.id !== inviteId));
      setPendingInvitesSuccess('Convite aceito com sucesso.');
      fetchGroups({ clearInviteFeedback: false });
    } catch (err) {
      console.error(err);
      setPendingInvitesError(
        err instanceof Error
          ? err.message
          : 'Não foi possível aceitar este convite.'
      );
    } finally {
      setAcceptingInviteId(null);
    }
  };

  const handleOpenGroup = async (group: Group) => {
    const memberGroup = groups.find((item) => item.id === group.id);
    if (memberGroup) {
      onSelectGroup(memberGroup);
      return;
    }

    if (group.visibility !== 'public') {
      onSelectGroup(group);
      return;
    }

    if (joiningPublicGroupId === group.id) return;

    setPublicJoinError('');
    setJoiningPublicGroupId(group.id);
    try {
      await api.groups.joinPublic(group.id);
      const joinedGroup: Group = {
        ...group,
        role: 'MEMBER',
        member_count: (group.member_count || 0) + 1,
      };
      setGroups((previous) =>
        previous.some((item) => item.id === joinedGroup.id)
          ? previous
          : [...previous, joinedGroup]
      );
      setPublicGroups((previous) => previous.filter((item) => item.id !== group.id));
      setSearchResults((previous) =>
        previous.map((item) => (item.id === group.id ? joinedGroup : item))
      );
      onSelectGroup(joinedGroup);
    } catch (err) {
      console.error(err);
      setPublicJoinError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar neste coletivo público.'
      );
    } finally {
      setJoiningPublicGroupId(null);
    }
  };

  const requestDeleteGroup = (group: Group) => {
    if (group.role !== 'OWNER') return;
    setDeleteTargetGroup(group);
    setDeleteGroupError('');
  };

  const requestLeaveGroup = (group: Group) => {
    if (group.role !== 'MEMBER') return;
    setLeaveTargetGroup(group);
    setLeaveGroupError('');
  };

  const closeDeleteGroupModal = () => {
    if (deleteTargetGroup && deletingGroupId === deleteTargetGroup.id) return;
    setDeleteTargetGroup(null);
    setDeleteGroupError('');
  };

  const closeLeaveGroupModal = () => {
    if (leaveTargetGroup && leavingGroupId === leaveTargetGroup.id) return;
    setLeaveTargetGroup(null);
    setLeaveGroupError('');
  };

  const handleDeleteGroup = async () => {
    if (!deleteTargetGroup || deleteTargetGroup.role !== 'OWNER') return;
    if (deletingGroupId) return;

    const groupId = deleteTargetGroup.id;
    setDeleteGroupError('');
    setDeletingGroupId(groupId);
    try {
      await api.groups.deleteGroup(groupId);
      setGroups((previous) => previous.filter((item) => item.id !== groupId));
      setPublicGroups((previous) => previous.filter((item) => item.id !== groupId));
      setSearchResults((previous) => previous.filter((item) => item.id !== groupId));
      setDeleteTargetGroup(null);
    } catch (err) {
      console.error(err);
      setDeleteGroupError(
        err instanceof Error
          ? err.message
          : 'Não foi possível excluir este coletivo.'
      );
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!leaveTargetGroup || leaveTargetGroup.role !== 'MEMBER') return;
    if (leavingGroupId) return;

    const groupId = leaveTargetGroup.id;
    const publicGroupAfterLeave: Group = {
      ...leaveTargetGroup,
      role: undefined,
      member_count: Math.max(0, leaveTargetGroup.member_count - 1),
    };

    setLeaveGroupError('');
    setLeavingGroupId(groupId);
    try {
      await api.groups.removeMember(groupId, user.id);
      setGroups((previous) => previous.filter((item) => item.id !== groupId));
      if (leaveTargetGroup.visibility === 'public') {
        setPublicGroups((previous) =>
          previous.some((item) => item.id === groupId)
            ? previous.map((item) => (item.id === groupId ? publicGroupAfterLeave : item))
            : [...previous, publicGroupAfterLeave]
        );
        setSearchResults((previous) =>
          previous.map((item) => (item.id === groupId ? publicGroupAfterLeave : item))
        );
      } else {
        setSearchResults((previous) => previous.filter((item) => item.id !== groupId));
      }
      setLeaveTargetGroup(null);
    } catch (err) {
      console.error(err);
      setLeaveGroupError(
        err instanceof Error
          ? err.message
          : 'Não foi possível sair deste coletivo.'
      );
    } finally {
      setLeavingGroupId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-12"
      >
        <div className="text-center sm:text-left">
          <h1 className="font-serif text-6xl mb-2">Coletivos de Arte</h1>
          <p className="text-muted font-sans text-sm tracking-wide">Participe de círculos exclusivos de mentes criativas.</p>
        </div>
        <div className="flex gap-4">
          <motion.button {...subtleButtonMotion} onClick={() => setShowJoin(true)} className="elegant-btn-outline">PARTICIPAR DO GRUPO</motion.button>
          <motion.button {...subtleButtonMotion} onClick={() => setShowCreate(true)} className="elegant-btn-primary">CRIAR NOVO</motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06 }}
        className="mb-12 relative"
      >
        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder=""
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card soft-card py-5 pl-16 pr-6 font-serif text-xl focus:ring-2 focus:ring-gold/20 transition-all outline-none"
          aria-label="Buscar coletivos"
        />
        {isSearching && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      {searchResults.length > 0 && (
        <div className="mb-16">
          <h2 className="font-sans text-[10px] tracking-widest font-bold text-gold uppercase mb-6">Resultados da Busca</h2>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {searchResults.map(group => (
              <motion.div
                key={group.id}
                variants={cardMotion}
                {...interactiveCardMotion}
                className="soft-card p-8 flex flex-col justify-between hover:border-gold/30 cursor-pointer group bg-gold/5"
                onClick={() => void handleOpenGroup(group)}
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
                  <div className="font-sans text-[10px] tracking-widest font-bold uppercase text-gold/60">
                    {joiningPublicGroupId === group.id ? 'Entrando...' : 'Coletivo Público'}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
      {pendingInvitesSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="font-sans text-xs text-green-700">
            {pendingInvitesSuccess}
          </p>
        </div>
      )}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {pendingInvites.map((invite) => (
          <motion.div
            key={invite.id}
            variants={cardMotion}
            {...interactiveCardMotion}
            viewport={{ once: true }}
            className="soft-card p-8 flex flex-col gap-6 border border-gold/20 bg-gold/5"
          >
            <div className="space-y-3">
              <h3 className="font-serif text-2xl">Convite #{invite.id}</h3>
              <p className="font-sans text-xs tracking-wide text-muted">
                Grupo #{invite.groupId} • Enviado por usuário #{invite.senderId}
              </p>
              <p className="font-sans text-[11px] text-muted">
                Recebido em {new Date(invite.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                {...subtleButtonMotion}
                type="button"
                onClick={() => void handleAcceptPendingInvite(invite.id)}
                disabled={acceptingInviteId === invite.id}
                className="elegant-btn-primary"
              >
                {acceptingInviteId === invite.id ? 'ACEITANDO...' : 'ACEITAR'}
              </motion.button>
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
      </motion.div>

      <h2 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase mb-6">Seus Coletivos</h2>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {groups.map(group => (
          <motion.div
            key={group.id}
            variants={cardMotion}
            {...interactiveCardMotion}
            viewport={{ once: true }}
            className="soft-card overflow-hidden flex flex-col hover:border-gold/30 cursor-pointer group"
            onClick={() => void handleOpenGroup(group)}
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
              <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-ink/5">
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
                <div className="flex items-center gap-4">
                  <motion.button
                    {...subtleButtonMotion}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openInviteModal(group.id);
                    }}
                    className="font-sans text-[9px] tracking-widest font-bold uppercase text-muted hover:text-gold transition-colors"
                  >
                    Convidar
                  </motion.button>

                  {group.role === 'OWNER' && (
                    <motion.button
                      {...subtleButtonMotion}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteGroup(group);
                      }}
                      disabled={deletingGroupId === group.id}
                      className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest font-bold uppercase text-red-500 hover:text-ink transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={12} /> {deletingGroupId === group.id ? 'Excluindo...' : 'Excluir'}
                    </motion.button>
                  )}
                  {group.role === 'MEMBER' && (
                    <motion.button
                      {...subtleButtonMotion}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestLeaveGroup(group);
                      }}
                      disabled={leavingGroupId === group.id}
                      className="flex items-center gap-1.5 font-sans text-[9px] tracking-widest font-bold uppercase text-red-500 hover:text-ink transition-colors disabled:opacity-40"
                    >
                      <LogOut size={12} /> {leavingGroupId === group.id ? 'Saindo...' : 'Sair'}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-ink/10">
            <p className="font-serif text-xl text-muted italic">Nenhum coletivo participando ainda.</p>
          </div>
        )}
      </motion.div>

      <h2 className="font-sans text-[10px] tracking-widest font-bold text-muted uppercase mb-6">Coletivos Públicos</h2>
      {publicJoinError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-sans text-xs text-red-500">
            Falha ao entrar no coletivo público: {publicJoinError}
          </p>
        </div>
      )}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {publicGroups.map(group => {
          const isMember = groups.some(g => g.id === group.id);
          return (
            <motion.div
              key={group.id}
              variants={cardMotion}
              {...interactiveCardMotion}
              viewport={{ once: true }}
              className="soft-card overflow-hidden flex flex-col hover:border-gold/30 cursor-pointer group"
              onClick={() => void handleOpenGroup(group)}
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
                  <div className="font-sans text-[10px] tracking-widest font-bold uppercase text-gold/60">
                    {joiningPublicGroupId === group.id ? 'Entrando...' : 'Coletivo Público'}
                  </div>
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
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div {...modalPanelMotion} className="bg-card soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Novo Coletivo</h3>
              <p className="text-muted text-sm mb-8">Estabeleça um espaço privado para seu círculo interno.</p>
              <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleCreate} className="space-y-6">
                <motion.div variants={itemMotion} className="space-y-2">
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
                </motion.div>
                <motion.div variants={itemMotion} className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="" className="elegant-input" required />
                </motion.div>
                <motion.div variants={itemMotion} className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">Descrição</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="" className="elegant-input min-h-[100px]" />
                </motion.div>
                <motion.div variants={itemMotion} className="space-y-2">
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
                </motion.div>
                {createError && <p className="text-red-500 text-xs font-sans">{createError}</p>}
                <motion.div variants={itemMotion} className="flex gap-4 pt-4">
                  <motion.button {...subtleButtonMotion} type="button" onClick={() => { setShowCreate(false); setCreateError(''); }} className="flex-1 elegant-btn-outline">CANCELAR</motion.button>
                  <motion.button {...subtleButtonMotion} type="submit" className="flex-1 elegant-btn-primary">CRIAR</motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          </motion.div>
        )}
        {showJoin && (
          <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div {...modalPanelMotion} className="bg-card soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Participar do Coletivo</h3>
              <p className="text-muted text-sm mb-8">Insira o ID numérico do convite para obter acesso.</p>
              <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleJoin} className="space-y-6">
                <motion.div variants={itemMotion} className="space-y-2">
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
                </motion.div>
                {joinError && <p className="text-red-500 text-xs font-sans">{joinError}</p>}
                <motion.div variants={itemMotion} className="flex gap-4 pt-4">
                  <motion.button {...subtleButtonMotion} type="button" onClick={() => { setShowJoin(false); setJoinError(''); }} className="flex-1 elegant-btn-outline">CANCELAR</motion.button>
                  <motion.button {...subtleButtonMotion} type="submit" className="flex-1 elegant-btn-primary">PARTICIPAR</motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          </motion.div>
        )}
        {showInvite && (
          <motion.div {...modalBackdropMotion} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div {...modalPanelMotion} className="bg-white soft-card p-10 w-full max-w-md">
              <h3 className="font-serif text-3xl mb-2">Convidar para Coletivo</h3>
              <p className="text-muted text-sm mb-8">Informe o ID numérico do usuário para gerar um convite.</p>
              <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleCreateInvite} className="space-y-6">
                <motion.div variants={itemMotion} className="space-y-2">
                  <label className="font-sans text-[10px] tracking-widest font-semibold text-muted uppercase">ID do Usuário</label>
                  <input
                    value={inviteReceiverId}
                    onChange={(e) => setInviteReceiverId(e.target.value)}
                    placeholder=""
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="elegant-input text-center font-semibold"
                    required
                  />
                </motion.div>
                {inviteError && <p className="text-red-500 text-xs font-sans">{inviteError}</p>}
                {inviteSuccessId && (
                  <p className="text-green-600 text-xs font-sans">
                    Convite criado com sucesso. ID do convite: {inviteSuccessId}
                  </p>
                )}
                <motion.div variants={itemMotion} className="flex gap-4 pt-4">
                  <motion.button {...subtleButtonMotion} type="button" onClick={closeInviteModal} className="flex-1 elegant-btn-outline">
                    CANCELAR
                  </motion.button>
                  <motion.button {...subtleButtonMotion} type="submit" disabled={isSubmittingInvite} className="flex-1 elegant-btn-primary">
                    {isSubmittingInvite ? 'ENVIANDO...' : 'ENVIAR CONVITE'}
                  </motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTargetGroup && (
          <DeleteConfirmModal
            title="Excluir Coletivo"
            description="Esta ação remove o coletivo, seus convites e suas publicações. Depois da confirmação, a remoção não pode ser desfeita."
            itemName={deleteTargetGroup.name}
            loading={deletingGroupId === deleteTargetGroup.id}
            error={deleteGroupError}
            onCancel={closeDeleteGroupModal}
            onConfirm={() => void handleDeleteGroup()}
          />
        )}
        {leaveTargetGroup && (
          <DeleteConfirmModal
            title="Sair do Coletivo"
            description="Esta ação remove sua participação no coletivo. Para voltar a um coletivo privado, será necessário receber um novo convite."
            itemName={leaveTargetGroup.name}
            confirmLabel="SAIR"
            loading={leavingGroupId === leaveTargetGroup.id}
            error={leaveGroupError}
            onCancel={closeLeaveGroupModal}
            onConfirm={() => void handleLeaveGroup()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
