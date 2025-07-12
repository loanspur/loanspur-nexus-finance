import { Button } from "@/components/ui/button";
import { isDevelopment } from '@/lib/dev-utils';
import { Dices } from 'lucide-react';

interface SampleDataButtonProps {
  onFillSampleData: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export const SampleDataButton = ({ 
  onFillSampleData, 
  disabled = false,
  size = 'sm'
}: SampleDataButtonProps) => {
  if (!isDevelopment()) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onFillSampleData}
      disabled={disabled}
      className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 text-xs"
    >
      <Dices className="w-3 h-3 mr-1" />
      Fill Sample
    </Button>
  );
};