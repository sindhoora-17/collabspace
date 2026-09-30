import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from 'react-router-dom';

import { AppHeader } from '../components/layout/AppHeader';

import '../styles/error-page.css';

export function ErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message =
    'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message =
        'The page you are looking for does not exist.';
    } else {
      message =
        error.statusText ||
        message;
    }
  }

  return (
    <>
      <AppHeader />

      <main className="error-page">
        <div className="error-card">
          <div className="error-code">
            !
          </div>

          <h1>{title}</h1>

          <p>{message}</p>

          <Link
            to="/dashboard"
            className="error-home-button"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </>
  );
}