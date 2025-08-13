import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import type { Message, Channel } from '../lib/supabase'
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const GroupChat = () => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [channelLoading, setChannelLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeChat()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      setChannelLoading(true)
      setError(null)
      
      // First, try to fetch existing group channel
      let { data: existingChannel, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('type', 'group')
        .maybeSingle()

      if (channelError) {
        console.warn('Error fetching existing channel:', channelError)
      }

      if (!existingChannel) {
        // Create group channel if it doesn't exist
        const { data: newChannel, error: createError } = await supabase
          .from('channels')
          .insert([
            {
              name: 'Group Chat',
              type: 'group',
            },
          ])
          .select()
          .single()

        if (createError) {
          console.warn('Error creating channel:', createError)
          // Continue without channel for now
        } else {
          existingChannel = newChannel
        }
      }

      if (existingChannel) {
        setChannel(existingChannel)
        await fetchMessages(existingChannel.id)
        subscribeToMessages(existingChannel.id)
      } else {
        setError('Unable to initialize chat. Please try refreshing the page.')
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
      setError('Failed to initialize chat. Please check your connection.')
    } finally {
      setChannelLoading(false)
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, name, email)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('Error fetching messages:', error)
        // Continue with empty messages array
      } else {
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = (channelId: string) => {
    try {
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message
            // Fetch sender info for the new message
            fetchSenderInfo(newMessage)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up message subscription:', error)
    }
  }

  const fetchSenderInfo = async (message: Message) => {
    try {
      const { data: sender } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', message.sender_id)
        .maybeSingle()

      if (sender) {
        const messageWithSender = { ...message, sender }
        setMessages(prev => [...prev, messageWithSender as Message])
      } else {
        // Add message without sender info
        setMessages(prev => [...prev, message])
      }
    } catch (error) {
      console.error('Error fetching sender info:', error)
      // Add message without sender info
      setMessages(prev => [...prev, message])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel) return

    try {
      setError(null)
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            sender_id: user?.id,
            content: newMessage.trim(),
          },
        ])

      if (error) {
        console.error('Error sending message:', error)
        setError('Failed to send message. Please try again.')
      } else {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !channel) return

    try {
      setError(null)
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading file:', error)
        setError('Failed to upload file. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName)

      // Send message with attachment
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            sender_id: user?.id,
            content: `📎 ${file.name}`,
            attachment_url: publicUrl,
          },
        ])

      if (messageError) {
        console.error('Error sending file message:', messageError)
        setError('File uploaded but failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Failed to upload file. Please try again.')
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

  if (channelLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing chat...</p>
        </div>
      </div>
    )
  }

  if (error && !channel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeChat}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Group Chat</h1>
        <p className="text-gray-600">Communicate with all core members</p>
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">Start the conversation by sending the first message!</p>
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
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-blue-600">
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
              disabled={!newMessage.trim() || !channel}
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

export default GroupChat
