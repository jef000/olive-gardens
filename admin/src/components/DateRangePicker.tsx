import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { datePresets, isRangeValid, type DateRange } from '@/lib/dateRange';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  idPrefix?: string;
}

export default function DateRangePicker({ value, onChange, idPrefix = 'date-range' }: DateRangePickerProps) {
  const presets = datePresets();
  const invalid = !isRangeValid(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const active = value.from === preset.range.from && value.to === preset.range.to;
          return (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={active ? 'secondary' : 'outline'}
              onClick={() => onChange(preset.range)}
              className="h-8 rounded-full px-3 text-xs"
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-from`}>From</Label>
          <Input
            id={`${idPrefix}-from`}
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-to`}>To</Label>
          <Input
            id={`${idPrefix}-to`}
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </div>
      </div>

      {invalid && <p className="text-xs text-red-600">The start date must be on or before the end date.</p>}
    </div>
  );
}
