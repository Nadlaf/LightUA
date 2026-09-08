import { TriangleAlert } from 'lucide-react';

import Panel from './Panel';

interface ErrorStateProps {
  title: string;
  message: string;
}

const ErrorState = ({ title, message }: ErrorStateProps) => (
  <Panel className="flex-col gap-3.5 border-2 border-dashed border-danger p-10 text-center">
    <TriangleAlert size={56} className="text-danger" />
    <h2 className="text-[1.5rem] font-bold text-main">{title}</h2>
    <p className="max-w-[420px] text-[1.05rem] leading-relaxed text-muted">{message}</p>
  </Panel>
);

export default ErrorState;
