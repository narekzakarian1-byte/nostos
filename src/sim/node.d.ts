// Минимальное объявление того, что симулятор берёт у Node.
// Пакет @types/node не ставим: зависимостей в проекте ровно три (CLAUDE.md),
// а из всего Node здесь нужны только аргументы командной строки и код возврата.
declare const process: {
  readonly argv: readonly string[];
  exit(code?: number): never;
};
