import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Send, Paperclip, Smile } from 'lucide-react'
import Layout from '../components/Layout'

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    name: string;
  };
}

export default function GroupChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groupChannelId, setGroupChannelId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch group channel and messages
  useEffect(() => {
    const fetchGroupChannel = async () => {
      try {
        // Get the group channel
        const { data: channel, error: channelError } = await supabase
          .from('channels')
          .select('id')
          .eq('type', 'group')
          .single();

        if (channelError) {
          console.error('Error fetching group channel:', channelError);
          return;
        }

        setGroupChannelId(channel.id);

        // Fetch existing messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            created_at,
            sender:users(name)
          `)
          .eq('channel_id', channel.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error in fetchGroupChannel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupChannel();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!groupChannelId) return;

    const channel = supabase
      .channel('group-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${groupChannelId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              sender_id,
              created_at,
              sender:users(name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupChannelId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !groupChannelId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: groupChannelId,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading chat...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Group Chat</h1>
          <p className="text-sm text-gray-600">Team communication</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.sender_id !== user?.id && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.sender?.name || 'Unknown User'}
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}