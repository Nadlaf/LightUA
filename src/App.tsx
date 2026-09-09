import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { useTheme } from '@/lib/theme';
import SchedulePage from '@/pages/SchedulePage';

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
