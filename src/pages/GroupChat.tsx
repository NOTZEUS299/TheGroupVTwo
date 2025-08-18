import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { getSupabase } from '../lib/supabase'
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
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const subscriptionRef = useRef<any>(null)
  const messageIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    initializeChat()
    return () => {
      // Cleanup subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      setChannelLoading(true)
      setError(null)
      
      // First, try to fetch existing group channel
      let { data: existingChannel, error: channelError } = await getSupabase()
        .from('channels')
        .select('*')
        .eq('type', 'group')
        .maybeSingle()

      if (channelError) {
        console.warn('Error fetching existing channel:', channelError)
      }

      if (!existingChannel) {
        // Create group channel if it doesn't exist
        const { data: newChannel, error: createError } = await getSupabase()
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
          setError('Unable to create chat channel. Please check your permissions.')
          return
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
      setError('Failed to initialize chat. Please check your connection and try again.')
    } finally {
      setChannelLoading(false)
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getSupabase()
        .from('messages')
        .select(`
          *,
          sender:users(id, name, email)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('Error fetching messages:', error)
        if (error.code === 'PGRST116') {
          setError('Chat feature is not available. Please contact an administrator.')
        } else if (error.message.includes('permission')) {
          setError('You do not have permission to view messages. Please check your role.')
        } else {
          setError('Failed to load messages. Please try refreshing.')
        }
        setMessages([])
      } else {
        const messagesData = data || []
        // Track message IDs to prevent duplicates
        messageIdsRef.current.clear()
        messagesData.forEach(msg => messageIdsRef.current.add(msg.id))
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages. Please try refreshing.')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = (channelId: string) => {
    try {
      // Clean up existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      const subscription = getSupabase()
        .channel('group-messages')
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
            
            // Prevent duplicate messages
            if (messageIdsRef.current.has(newMessage.id)) {
              return
            }
            
            messageIdsRef.current.add(newMessage.id)
            
            // Fetch sender info for the new message
            fetchSenderInfo(newMessage)
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to messages')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Subscription error')
            setError('Real-time updates unavailable. Messages will still work but may not appear instantly.')
          }
        })

      subscriptionRef.current = subscription
    } catch (error) {
      console.error('Error setting up message subscription:', error)
      setError('Real-time updates unavailable. Messages will still work but may not appear instantly.')
    }
  }

  const fetchSenderInfo = async (message: Message) => {
    try {
      const { data: sender } = await getSupabase()
        .from('users')
        .select('id, name, email')
        .eq('id', message.sender_id)
        .maybeSingle()

      if (sender) {
        const messageWithSender = { ...message, sender }
        setMessages(prev => {
          // Double-check for duplicates before adding
          if (prev.some(msg => msg.id === message.id)) {
            return prev
          }
          return [...prev, messageWithSender as Message]
        })
      } else {
        // Add message without sender info
        setMessages(prev => {
          if (prev.some(msg => msg.id === message.id)) {
            return prev
          }
          return [...prev, message]
        })
      }
    } catch (error) {
      console.error('Error fetching sender info:', error)
      // Add message without sender info
      setMessages(prev => {
        if (prev.some(msg => msg.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel || !user) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: tempId,
      channel_id: channel.id,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: user
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setSending(true)
    setError(null)

    try {
      const { data, error } = await getSupabase()
        .from('messages')
        .insert([
          {
            channel_id: channel.id,
            sender_id: user.id,
            content: messageContent,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setNewMessage(messageContent) // Restore message content
        
        if (error.message.includes('permission')) {
          setError('You do not have permission to send messages. Please check your role.')
        } else {
          setError('Failed to send message. Please try again.')
        }
      } else {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...data, sender: user } : msg
        ))
        messageIdsRef.current.add(data.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageContent) // Restore message content
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !channel || !user) return

    setSending(true)
    setError(null)

    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadError } = await getSupabase().storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        setError('Failed to upload file. Please try again.')
        return
      }

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
            sender_id: user.id,
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
    } finally {
      setSending(false)
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

  const retryInitialization = () => {
    setError(null)
    initializeChat()
  }

  if (channelLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white/70">Initializing chat...</p>
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
          <h3 className="text-lg font-medium text-white/90 mb-2">Chat Error</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={retryInitialization}
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
      <div className="glass-card rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-white/90">Group Chat</h1>
        <p className="text-white/70">Communicate with all core members</p>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 glass-card rounded-lg shadow-md mb-6 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/40 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white/90 mb-2">No messages yet</h3>
              <p className="text-white/70">Start the conversation by sending the first message!</p>
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
                      <span className="text-sm font-medium text-white/80">
                        {message.sender?.name || 'Unknown User'}
                      </span>
                    </div>
                  )}
                  
                  <div className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${
                    message.sender_id === user?.id 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-white/20 text-white/90 backdrop-blur-sm'
                  }`}>
                    {message.attachment_url ? (
                      <div>
                        <p className="mb-2">{message.content}</p>
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-200 hover:text-blue-100 underline text-sm"
                        >
                          View Attachment
                        </a>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  <div className={`text-xs text-white/50 mt-1 ${message.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-white/20 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
                rows={3}
                disabled={sending}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="p-2 text-white/60 hover:text-white/90 transition-colors duration-200 disabled:opacity-50"
                title="Attach file"
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !channel || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                title="Send message"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
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
          
          <p className="text-xs text-white/50 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

export default GroupChat