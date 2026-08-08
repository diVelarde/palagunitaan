import { AuthProvider, useAuth } from './context/AuthContext';


function AuthHeader() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-semibold">Palagunitaan</h1>
      {user ? (
        <div className="flex items-center gap-3">
          
          <span className="text-sm text-gray-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-red-600">
            Log out
          </button>
        </div>
      ) : (
        <button onClick={login} className="text-sm text-blue-600">
          Sign in with Google
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthHeader />
    </AuthProvider>
  );
}

export default App;