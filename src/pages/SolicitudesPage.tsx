import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, Dialog, DialogContent, DialogActions, DialogTitle, TextField, IconButton, 
  InputAdornment, CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, Search as SearchIcon, Visibility as VisibilityIcon, 
  CheckCircle, Cancel, Delete as DeleteIcon, Remove as RemoveIcon
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const SolicitudesPage = () => {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('GERENTE');
  const [userId, setUserId] = useState<number | null>(null);

  // Estados para Modal de Nueva Solicitud (GESTOR)
  const [openNuevaSolicitud, setOpenNuevaSolicitud] = useState(false);
  const [productosAlmacen, setProductosAlmacen] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [notas, setNotas] = useState('');

  // Estados para Modal de Ver Detalles (GERENTE/GESTOR)
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesSolicitud, setDetallesSolicitud] = useState<any[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);

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

    const cargarData = async () => {
      setLoading(true);
      let currentId: number | null = null;
      if (rol === 'GESTOR') {
        const usernameLogueado = localStorage.getItem('username');
        try {
          const resUsuarios = await api.get('/usuarios');
          const usuarioReal = resUsuarios.data.find((u: any) => u.username === usernameLogueado);
          currentId = usuarioReal ? usuarioReal.id : null;
          setUserId(currentId);
        } catch (error) { console.error("Error al buscar ID de Gestor", error); }
      }

      // Cargar lista de solicitudes
      try {
        const resSol = await api.get(`/solicitudes?usuarioId=${currentId || ''}&rol=${rol}`);
        setSolicitudes(resSol.data);
      } catch (e) { console.error("Error cargando solicitudes", e); }

      // Cargar catálogo principal para hacer el pedido (El Gestor pide lo que hay en Almacén #1)
      try {
        const resProd = await api.get('/pos/productos?usuarioId=1&rol=GERENTE');
        setProductosAlmacen(resProd.data);
      } catch (e) { console.error("Error cargando productos del almacén", e); }
      
      setLoading(false);
    };
    cargarData();
  }, []);

  const recargarSolicitudes = async () => {
    try {
      const res = await api.get(`/solicitudes?usuarioId=${userId || ''}&rol=${userRole}`);
      setSolicitudes(res.data);
    } catch (e) { console.error(e); }
  };

  // --- LÓGICA GESTOR: CREAR SOLICITUD ---
  const agregarAlCarrito = (prod: any) => {
    const existe = carrito.find(item => item.id === prod.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
  };

  const restarDelCarrito = (id: number) => {
    const existe = carrito.find(item => item.id === id);
    if (existe && existe.cantidad > 1) {
      setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item));
    } else {
      eliminarDelCarrito(id);
    }
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const enviarSolicitud = async () => {
    if (carrito.length === 0) return alert("Selecciona al menos un producto para solicitar.");
    try {
      const payload = {
        gestorId: userId,
        notas: notas,
        detalles: carrito.map(c => ({ inventarioId: c.id, cantidad: c.cantidad }))
      };
      await api.post('/solicitudes', payload);
      setOpenNuevaSolicitud(false);
      setCarrito([]);
      setNotas('');
      recargarSolicitudes();
    } catch (e) { 
      alert("Error al enviar solicitud. Asegúrate de que el backend esté actualizado."); 
    }
  };

  const productosFiltrados = productosAlmacen.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- LÓGICA GERENTE: VER Y ATENDER SOLICITUDES ---
  const verDetalles = async (sol: any) => {
    setSolicitudSeleccionada(sol);
    setOpenDetalles(true);
    setDetallesSolicitud([]);
    try {
      const res = await api.get(`/solicitudes/${sol.id}/detalles`);
      setDetallesSolicitud(res.data);
    } catch (e) { console.error(e); }
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      await api.put(`/solicitudes/${id}/estado`, { estado });
      setOpenDetalles(false);
      recargarSolicitudes();
    } catch (e) { alert("Error al cambiar estado"); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            {userRole === 'GESTOR' ? 'Mis Solicitudes de Stock' : 'Bandeja de Solicitudes de Stock'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userRole === 'GESTOR' ? 'Pide productos al almacén principal para tu próximo viaje.' : 'Revisa y atiende los pedidos generados por los Gestores en ruta.'}
          </Typography>
        </Box>
        {userRole === 'GESTOR' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNuevaSolicitud(true)} sx={{ bgcolor: '#0a348a', borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>
            Nuevo Pedido
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}># Pedido</TableCell>
              {userRole === 'GERENTE' && <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Gestor Solicitante</TableCell>}
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Items Diferentes</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
            ) : solicitudes.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No hay solicitudes registradas.</TableCell></TableRow>
            ) : (
              solicitudes.map((row) => (
                <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>REQ-{row.id}</TableCell>
                  {userRole === 'GERENTE' && <TableCell sx={{ fontWeight: 'bold' }}>{row.gestor}</TableCell>}
                  <TableCell>{new Date(row.fecha_hora).toLocaleString('es-PE')}</TableCell>
                  <TableCell>{row.total_items} productos</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.estado} 
                      color={row.estado === 'PENDIENTE' ? 'warning' : row.estado === 'ATENDIDA' ? 'success' : 'error'} 
                      size="small" sx={{ fontWeight: 'bold' }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => verDetalles(row)}><VisibilityIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL GESTOR: CREAR NUEVA SOLICITUD */}
      <Dialog open={openNuevaSolicitud} onClose={() => setOpenNuevaSolicitud(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { height: '80vh', borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#0a348a', color: 'white', fontWeight: 'bold' }}>Nueva Solicitud de Stock (Preventa)</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, bgcolor: '#f8fafc' }}>
          
          {/* Panel Izquierdo: Catálogo */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TextField 
              fullWidth 
              placeholder="Buscar producto en almacén principal..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              sx={{ mb: 2, mt: 1, bgcolor: 'white' }} 
              slotProps={{ 
                input: { 
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ) 
                } 
              }} 
            />
            <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stock Almacén</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Agregar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosFiltrados.map((p) => (
                    <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography>
                      </TableCell>
                      <TableCell align="center">{p.stock}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" size="small" onClick={() => agregarAlCarrito(p)}>
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {/* Panel Derecho: Carrito de Pedido */}
          <Box sx={{ width: { xs: '100%', md: '380px' }, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#64748b', mb: 1, mt: 1 }}>TU PEDIDO DE STOCK</Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, p: 1, mb: 2 }}>
              {carrito.length === 0 ? <Typography align="center" color="text.secondary" sx={{ mt: 5 }}>No has agregado productos.</Typography> : 
                carrito.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 0.5 }}>{item.nombre}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => restarDelCarrito(item.id)} sx={{ bgcolor: '#e2e8f0', p: 0.2 }}><RemoveIcon fontSize="small" /></IconButton>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.cantidad}</Typography>
                        <IconButton size="small" onClick={() => agregarAlCarrito(item)} sx={{ bgcolor: '#e2e8f0', p: 0.2 }}><AddIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => eliminarDelCarrito(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))
              }
            </Box>
            <TextField 
              fullWidth 
              label="Notas para el Gerente (Opcional)" 
              multiline 
              rows={2} 
              value={notas} 
              onChange={(e) => setNotas(e.target.value)} 
              sx={{ bgcolor: 'white' }}
            />
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenNuevaSolicitud(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button variant="contained" onClick={enviarSolicitud} sx={{ bgcolor: '#0ea5e9', fontWeight: 'bold' }}>Enviar Pedido a Gerencia</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL GERENTE/GESTOR: VER DETALLES */}
      <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: '#f8fafc', fontWeight: 'bold' }}>
          Detalle del Pedido REQ-{solicitudSeleccionada?.id}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Gestor Solicitante: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{solicitudSeleccionada?.gestor}</span></Typography>
            <Typography variant="body2" color="text.secondary">Notas de viaje: <span style={{ color: '#0f172a' }}>{solicitudSeleccionada?.notas || 'Ninguna'}</span></Typography>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Producto / Presentación</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cant. Pedida</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detallesSolicitud.length === 0 ? (
                  <TableRow><TableCell colSpan={2} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : (
                  detallesSolicitud.map((item, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>{item.producto}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>{item.presentacion}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.cantidad} color="primary" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: userRole === 'GERENTE' && solicitudSeleccionada?.estado === 'PENDIENTE' ? 'space-between' : 'center' }}>
          {userRole === 'GERENTE' && solicitudSeleccionada?.estado === 'PENDIENTE' ? (
            <>
              <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => cambiarEstado(solicitudSeleccionada.id, 'RECHAZADA')} sx={{ fontWeight: 'bold' }}>Rechazar Pedido</Button>
              <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => cambiarEstado(solicitudSeleccionada.id, 'ATENDIDA')} sx={{ fontWeight: 'bold' }}>Aprobar (Atendido)</Button>
            </>
          ) : (
            <Button onClick={() => setOpenDetalles(false)} variant="outlined" sx={{ fontWeight: 'bold' }}>Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};