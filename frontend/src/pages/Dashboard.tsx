import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

function Dashboard() {
  return (
    <>
      <DashboardNavbar />
      <Outlet />
    </>
  );
}

export default Dashboard;
