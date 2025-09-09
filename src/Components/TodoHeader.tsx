import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';
import cn from 'classnames';
import { USER_ID } from '../api/todos';

type Props = {
  todos: Todo[];
  onSubmit: (todo: Omit<Todo, 'id'>) => Promise<void>;
  setErrorMessege: (messege: string) => void;
  focusInputFn: (fn: () => void) => void;
  toggleAll: () => void;
};

export const TodoHeader: React.FC<Props> = ({
  todos,
  onSubmit,
  setErrorMessege,
  focusInputFn,
  toggleAll,
}) => {
  const [titleTodo, setTitleTodo] = useState('');
  const [hasTitleError, setHasTitleError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    focusInputFn(() => {
      inputRef.current?.focus();
    });
  }, [focusInputFn]);

  useEffect(() => {
    if (justAdded) {
      inputRef.current?.focus();
      setJustAdded(false);
    }
  }, [justAdded]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitleTodo(event.target.value);
    setHasTitleError('');
  };

  // const handleAllCompleted = () => {};

  const reset = () => {
    setTitleTodo('');
    setHasTitleError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setHasTitleError('');
    setErrorMessege('');

    const title = titleTodo.trim();

    if (!title) {
      setHasTitleError('Title should not be empty');
      setErrorMessege('Title should not be empty');

      return;
    }

    setIsSubmiting(true);

    onSubmit({
      title,
      completed,
      userId: USER_ID,
    })
      .then(() => {
        reset();
        setJustAdded(true);
      })
      .catch(error => {
        setErrorMessege('Unable to add a todo');
        setJustAdded(true);

        console.error(error);
      })
      .finally(() => {
        setIsSubmiting(false);
      });
  };

  return (
    <header className="todoapp__header">
      {/* this button should have `active` class only if all todos are completed */}
      <button
        type="button"
        // className="todoapp__toggle-all active"
        onClick={toggleAll}
        className={cn('todoapp__toggle-all', {
          active: todos.every(todo => todo.completed),
        })}
        data-cy="ToggleAllButton"
      />
      {/* Add a todo on form submit */}
      <form onSubmit={handleSubmit} onReset={reset}>
        <input
          data-cy="NewTodoField"
          type="text"
          ref={inputRef}
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={titleTodo}
          onChange={handleTitleChange}
          disabled={isSubmiting}
        />
      </form>
    </header>
  );
};
