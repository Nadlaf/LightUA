import { Search } from 'lucide-react';

import Panel from './Panel';

interface EmptyStateProps {
  title: string;
  message: string;
}

const EmptyState = ({ title, message }: EmptyStateProps) => (
  <Panel className="flex-col border-2 border-dashed border-primary p-10 text-center">
    <div className="flex max-w-[320px] flex-col items-center">
      <Search className="mb-[30px] size-[150px] stroke-[2.5] text-main opacity-90" />
      <h2 className="mb-4 text-[1.8rem] font-extrabold text-main">{title}</h2>
      <p className="text-[1.05rem] leading-relaxed text-muted">{message}</p>
    </div>
  </Panel>
);

export default EmptyState;
