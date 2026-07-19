import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/i18n';

import { API_BASE_URL as API_URL, apiHeaders, handleUnauthorized } from '@/config/network';
interface Conversation {
  _id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface Message {
  _id: string;
  sender_id: string;
  recver_id: string;
  text: string;
  created_at: string;
}

function getToken(): string | null {
  try { return localStorage.getItem('workpiserv_token'); } catch { return null; }
}

function getMyId(): string | null {
  try {
    const u = localStorage.getItem('workpiserv_user');
    return u ? JSON.parse(u)._id || null : null;
  } catch { return null; }
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [activeConv, setActiveConv]       = useState<Conversation | null>(null);
  const [newMessage, setNewMessage]       = useState('');
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [sending, setSending]             = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = getMyId();

  // Ouvre directement une conversation avec un vendeur (bouton "Contact" d'une page service).
  useEffect(() => {
    const to = searchParams.get('to');
    if (!to || loadingConvs || activeConv) return;
    const existing = conversations.find(c => c.participantId === to);
    setActiveConv(existing || {
      _id: `new-${to}`,
      participantId: to,
      participantName: searchParams.get('name') || 'Pioneer',
      participantAvatar: searchParams.get('avatar') || undefined,
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unread: 0,
    });
  }, [searchParams, loadingConvs, conversations, activeConv]);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoadingConvs(false); return; }
    fetch(`${API_URL}/api/messages/conversations`, {
      headers: apiHeaders({ Authorization: `Bearer ${token}` })
    })
      .then(r => { if (!r.ok) { handleUnauthorized(r.status); return []; } return r.json(); })
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    const token = getToken();
    fetch(`${API_URL}/api/messages/chat/${activeConv.participantId}`, {
      headers: apiHeaders(token ? { Authorization: `Bearer ${token}` } : {})
    })
      .then(r => { if (!r.ok) { handleUnauthorized(r.status); return []; } return r.json(); })
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || sending) return;
    const token = getToken();
    if (!token) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender_id: myId || '',
      recver_id: activeConv.participantId,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
        body: JSON.stringify({ recver_id: activeConv.participantId, text }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => prev.map(m => m._id === tempMsg._id ? saved : m));
        setConversations(prev => prev.map(c =>
          c._id === activeConv._id
            ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : c
        ));
      } else {
        handleUnauthorized(res.status);
      }
    } catch {
      // keep optimistic message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const showChat = !!activeConv;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background max-w-4xl mx-auto border-x border-border overflow-hidden">
      <div className={`flex flex-col w-full md:w-80 shrink-0 bg-card border-r border-border ${showChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-lg">{t('nav.messages')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t('common.loading')}</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-2 px-6 text-center">
              <MessageSquare size={40} className="text-gray-300" />
              <p className="font-medium text-muted-foreground">{t('messages.none')}</p>
              <p className="text-xs">{t('messages.noneHint')}</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left border-b border-border ${activeConv?._id === conv._id ? 'bg-brand-light' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 text-sm font-bold">
                  {conv.participantAvatar
                    ? <img src={conv.participantAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    : conv.participantName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm truncate">{conv.participantName}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-1">{formatDate(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-brand-light0 text-white text-xs rounded-full flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex flex-col flex-1 ${showChat ? 'flex' : 'hidden md:flex'}`}>
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare size={48} className="text-gray-300" />
            <p className="text-sm">{t('messages.select')}</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-card border-b border-border flex items-center gap-3 sticky top-0 z-10">
              <button onClick={() => { setActiveConv(null); navigate('/messages'); }} className="md:hidden p-1 text-muted-foreground">
                <ArrowLeft size={20} />
              </button>
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">
                {activeConv.participantAvatar
                  ? <img src={activeConv.participantAvatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                  : <User size={18} />
                }
              </div>
              <h2 className="font-semibold text-foreground text-sm">{activeConv.participantName}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <p className="text-sm">{t('messages.start')}</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === myId;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? 'bg-brand-light0 text-white rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-200' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-card border-t border-border flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={t('messages.writePh')}
                className="flex-1 px-4 py-2 bg-muted border border-transparent rounded-full text-sm focus:outline-none focus:bg-card focus:border-orange-500 transition-all"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2.5 bg-brand-light0 text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
