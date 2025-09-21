import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from './components/TopBar';
import SideBar from './components/SideBar';

const Layout = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <SideBar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <TopBar sidebarExpanded={sidebarExpanded} />
      <main
        className={`transition-all duration-300 ${
          sidebarExpanded ? 'ml-56' : 'ml-16'
        } pt-16`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;