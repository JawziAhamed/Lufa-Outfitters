import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
    <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
    <p className="mt-2 text-sm text-slate-500">The page you requested does not exist.</p>
    <Link to="/" className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
      Back Home
    </Link>
  </div>
);

export default NotFoundPage;
