import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Divider, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import { 
  TrendingUp, PointOfSale, LocalShipping, AssignmentLate, 
  Inventory2, CheckCircle, WarningAmber, ArrowUpward, Route as RouteIcon, Map as MapIcon, InfoOutlined
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const DashboardPage = () => {
  const [userRole, setUserRole] = useState('GERENTE');
  
  // ESTADOS DEL GERENTE
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    flotaRuta: 0,
    viajesPendientes: 0,
    viajesActivos: 0
  });
  const [alertasStock, setAlertasStock] = useState<any[]>([]);

  // ESTADOS DEL GESTOR
  const [viajeGestor, setViajeGestor] = useState<any>(null);
  const [ventasRuta, setVentasRuta] = useState(0);
  const [inventarioGestor, setInventarioGestor] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let rol = 'GERENTE';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        rol = payload.rol || payload.role || 'GERENTE';
        setUserRole(rol);
      } catch (e) { console.error(e); }
    }

    const cargarDatosDashboard = async () => {
      // --- LÓGICA DE CARGA PARA EL GESTOR ---
      if (rol === 'GESTOR') {
        try {
          // 1. OBTENER EL ID REAL DEL GESTOR CRUZANDO EL USERNAME
          const usernameLogueado = localStorage.getItem('username');
          const resUsuarios = await api.get('/usuarios');
          const usuarioReal = resUsuarios.data.find((u: any) => u.username === usernameLogueado);
          
          if (!usuarioReal) {
            console.error("No se pudo identificar al usuario en la base de datos.");
            return;
          }

          const idReal = usuarioReal.id;

          // 2. BUSCAR EL VIAJE CON EL ID REAL
          const resViajes = await api.get('/logistica/viajes');
          const miViaje = resViajes.data.find((v: any) => 
            Number(v.gestorId) === Number(idReal) && (v.estado === 'CARGADO' || v.estado === 'EN_RUTA')
          );
          setViajeGestor(miViaje);

          if (miViaje) {
            // Cargar el inventario de SU camión
            const idVehiculo = miViaje.vehiculoId || miViaje.vehiculo_id || miViaje.vehiculo?.id;
            try {
              const resInv = await api.get(`/logistica/vehiculos/${idVehiculo}/inventario`);
              setInventarioGestor(resInv.data);
            } catch (e) { console.error("Error cargando inventario del camión", e); }

            // Cargar las ventas totales de SU viaje actual
            try {
              const resVentas = await api.get(`/ventas/viaje/${miViaje.id}`);
              const totalRuta = resVentas.data.reduce((sum: number, venta: any) => sum + (venta.total || 0), 0);
              setVentasRuta(totalRuta);
            } catch (e) { console.error("Error cargando ventas de la ruta", e); }
          }
        } catch (e) { console.error(e); }
        return; 
      }

      // --- LÓGICA DE CARGA PARA EL GERENTE ---
      try {
        const resVentas = await api.get('/reportes/ventas');
        if (resVentas.data && resVentas.data.length > 0) {
          const totalHoy = resVentas.data.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
          setStats(prev => ({ ...prev, ventasHoy: totalHoy, ventasMes: totalHoy * 4 }));
        }
      } catch (error) { console.error(error); }

      try {
        const resAlertas = await api.get('/alertas/stock-bajo');
        if (resAlertas.data) setAlertasStock(resAlertas.data);
      } catch (error) { console.error(error); }
    };

    cargarDatosDashboard();
  }, []);

  // =====================================================================
  // VISTA EXCLUSIVA PARA EL GESTOR DE VENTA
  // =====================================================================
  if (userRole === 'GESTOR') {
    return (
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
              Panel Operativo de Ruta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resumen de tu viaje actual, ventas registradas e inventario a bordo.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ffffff', px: 2, py: 1, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: viajeGestor ? '#16a34a' : '#94a3b8' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
              {viajeGestor ? 'Ruta Activa' : 'En Espera de Asignación'}
            </Typography>
          </Box>
        </Box>

        {!viajeGestor ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 4, textAlign: 'center', bgcolor: '#ffffff', border: '1px solid #e2e8f0', maxWidth: 500 }}>
              <LocalShipping sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#334155', mb: 1 }}>
                Sin viajes asignados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Actualmente no tienes ningún vehículo cargado ni en ruta a tu cargo. Espera a que Gerencia te asigne una nueva programación para empezar a vender.
              </Typography>
            </Paper>
          </Box>
        ) : (
          <>
            {/* 4 TARJETAS DE MÉTRICAS DEL VIAJE */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Ventas en Ruta</Typography>
                    <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                      S/ {ventasRuta.toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 48, height: 48, borderRadius: 3 }}>
                    <PointOfSale />
                  </Avatar>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#16a34a' }}>Dinero a rendir en liquidación</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Destino / Zona</Typography>
                    <Typography variant="h5" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5, lineHeight: 1.2 }}>
                      {viajeGestor.destino}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#eff6ff', color: '#0284c7', width: 48, height: 48, borderRadius: 3 }}>
                    <MapIcon />
                  </Avatar>
                </Box>
                <Typography variant="caption" color="text.secondary">Ruta asignada</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Vehículo</Typography>
                    <Typography variant="h5" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                      {viajeGestor.vehiculoPlaca || 'No registrada'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 48, height: 48, borderRadius: 3 }}>
                    <LocalShipping />
                  </Avatar>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d97706' }}>Unidad de transporte</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Estado Operativo</Typography>
                    <Typography variant="h5" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                      {viajeGestor.estado}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#f3e8ff', color: '#9333ea', width: 48, height: 48, borderRadius: 3 }}>
                    <RouteIcon />
                  </Avatar>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#9333ea' }}>Viaje: TRIP-{viajeGestor.id}</Typography>
              </Paper>
            </Box>

            {/* TABLA DE INVENTARIO Y RESUMEN LATERAL */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '8fr 4fr' }, gap: 3 }}>
              
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff', minHeight: '380px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Inventory2 sx={{ color: '#0a348a' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                    Inventario a Bordo (Camión)
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {inventarioGestor.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', width: 64, height: 64, mb: 2 }}>
                      <WarningAmber sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                      Camión Vacío
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '400px', mt: 0.5 }}>
                      El inventario de este camión está en cero. Si acabas de iniciar el viaje, verifica si el almacén ya confirmó la carga.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Producto / Presentación</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Precio Base</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Stock Disponible</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventarioGestor.map((item, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {item.producto_nombre}
                              <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'normal' }}>
                                {item.presentacion_nombre}
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#0a348a' }}>
                              S/ {Number(item.precio_venta).toFixed(2)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: '900', color: item.cantidad <= 2 ? '#d32f2f' : '#1e293b', fontSize: '1rem' }}>
                              {item.cantidad}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.cantidad === 0 ? 'AGOTADO' : (item.cantidad <= 2 ? 'POR AGOTARSE' : 'DISPONIBLE')} 
                                color={item.cantidad === 0 ? 'error' : (item.cantidad <= 2 ? 'warning' : 'success')} 
                                size="small" 
                                sx={{ fontWeight: 'bold', borderRadius: 1 }} 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#0a348a', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <InfoOutlined sx={{ color: '#60a5fa' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Instrucciones de Ruta
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, mb: 4 }}>
                    Eres responsable del inventario mostrado en la tabla adjunta y del recaudo de las ventas realizadas.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>CANTIDAD DE PRODUCTOS DISTINTOS</Typography>
                      <Typography variant="h5" sx={{ fontWeight: '900', color: '#ffffff', mt: 0.5 }}>{inventarioGestor.length}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>FECHA DE PROGRAMACIÓN</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#93c5fd', mt: 0.5 }}>{viajeGestor.fecha}</Typography>
                    </Paper>
                  </Box>
                </Box>

                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Módulo de Gestor • CREDI HOGAR PLUS
                  </Typography>
                </Box>
              </Paper>

            </Box>
          </>
        )}
      </Box>
    );
  }

  // =====================================================================
  // VISTA GLOBAL PARA EL GERENTE (Se mantiene intacta)
  // =====================================================================
  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Panel de Control Gerencial
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen en tiempo real de operaciones, flota en ruta y alertas de inventario.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ffffff', px: 2, py: 1, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16a34a' }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Sistema Operativo Activo</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Ventas de Hoy</Typography>
              <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                S/ {stats.ventasHoy.toFixed(2)}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 48, height: 48, borderRadius: 3 }}>
              <PointOfSale />
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#16a34a', bgcolor: '#f0fdf4', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
              <ArrowUpward sx={{ fontSize: '1rem' }} /> +12%
            </Box>
            <Typography variant="caption" color="text.secondary">vs. ayer</Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Ventas del Mes</Typography>
              <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                S/ {stats.ventasMes.toFixed(2)}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#eff6ff', color: '#0284c7', width: 48, height: 48, borderRadius: 3 }}>
              <TrendingUp />
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#0284c7', bgcolor: '#f0f9ff', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
              <ArrowUpward sx={{ fontSize: '1rem' }} /> +8.4%
            </Box>
            <Typography variant="caption" color="text.secondary">meta mensual</Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Flota en Ruta</Typography>
              <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                {stats.flotaRuta} <Typography component="span" variant="body1" color="text.secondary">Vehículos</Typography>
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 48, height: 48, borderRadius: 3 }}>
              <LocalShipping />
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d97706' }}>Operando con normalidad</Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Por Liquidar</Typography>
              <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mt: 0.5 }}>
                {stats.viajesPendientes} <Typography component="span" variant="body1" color="text.secondary">Viajes</Typography>
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#fdf2f8', color: '#db2777', width: 48, height: 48, borderRadius: 3 }}>
              <AssignmentLate />
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#db2777' }}>Requiere revisión de caja</Typography>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '8fr 4fr' }, gap: 3 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#ffffff', minHeight: '380px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WarningAmber sx={{ color: '#d97706' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
              Alertas Críticas de Inventario (Stock Bajo)
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {alertasStock.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', width: 64, height: 64, mb: 2 }}>
                <CheckCircle sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                ¡Todo en orden en el Inventario!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '400px', mt: 0.5 }}>
                No hay productos por debajo del umbral crítico de stock en este momento.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Ubicación</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Stock Actual</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertasStock.map((item, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>{item.sku}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {item.producto} 
                        <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'normal' }}>
                          {item.presentacion}
                        </Box>
                      </TableCell>
                      <TableCell>{item.ubicacion}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '1rem' }}>{item.stock_actual}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.stock_actual === 0 ? 'AGOTADO' : 'CRÍTICO'} 
                          color={item.stock_actual === 0 ? 'error' : 'warning'} 
                          size="small" 
                          sx={{ fontWeight: 'bold', borderRadius: 1 }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#0a348a', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Inventory2 sx={{ color: '#60a5fa' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Resumen Operativo
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, mb: 4 }}>
              Las transacciones registradas reflejan la actividad comercial sincronizada en tienda y ruta. Recuerde auditar el stock físico retornado al finalizar cada jornada.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>VIAJES ACTIVOS EN CURSO</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', color: '#ffffff', mt: 0.5 }}>{stats.viajesActivos}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>VIAJES PENDIENTES DE CIERRE</Typography>
                <Typography variant="h5" sx={{ fontWeight: '900', color: '#fca5a5', mt: 0.5 }}>{stats.viajesPendientes}</Typography>
              </Paper>
            </Box>
          </Box>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              CREDI HOGAR PLUS • Módulo Gerencial v2.5
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};