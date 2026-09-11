import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventarioPage } from './pages/InventarioPage';
import { ClientesPage } from './pages/ClientesPage';
import { FacturacionPage } from './pages/FacturacionPage';
import { VehiculosViajesPage } from './pages/VehiculosViajesPage';
import { TrabajadoresPage } from './pages/TrabajadoresPage';
import { ProductosPage } from './pages/ProductosPage';
import { PuntoDeVentaPage } from './pages/PuntoDeVentaPage';
import { ReportesPage } from './pages/ReportesPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/punto-venta" element={<PuntoDeVentaPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/viajes" element={<VehiculosViajesPage />} />
          <Route path="/trabajadores" element={<TrabajadoresPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/facturacion" element={<FacturacionPage />} />
          <Route path="/reportes" element={<ReportesPage />} /> 
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;