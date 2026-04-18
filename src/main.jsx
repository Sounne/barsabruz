import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { DataProvider } from './context/DataContext'

ReactDOM.createRoot(document.getElementById('app-root')).render(
  <DataProvider>
    <App />
  </DataProvider>
)
