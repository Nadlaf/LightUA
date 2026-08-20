import { TriangleAlert } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
}

const ErrorState = ({ title, message }: ErrorStateProps) => (
  <div className="flex size-full min-h-[600px] flex-col items-center justify-center gap-3.5 rounded-3xl border-2 border-dashed border-danger bg-card p-10 text-center shadow-card transition-[background] duration-300">
    <TriangleAlert size={56} className="text-danger" />
    <h3 className="text-[1.5rem] font-bold text-main">{title}</h3>
    <p className="max-w-[420px] text-[1.05rem] leading-relaxed text-muted">{message}</p>
  </div>
);

export default ErrorState;
