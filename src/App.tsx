import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import SchedulePage from '@/features/schedule/SchedulePage';
import { useTheme } from '@/lib/theme';

const App = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <SchedulePage />
      <Footer />
    </div>
  );
};

export default App;
