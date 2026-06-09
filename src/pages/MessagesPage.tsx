import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';

interface Message {
  _id: string;
  sender_id: string;
  recver_id: string;
  text: string;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // On simule une récupération de l'historique de chat pour le test
  // Plus tard, on liera dynamiquement l'ID du correspondant
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem('workpiserv_token');
        // Appel temporaire sur une discussion générique ou vide au début
        const res = await fetch('https://workpiserv-api.onrender.com/api/messages/chat/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erreur de chargement des messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Logique d'envoi à connecter avec ton API
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-50 max-w-md mx-auto border-x border-gray-100">
      {/* Header du Chat */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
          <User size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">Messagerie WorkPi</h2>
          <p className="text-xs text-green-500 font-medium">Connecté à MongoDB Atlas</p>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Chargement des discussions...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 px-6 text-center">
            <MessageSquare size={40} className="text-gray-300 animate-bounce" />
            <p className="font-medium text-gray-600">Aucune discussion active</p>
            <p className="text-xs">Les messages liés à vos contrats et commandes MongoDB s'afficheront ici.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="flex flex-col">
              <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%] border border-gray-100">
                <p className="text-sm text-gray-800">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2 pb-safe">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-orange-500 transition-all"
        />
        <button type="submit" className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
      }
