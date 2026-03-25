import { Outlet } from 'react-router-dom';

import Footer from '../components/common/Footer';
import NavBar from '../components/common/NavBar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
