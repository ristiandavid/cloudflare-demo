import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

/**
 * WorkflowStepper - Shows the Cloudflare Workers workflow progress
 * 
 * Displays the current step of the DailyTriage workflow pipeline
 */

interface WorkflowStepperProps {
  isRunning: boolean;
  onComplete: () => void;
}

interface Step {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const WORKFLOW_STEPS: Step[] = [
  { 
    id: 'fetch', 
    name: 'Fetch Sources', 
    description: 'Browser Rendering fetches pages from Twitter, Reddit, GitHub, Discord, Forums',
    icon: 'solar:cloud-download-bold'
  },
  { 
    id: 'analyze', 
    name: 'AI Analysis', 
    description: 'Workers AI extracts sentiment, urgency, and categories from feedback',
    icon: 'solar:magic-stick-3-bold'
  },
  { 
    id: 'store', 
    name: 'Store to D1', 
    description: 'Persisting analyzed feedback to Cloudflare D1 database',
    icon: 'solar:database-bold'
  },
  { 
    id: 'cluster', 
    name: 'Clustering', 
    description: 'Grouping similar feedback items into themes',
    icon: 'solar:layers-minimalistic-bold'
  },
  { 
    id: 'score', 
    name: 'Scoring', 
    description: 'Computing trends and escalation scores',
    icon: 'solar:chart-bold'
  },
  { 
    id: 'report', 
    name: 'Generate Report', 
    description: 'Creating daily triage report with insights',
    icon: 'solar:document-bold'
  },
];

export function WorkflowStepper({ isRunning, onComplete }: WorkflowStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setCurrentStep(0);
      setIsComplete(false);
      return;
    }

    // Simulate workflow progress
    // In a real app, this would poll the workflow status endpoint
    const stepDuration = 1500; // 1.5s per step for demo
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= WORKFLOW_STEPS.length - 1) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isRunning, onComplete]);

  if (!isRunning && !isComplete) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon icon="simple-icons:cloudflare" className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isComplete ? 'Workflow Complete' : 'Running Cloudflare Workers Workflow'}
              </h3>
              <p className="text-xs text-muted-foreground">
                DailyTriage pipeline powered by Workers, D1, Workers AI & Browser Rendering
              </p>
            </div>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-chart-3">
              <Icon icon="solar:check-circle-bold" className="size-5" />
              <span className="text-sm font-medium">Refreshing data...</span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = index === currentStep && !isComplete;
            const isDone = index < currentStep || isComplete;
            
            return (
              <div key={step.id} className="flex-1 flex items-center">
                {/* Step indicator */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    size-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isDone ? 'bg-chart-3 text-white' : 
                      isActive ? 'bg-primary text-white ring-4 ring-primary/30' : 
                      'bg-secondary text-muted-foreground'}
                  `}>
                    {isDone ? (
                      <Icon icon="solar:check-bold" className="size-5" />
                    ) : isActive ? (
                      <Icon icon={step.icon} className="size-5 animate-pulse" />
                    ) : (
                      <Icon icon={step.icon} className="size-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      isActive ? 'text-primary' : isDone ? 'text-chart-3' : 'text-muted-foreground'
                    }`}>
                      {step.name}
                    </div>
                    {isActive && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px]">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Connector line */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors duration-300 ${
                    index < currentStep || isComplete ? 'bg-chart-3' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ 
              width: isComplete 
                ? '100%' 
                : `${((currentStep + 1) / WORKFLOW_STEPS.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
