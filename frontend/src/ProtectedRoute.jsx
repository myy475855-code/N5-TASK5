import {Navigate,useLocation} from 'react-router-dom';import {useAuth} from './AuthContext';
export default function ProtectedRoute({children}){const {user,loading}=useAuth();const loc=useLocation();if(loading)return <div className="center">Checking authentication…</div>;return user?children:<Navigate to="/login" replace state={{from:loc.pathname}}/>}
