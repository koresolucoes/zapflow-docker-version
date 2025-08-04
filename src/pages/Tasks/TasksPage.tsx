import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { CALENDAR_ICON, ARROW_LEFT_ICON, PLUS_ICON, FILTER_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { fetchAllTasks, updateTaskStatus, Task } from '../../services/taskService.js';

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTeam } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadTasks = async (reset = false) => {
    if (!activeTeam) return;
    
    try {
      const currentPage = reset ? 1 : page;
      const data = await fetchAllTasks(activeTeam.id, {
        page: currentPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        date: dateFilter === 'all' ? undefined : dateFilter,
        search: searchQuery || undefined,
      });
      
      setTasks(prev => reset ? data.tasks : [...prev, ...data.tasks]);
      setHasMore(data.hasMore);
      if (reset) setPage(1);
      else setPage(p => p + 1);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(true);
  }, [statusFilter, dateFilter, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (isOverdue(dueDate)) {
      return (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Atrasada
        </span>
      );
    }
    
    const statusMap: Record<string, { text: string; class: string }> = {
      pending: { text: 'Pendente', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      in_progress: { text: 'Em Andamento', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      completed: { text: 'Concluída', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' };
    
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Convert the status to is_completed boolean
      const isCompleted = newStatus === 'completed';
      
      // Update the task status using the task service
      await updateTaskStatus(taskId, isCompleted);
      
      // Update the local state to reflect the change immediately
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                is_completed: isCompleted,
                status: isCompleted ? 'completed' : 'pending'
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ARROW_LEFT_ICON className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FILTER_ICON className="w-4 h-4" />
            <span>Filtros</span>
          </Button>
          
          <Button
            className="flex items-center gap-2"
            onClick={() => navigate('/tasks/new')}
          >
            <PLUS_ICON className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Data
              </label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="tomorrow">Amanhã</option>
                <option value="this_week">Esta Semana</option>
                <option value="overdue">Atrasadas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Buscar
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-md text-sm"
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Minhas Tarefas
          </h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'}
          </p>
        </div>

        <div className="divide-y divide-border max-h-[calc(100vh-250px)] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Carregando tarefas...</p>
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">
                        {task.content}
                      </h3>
                      {task.due_date && getStatusBadge(task.status, task.due_date)}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                      {task.contact && (
                        <div className="flex items-center text-muted-foreground">
                          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-1.5 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          </span>
                          {task.contact.name || 'Sem contato'}
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className={`flex items-center ${isOverdue(task.due_date) ? 'text-red-500' : 'text-muted-foreground'}`}>
                          <CALENDAR_ICON className="w-4 h-4 mr-1.5 flex-shrink-0" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <select
                      className="text-xs p-1 border rounded-md bg-background"
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <CALENDAR_ICON className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Tente ajustar seus filtros de busca.'
                  : 'Crie sua primeira tarefa para começar a organizar seu trabalho.'}
              </p>
              {!searchQuery && statusFilter === 'all' && dateFilter === 'all' && (
                <Button className="mt-4" onClick={() => navigate('/tasks/new')}>
                  <PLUS_ICON className="w-4 h-4 mr-2" />
                  Criar Tarefa
                </Button>
              )}
            </div>
          )}
        </div>

        {!isLoading && hasMore && (
          <div className="p-4 border-t border-border text-center">
            <Button
              variant="outline"
              onClick={() => loadTasks()}
              disabled={isLoading}
            >
              Carregar mais tarefas
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TasksPage;
