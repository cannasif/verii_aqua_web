import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

interface StepperStepProps {
  step: number;
  title: string;
  description?: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
}

function Stepper({ children, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

function StepperStep({
  step,
  title,
  description,
  isCompleted = false,
  isCurrent = false,
}: StepperStepProps) {
  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center flex-1">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
            isCompleted
              ? 'bg-primary border-primary text-primary-foreground'
              : isCurrent
              ? 'border-primary text-primary bg-primary/10'
              : 'border-muted text-muted-foreground bg-background'
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="font-semibold">{step}</span>
          )}
        </div>
        <div className="mt-2 text-center">
          <p
            className={cn(
              'text-sm font-medium',
              isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {step < 3 && (
        <div
          className={cn(
            'flex-1 h-0.5 mx-4 transition-colors',
            isCompleted ? 'bg-primary' : 'bg-muted'
          )}
        />
      )}
    </div>
  );
}

Stepper.Step = StepperStep;

export { Stepper, StepperStep };
