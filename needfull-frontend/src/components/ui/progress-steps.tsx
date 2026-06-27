import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={steps.length - 1}>
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className={cn('flex items-start', isLast ? '' : 'flex-1')}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300',
                    isCompleted && 'border-green-500 bg-green-500 text-white',
                    isCurrent && 'border-brand bg-brand text-white shadow-md',
                    !isCompleted && !isCurrent && 'border-gray-300 bg-white text-gray-400',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : idx + 1}
                </div>
                <div className="mt-1.5 text-center">
                  <p className={cn(
                    'text-[11px] font-bold leading-tight',
                    isCurrent && 'text-brand',
                    isCompleted && 'text-green-600',
                    !isCompleted && !isCurrent && 'text-gray-500',
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className={cn(
                  'mt-4 h-0.5 flex-1 mx-2 transition-colors duration-300',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200',
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
