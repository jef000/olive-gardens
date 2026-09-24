import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Tag } from 'lucide-react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import PageIntro from '@/components/PageIntro';
import type { ApiResponse } from '@/types';

interface ServicePrice {
  service_id: string;
  price: string;
  updated_at?: string;
}

const KNOWN_SERVICES = [
  { id: 'main-arena', label: 'Main Arena', hint: 'Venue Hire card · e.g. "From KES 150,000"' },
  { id: 'gardens', label: 'Gardens', hint: 'Venue Hire card · leave empty to show "Rates on request"' },
  { id: 'individual-counselling', label: 'Individual & Family Counselling', hint: 'Counselling & Training card · e.g. "KES 5,000 per session"' },
  { id: 'group-workshops', label: 'Trainings & Workshops', hint: 'Counselling & Training card · e.g. "From KES 3,000 per person"' },
] as const;

export default function Pricing() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['service-prices'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ prices: ServicePrice[] }>>('/pricing');
      return response.data.data?.prices ?? [];
    },
  });

  // Merge known services with any rows the API has (including future ones),
  // so unknown ids can still be edited instead of being silently dropped.
  const rows = useMemo(() => {
    const knownIds = new Set<string>(KNOWN_SERVICES.map((service) => service.id));
    const extras = (data ?? [])
      .filter((price) => !knownIds.has(price.service_id))
      .map((price) => ({ id: price.service_id, label: price.service_id, hint: 'Custom service id' }));
    return [...KNOWN_SERVICES.map((service) => ({ ...service })), ...extras];
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const row of rows) {
      next[row.id] = data.find((price) => price.service_id === row.id)?.price ?? '';
    }
    setValues(next);
  }, [data, rows]);

  const lastUpdated = useMemo(() => {
    const timestamps = (data ?? [])
      .map((price) => (price.updated_at ? new Date(price.updated_at).getTime() : 0))
      .filter((time) => time > 0);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = rows.map((row) => ({ service_id: row.id, price: values[row.id] ?? '' }));
      await api.put('/pricing', { prices: payload });
      await queryClient.invalidateQueries({ queryKey: ['service-prices'] });
      toast({
        title: 'Prices updated',
        description: 'The public services page now shows the new price labels.',
        variant: 'success',
      });
    } catch (error: unknown) {
      toast({
        title: 'Could not update prices',
        description: getApiErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Public website content"
        title="Service pricing"
        description="Price labels shown next to each service on the public website. Leave a field empty to display “Rates on request”."
      />

      <Card className="max-w-3xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-gray-500" />
            Price labels
          </CardTitle>
          <CardDescription>
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleString()}`
              : 'Changes go live on the website as soon as you save.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading && <p className="text-sm text-gray-500" role="status">Loading prices…</p>}
          {isError && (
            <p className="text-sm text-red-600" role="alert">
              Could not load the current prices. Reload the page to try again.
            </p>
          )}

          {!isLoading && !isError && (
            <>
              {!isAdmin && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Only administrators can change prices. You can view the current values below.
                </p>
              )}

              <div className="space-y-4">
                {rows.map((row) => (
                  <div key={row.id} className="grid gap-1.5">
                    <Label htmlFor={`price-${row.id}`}>{row.label}</Label>
                    <Input
                      id={`price-${row.id}`}
                      value={values[row.id] ?? ''}
                      placeholder="Rates on request"
                      disabled={!isAdmin || saving}
                      onChange={(event) => setValues((current) => ({ ...current, [row.id]: event.target.value }))}
                    />
                    <p className="text-xs text-gray-500">{row.hint}</p>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
