import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import heroImage from '../../assets/hero.png';

export default function Layout() {
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.97)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Header />
      <div className="flex pt-16"> {/* Added pt-16 to account for fixed header height */}
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
