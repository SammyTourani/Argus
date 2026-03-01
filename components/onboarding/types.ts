export type OnboardingStep = 'welcome' | 'what_to_build' | 'choose_model' | 'first_build';
export type SubStep = 'role' | 'usecase' | 'url' | 'details';

export interface OnboardingData {
  role: string;
  useCase: string;
  referenceUrl: string;
  projectDescription: string;
  category: string;
  chosenModel: string;
}

export interface StepProps {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onSkip?: () => void;
}
