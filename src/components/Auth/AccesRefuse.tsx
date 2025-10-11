import React from 'react';
import { Link } from 'react-router-dom';

const AccesRefuse: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Accès Refusé
        </h1>
        <p className="text-gray-600 mb-8">
          Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.
          Veuillez contacter votre administrateur si vous pensez que c'est une erreur.
        </p>
        <div className="space-x-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-block text-blue-600 hover:text-blue-800"
          >
            Retour en arrière
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccesRefuse;