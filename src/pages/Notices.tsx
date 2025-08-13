import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import type { Notice } from '../lib/supabase'
import { PencilIcon, TrashIcon, BellIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

type NoticeFormData = z.infer<typeof noticeSchema>

const Notices = () => {
  const { user } = useAuthStore()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notices')
        .select(`
          *,
          posted_by_user:users(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: NoticeFormData) => {
    try {
      if (editingNotice) {
        // Update existing notice
        const { error } = await supabase
          .from('notices')
          .update({
            title: data.title,
            content: data.content,
          })
          .eq('id', editingNotice.id)

        if (error) throw error
      } else {
        // Create new notice
        const { error } = await supabase
          .from('notices')
          .insert([
            {
              title: data.title,
              content: data.content,
              posted_by: user?.id,
            },
          ])

        if (error) throw error
      }

      // Reset form and refresh notices
      reset()
      setShowForm(false)
      setEditingNotice(null)
      fetchNotices()
    } catch (error) {
      console.error('Error saving notice:', error)
    }
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    reset({
      title: notice.title,
      content: notice.content,
    })
    setShowForm(true)
  }

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (error) throw error
      fetchNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingNotice(null)
    reset()
  }

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.posted_by_user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600">Public announcements and important updates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
        >
          <BellIcon className="h-5 w-5" />
          <span>New Notice</span>
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search notices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingNotice ? 'Edit Notice' : 'New Notice'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter notice title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                {...register('content')}
                id="content"
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Write your notice content..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                {editingNotice ? 'Update Notice' : 'Post Notice'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BellIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No notices match your search.' : 'Create your first notice to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <BellIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{notice.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Posted by {notice.posted_by_user?.name || 'Unknown User'}</span>
                    <span>{format(new Date(notice.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                
                {notice.posted_by === user?.id && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(notice)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Edit notice"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete notice"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notices
