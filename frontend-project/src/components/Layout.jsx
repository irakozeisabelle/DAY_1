import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/cars',    label: '🚗 Car' },
  { to: '/slots',   label: '🅿️ Parking Slot' },
  { to: '/records', label: '📋 Parking Record' },
  { to: '/payments',label: '💳 Payment' },
  { to: '/reports', label: '📊 Reports' },
];

export default function Layout() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1">
              <span className="text-2xl">🅿</span>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">SmartPark</h1>
              <p className="text-xs text-blue-200">Parking Space Sales Management System</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-blue-800'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">👤 {username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded font-medium transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-blue-800' : 'text-blue-100 hover:bg-blue-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-blue-800 text-blue-200 text-center text-xs py-2">
        © 2025 SmartPark PSSMS — Rubavu District, Western Province, Rwanda
      </footer>
    </div>
  );
}
