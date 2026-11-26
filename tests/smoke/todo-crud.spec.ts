import { test, expect } from '@fixtures';

const TODO_ITEMS = [
  'Buy groceries',
  'Review PR',
  'Write Playwright test',
];

/**
 * Challenge 1.2: TodoMVC Core Workflow
 *
 * Automates essential CRUD actions on a stateful client application:
 * - Adding distinct todo items
 * - Marking tasks as completed
 * - Filtering by Active and Completed states
 * - Clearing completed items and verifying state persistence
 */
test.describe('TodoMVC Core Workflow @smoke @foundational', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.open();
  });

  test('should complete the full TodoMVC lifecycle: add, complete, filter, and clear', async ({
    todoPage,
  }) => {
    // a. Agregar 3 tareas distintas: "Buy groceries", "Review PR" y "Write Playwright test"
    await todoPage.addTodos(TODO_ITEMS);
    await todoPage.assertVisibleTodosCount(3);
    await todoPage.assertVisibleTodosText(TODO_ITEMS);
    await todoPage.assertItemsLeft(3);

    // b. Marcar la segunda tarea ("Review PR") como completada
    await todoPage.markAsCompleted('Review PR');
    await todoPage.assertTodoCompleted('Review PR');
    await todoPage.assertItemsLeft(2);

    // c. Filtrar por "Active" y verificar mediante una aserción que solo aparezcan 2 tareas
    await todoPage.filterBy('Active');
    await todoPage.assertVisibleTodosCount(2);
    await todoPage.assertVisibleTodosText(['Buy groceries', 'Write Playwright test']);

    // d. Filtrar por "Completed" y verificar mediante una aserción que solo aparezca 1 tarea
    await todoPage.filterBy('Completed');
    await todoPage.assertVisibleTodosCount(1);
    await todoPage.assertVisibleTodosText(['Review PR']);

    // e. Limpiar las tareas completadas ("Clear completed") y verificar el conteo final de tareas restantes
    await todoPage.clearCompleted();
    await todoPage.assertVisibleTodosCount(0);

    // Regresar al filtro "All" para validar el estado consolidado de las tareas restantes
    await todoPage.filterBy('All');
    await todoPage.assertVisibleTodosCount(2);
    await todoPage.assertVisibleTodosText(['Buy groceries', 'Write Playwright test']);
    await todoPage.assertItemsLeft(2);
  });

  test('should add distinct todo items and update items counter', async ({
    todoPage,
  }) => {
    await todoPage.addTodo('Buy groceries');
    await todoPage.assertVisibleTodosCount(1);
    await todoPage.assertItemsLeft(1);

    await todoPage.addTodo('Review PR');
    await todoPage.assertVisibleTodosCount(2);
    await todoPage.assertItemsLeft(2);
  });

  test('should filter todos by Active and Completed states', async ({
    todoPage,
  }) => {
    await todoPage.addTodos(TODO_ITEMS);
    await todoPage.markAsCompleted('Review PR');

    await todoPage.filterBy('Active');
    await todoPage.assertVisibleTodosCount(2);

    await todoPage.filterBy('Completed');
    await todoPage.assertVisibleTodosCount(1);
  });

  test('should clear completed items and retain only active tasks', async ({
    todoPage,
  }) => {
    await todoPage.addTodos(TODO_ITEMS);
    await todoPage.markAsCompleted('Review PR');

    await todoPage.clearCompleted();
    await todoPage.assertVisibleTodosCount(2);
    await todoPage.assertVisibleTodosText(['Buy groceries', 'Write Playwright test']);
    await todoPage.assertItemsLeft(2);
  });
});
