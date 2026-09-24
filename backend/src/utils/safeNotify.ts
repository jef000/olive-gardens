/**
 * Fire-and-forget notification dispatch.
 *
 * Mutations commit before their notification is written; if the notification
 * insert fails (missing table, enum drift, transient DB error) the client must
 * not receive a 500 for an operation that already succeeded — which would make
 * it retry and duplicate the record.
 */
export function safeNotify(operation: Promise<unknown>, context: string): void {
  void operation.catch((error) => {
    console.error(
      `Notification dispatch failed (${context}):`,
      error instanceof Error ? error.message : error
    );
  });
}
