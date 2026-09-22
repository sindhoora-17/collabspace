import { createBrowserRouter } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { WorkspacePage } from './pages/WorkspacePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/workspaces/:workspaceId',
    element: <WorkspacePage />,
  },
  {
    path: '/workspaces/:workspaceId/projects/:projectId',
    element: <ProjectBoardPage />,
  },
]);