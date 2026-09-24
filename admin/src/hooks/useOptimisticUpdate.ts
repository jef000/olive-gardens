import { useMutation, useQueryClient, type MutationFunction, type QueryKey } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useOptimisticUpdate<TData, TVariables>({ mutationFn, queryKey, update, successMessage = 'Updated successfully' }: { mutationFn: MutationFunction<TData, TVariables>; queryKey: QueryKey; update: (current: TData | undefined, variables: TVariables) => TData | undefined; successMessage?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({ mutationFn, onMutate: async (variables) => { await queryClient.cancelQueries({ queryKey }); const previous = queryClient.getQueryData<TData>(queryKey); queryClient.setQueryData(queryKey, update(previous, variables)); return { previous }; }, onError: (error, _variables, context) => { if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous); toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'The change was reverted.', variant: 'destructive' }); }, onSuccess: () => toast({ title: successMessage, variant: 'success' }), onSettled: () => queryClient.invalidateQueries({ queryKey }) });
}
