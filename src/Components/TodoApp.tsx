import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusFilter, Todo } from '../types/Todo';

import * as todoService from '../api/todos';
import { TodoHeader } from './TodoHeader';
import { TodoMain } from './TodoMain';
import { TodoFooter } from './TodoFooter';
import { ErrorNotification } from './ErrorNotification/ErrorNotification';

export const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessege, setErrorMessege] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(false);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const focusInput = useRef<() => void>();

  const focusInputFn = useCallback((fn: () => void) => {
    focusInput.current = fn;
  }, []);

  useEffect(() => {
    setErrorMessege('');

    todoService
      .getTodos()
      .then(loadingTodos => {
        setTodos(loadingTodos);
        setLoading(true);
        focusInput.current?.();
      })
      .catch(() => {
        setErrorMessege('Unable to load todos');
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleAll() {
    const allCompleted = todos.every(todo => todo.completed);

    setTodos(currentTodos => {
      return currentTodos.map(todo => ({
        ...todo,
        completed: !allCompleted,
      }));
    });
  }

  const visibleTodos = todos.filter(todo => {
    return (
      statusFilter === 'all' ||
      (statusFilter === 'active' && !todo.completed) ||
      (statusFilter === 'completed' && todo.completed)
    );
  });

  function addTodos({
    title,
    completed,
    userId,
  }: Omit<Todo, 'id'>): Promise<void> {
    setLoading(true);
    setErrorMessege('');

    const newTemptodo: Todo = {
      id: -1,
      title,
      completed,
      userId,
    };

    setTempTodo(newTemptodo);

    return todoService
      .creatTodos({ title, completed, userId })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
        setTempTodo(null);

        focusInput.current?.();
      })
      .catch(error => {
        setTempTodo(null);
        setErrorMessege('Unable to add a todo');

        throw error;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function deleteTodos(id: number) {
    setErrorMessege('');
    setDeletingIds(prev => new Set(prev).add(id));

    todoService
      .deleteTodos(id)
      .then(() => {
        setTodos(todos.filter(todo => todo.id !== id));

        focusInput.current?.();
      })
      .catch(error => {
        setErrorMessege('Unable to delete a todo');
        focusInput.current?.();

        throw error;
      })
      .finally(() => {
        setDeletingIds(prev => {
          const next = new Set(prev);

          next.delete(id);

          return next;
        });
      });
  }

  function updateTodos(updateTodo: Todo) {
    setDeletingIds(prev => new Set(prev).add(updateTodo.id));

    return todoService
      .updateTodos(updateTodo)
      .then(todo => {
        setTodos(currentTodos => {
          const newTodo = [...currentTodos];
          const index = newTodo.findIndex(post => post.id === updateTodo.id);

          newTodo.splice(index, 1, todo);

          return newTodo;
        });
      })
      .finally(() => {
        setDeletingIds(prev => {
          const next = new Set(prev);

          next.delete(updateTodo.id);

          return next;
        });
      });
  }

  async function handleClearCompleted() {
    try {
      setErrorMessege('');

      const completedTodos = todos.filter(todo => todo.completed);

      setDeletingIds(prev => {
        const next = new Set(prev);

        completedTodos.forEach(t => next.add(t.id));

        return next;
      });

      const results = await Promise.allSettled(
        completedTodos.map(todo => todoService.deleteTodos(todo.id)),
      );

      const failedIds = results
        .map((result, i) =>
          result.status === 'rejected' ? completedTodos[i].id : null,
        )
        .filter(Boolean);

      setTodos(currentTodos =>
        currentTodos.filter(
          todo => !todo.completed || failedIds.includes(todo.id),
        ),
      );

      focusInput.current?.();

      if (failedIds.length) {
        setErrorMessege('Unable to delete a todo');
      } else {
        setErrorMessege('');
      }

      setDeletingIds(new Set());
    } catch (err) {
      setErrorMessege('Something went wrong');
      focusInput.current?.();
      setDeletingIds(new Set());
    }
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (errorMessege) {
      timer = setTimeout(() => {
        setErrorMessege('');
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [errorMessege]);

  return (
    <>
      <div className="todoapp">
        <h1 className="todoapp__title">todos</h1>
        <div className="todoapp__content">
          <TodoHeader
            todos={todos}
            onSubmit={addTodos}
            setErrorMessege={setErrorMessege}
            focusInputFn={focusInputFn}
            toggleAll={toggleAll}
          />
          {todos && (
            <TodoMain
              visibleTodos={visibleTodos}
              tempTodo={tempTodo}
              onDelete={deleteTodos}
              deletingIds={deletingIds}
              updateTodos={updateTodos}
            />
          )}
          {todos && (
            <TodoFooter
              setStatusFilter={setStatusFilter}
              handleClearCompleted={handleClearCompleted}
              todos={todos}
            />
          )}
        </div>
        <ErrorNotification messege={errorMessege} />
      </div>
    </>
  );
};
