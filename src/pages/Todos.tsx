import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import type { Todo } from '../lib/supabase'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().min(1, 'Assignee is required'),
  due_date: z.string().min(1, 'Due date is required'),
  agency_id: z.string().optional(),
})

type TodoFormData = z.infer<typeof todoSchema>

interface SortableTodoItemProps {
  todo: Todo
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: 'pending' | 'completed') => void
  currentUser: any
}

const SortableTodoItem = ({ todo, onEdit, onDelete, onStatusChange, currentUser }: SortableTodoItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOverdue = new Date(todo.due_date) < new Date() && todo.status === 'pending'
  const canEdit = todo.assigned_to === currentUser?.id || !todo.agency_id

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-md p-6 cursor-move hover:shadow-lg transition-shadow duration-200 ${
        isOverdue ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{todo.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              todo.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {todo.status}
            </span>
            {isOverdue && (
              <span className="text-xs text-red-600 font-medium">OVERDUE</span>
            )}
          </div>
          
          <p className="text-gray-700 mb-3">{todo.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>Assigned to {todo.assigned_to === currentUser?.id ? 'You' : 'Team Member'}</span>
            </div>
            
            {todo.agency_id && (
              <div className="flex items-center space-x-1">
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>Agency Task</span>
              </div>
            )}
            
            <span>Due: {format(new Date(todo.due_date), 'MMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onStatusChange(todo.id, todo.status === 'completed' ? 'pending' : 'completed')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
              todo.status === 'completed'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {todo.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
          </button>
          
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(todo)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Edit todo"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                title="Delete todo"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const Todos = () => {
  const { user } = useAuthStore()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
  })

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('todos')
        .select(`
          *,
          assigned_user:users!assigned_to(id, name, email)
        `)
        .order('created_at', { ascending: false })

      // Filter by agency if user is agency member
      if (user?.role === 'agency_member' && user?.agency_id) {
        query = query.eq('agency_id', user.agency_id)
      }

      const { data, error } = await query
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TodoFormData) => {
    try {
      if (editingTodo) {
        // Update existing todo
        const { error } = await supabase
          .from('todos')
          .update({
            title: data.title,
            description: data.description,
            assigned_to: data.assigned_to,
            due_date: data.due_date,
            agency_id: data.agency_id || null,
          })
          .eq('id', editingTodo.id)

        if (error) throw error
      } else {
        // Create new todo
        const { error } = await supabase
          .from('todos')
          .insert([
            {
              title: data.title,
              description: data.description,
              assigned_to: data.assigned_to,
              due_date: data.due_date,
              agency_id: data.agency_id || null,
              status: 'pending',
            },
          ])

        if (error) throw error
      }

      // Reset form and refresh todos
      reset()
      setShowForm(false)
      setEditingTodo(null)
      fetchTodos()
    } catch (error) {
      console.error('Error saving todo:', error)
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    reset({
      title: todo.title,
      description: todo.description,
      assigned_to: todo.assigned_to,
      due_date: todo.due_date.split('T')[0],
      agency_id: todo.agency_id || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)

      if (error) throw error
      fetchTodos()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleStatusChange = async (todoId: string, newStatus: 'pending' | 'completed') => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todoId)

      if (error) throw error
      fetchTodos()
    } catch (error) {
      console.error('Error updating todo status:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTodo(null)
    reset()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus
    const matchesType = filterType === 'all' || 
                       (filterType === 'personal' && !todo.agency_id) ||
                       (filterType === 'agency' && todo.agency_id)
    
    return matchesSearch && matchesStatus && matchesType
  })

  const pendingTodos = filteredTodos.filter(todo => todo.status === 'pending')
  const completedTodos = filteredTodos.filter(todo => todo.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To-Dos</h1>
          <p className="text-gray-600">Manage your tasks and projects</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Todo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="personal">Personal</option>
            <option value="agency">Agency</option>
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTodo ? 'Edit Todo' : 'New Todo'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter todo title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <input
                  {...register('assigned_to')}
                  type="text"
                  id="assigned_to"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter assignee ID"
                />
                {errors.assigned_to && (
                  <p className="mt-1 text-sm text-red-600">{errors.assigned_to.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter todo description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  {...register('due_date')}
                  type="date"
                  id="due_date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>

              {user?.role === 'core_member' && (
                <div>
                  <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Agency (Optional)
                  </label>
                  <input
                    {...register('agency_id')}
                    type="text"
                    id="agency_id"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Leave empty for personal todo"
                  />
                  {errors.agency_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.agency_id.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                {editingTodo ? 'Update Todo' : 'Create Todo'}
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

      {/* Todos */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
              ? 'No todos match your current filters.' 
              : 'Create your first todo to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending ({pendingTodos.length})</h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pendingTodos.map(todo => todo.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {pendingTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        currentUser={user}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed ({completedTodos.length})</h2>
              <div className="space-y-4">
                {completedTodos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    currentUser={user}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Todos
