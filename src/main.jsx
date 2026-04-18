import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'

ReactDOM.createRoot(document.getElementById('app-root')).render(
  <AuthProvider>
    <DataProvider>
      <App />
    </DataProvider>
  </AuthProvider>
)
