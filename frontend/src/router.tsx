import {
  createBrowserRouter,
  Navigate,
} from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { DashboardPage } from './pages/DashboardPage';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { WorkspacePage } from './pages/WorkspacePage';

export const router =
  createBrowserRouter([
    {
      path: '/',
      element: (
        <Navigate
          to="/dashboard"
          replace
        />
      ),
      errorElement: <ErrorPage />,
    },

    {
      path: '/login',
      element: <LoginPage />,
      errorElement: <ErrorPage />,
    },

    {
      element: <ProtectedRoute />,
      errorElement: <ErrorPage />,

      children: [
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
          element: (
            <ProjectBoardPage />
          ),
        },
      ],
    },
  ]);