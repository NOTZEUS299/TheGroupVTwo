import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { getSupabase } from '../lib/supabase'
import type { Message, Channel } from '../lib/supabase'
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const AgencyChat = () => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState<Channel | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.agency_id) {
      fetchChannel()
      fetchMessages()
      subscribeToMessages()
    }
  }, [user?.agency_id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChannel = async () => {
    if (!user?.agency_id) return
    
    try {
      const { data, error } = await getSupabase()
        .from('channels')
        .select('*')
        .eq('type', 'agency')
        .eq('agency_id', user.agency_id)
        .single()

      if (error) throw error
      setChannel(data)
    } catch (error) {
      console.error('Error fetching channel:', error)
    }
  }

  const fetchMessages = async () => {
    if (!user?.agency_id) return
    
    try {
      setLoading(true)
      const { data, error } = await getSupabase()
        .from('messages')
        .select(`
          *,
          sender:users(id, name, email)
        `)
        .eq('channel_id', `agency-${user.agency_id}`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    if (!user?.agency_id) return
    
    const subscription = getSupabase()
      .channel('agency-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.agency-${user.agency_id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          fetchSenderInfo(newMessage)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const fetchSenderInfo = async (message: Message) => {
    try {
      const { data: sender } = await getSupabase()
        .from('users')
        .select('id, name, email')
        .eq('id', message.sender_id)
        .single()

      if (sender) {
        const messageWithSender = { ...message, sender }
        setMessages(prev => [...prev, messageWithSender as Message])
      }
    } catch (error) {
      console.error('Error fetching sender info:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel) return

    try {
      const { error } = await getSupabase()
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            sender_id: user?.id,
            content: newMessage.trim(),
          },
        ])

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !channel) return

    try {
      // Upload file to getSupabase() Storage
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await getSupabase().storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = getSupabase().storage
        .from('chat-attachments')
        .getPublicUrl(fileName)

      // Send message with attachment
      const { error: messageError } = await getSupabase()
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            sender_id: user?.id,
            content: `📎 ${file.name}`,
            attachment_url: publicUrl,
          },
        ])

      if (messageError) throw messageError
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user?.agency_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Agency Assigned</h3>
          <p className="text-gray-600">You need to be assigned to an agency to access agency chat.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Agency Chat</h1>
        <p className="text-gray-600">Chat with your agency team members</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">Start the conversation with your agency team!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                {message.sender_id !== user?.id && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-green-600">
                        {message.sender?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {message.sender?.name || 'Unknown User'}
                    </span>
                  </div>
                )}
                
                <div className={`bg-gray-100 rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${
                  message.sender_id === user?.id 
                    ? 'bg-blue-100 text-blue-900 ml-auto' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.attachment_url ? (
                    <div>
                      <p className="mb-2">{message.content}</p>
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        View Attachment
                      </a>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                
                <div className={`text-xs text-gray-500 mt-1 ${message.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Attach file"
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

export default AgencyChat
