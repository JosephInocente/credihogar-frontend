import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, Dialog, DialogContent, DialogActions, DialogTitle, TextField, IconButton, 
  InputAdornment, CircularProgress, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, Search as SearchIcon, Visibility as VisibilityIcon, 
  CheckCircle, Cancel, Delete as DeleteIcon, Remove as RemoveIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const SolicitudesPage = () => {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('GERENTE');
  const [userId, setUserId] = useState<number | null>(null);

  // Estados para Modal de Nueva Solicitud
  const [openNuevaSolicitud, setOpenNuevaSolicitud] = useState(false);
  const [productosAlmacen, setProductosAlmacen] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [notas, setNotas] = useState('');

  // Estados para Modal de Ver Detalles
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesSolicitud, setDetallesSolicitud] = useState<any[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);

  // NUEVOS ESTADOS: Para el modal de especificar el motivo de rechazo
  const [openRechazo, setOpenRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

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

      try {
        const resSol = await api.get(`/solicitudes?usuarioId=${currentId || ''}&rol=${rol}`);
        setSolicitudes(resSol.data);
      } catch (e) { console.error("Error cargando solicitudes", e); }

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
      alert("Error al enviar solicitud."); 
    }
  };

  const productosFiltrados = productosAlmacen.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- LÓGICA GERENTE: VER Y CAMBIAR ESTADO ---
  const verDetalles = async (sol: any) => {
    setSolicitudSeleccionada(sol);
    setOpenDetalles(true);
    setDetallesSolicitud([]);
    try {
      const res = await api.get(`/solicitudes/${sol.id}/detalles`);
      setDetallesSolicitud(res.data);
    } catch (e) { console.error(e); }
  };

  // Función actualizada para aceptar el motivo de rechazo
  const cambiarEstado = async (id: number, estado: string, motivo: string = '') => {
    try {
      await api.put(`/solicitudes/${id}/estado`, { estado, motivo });
      setOpenDetalles(false);
      setOpenRechazo(false); // Cierra modal de rechazo si estaba abierto
      setMotivoRechazo(''); // Limpia el campo
      recargarSolicitudes();
    } catch (e) { alert("Error al cambiar estado"); }
  };

  const abrirModalRechazo = () => {
    setMotivoRechazo(''); // Empezar con el campo limpio
    setOpenRechazo(true);
  };

  const generarPDFDirecto = async (sol: any) => {
    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert("Por favor, permite las ventanas emergentes (pop-ups) en tu navegador.");
      return;
    }
    ventana.document.write('<div style="font-family: sans-serif; padding: 20px;">Generando documento PDF...</div>');

    try {
      const res = await api.get(`/solicitudes/${sol.id}/detalles`);
      const detallesPDF = res.data;
      const fechaSolicitud = sol.fecha_hora ? new Date(sol.fecha_hora).toLocaleString('es-PE') : '--/--/----';

      const htmlContent = `
        <div class="header">
          <h1>CREDI HOGAR PLUS</h1>
          <h2>Orden de Despacho y Reabastecimiento</h2>
        </div>
        
        <div class="info-box">
          <p><strong>N° de Requerimiento:</strong> REQ-${sol.id}</p>
          <p><strong>Gestor Solicitante:</strong> ${sol.gestor?.toUpperCase()}</p>
          <p><strong>Fecha de Emisión:</strong> ${fechaSolicitud}</p>
          <p><strong>Estado Actual:</strong> ${sol.estado}</p>
          <p><strong>Notas del Gestor:</strong> ${sol.notas || 'Sin anotaciones adicionales.'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 10%;">N°</th>
              <th style="width: 50%;">Producto</th>
              <th style="width: 20%;">Presentación</th>
              <th style="width: 20%; text-align: center;">Cant. Solicitada</th>
            </tr>
          </thead>
          <tbody>
            ${detallesPDF.map((item: any, index: number) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.producto}</td>
                <td>${item.presentacion}</td>
                <td style="text-align: center; font-weight: bold; font-size: 16px;">${item.cantidad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Documento de uso interno - Generado el ${new Date().toLocaleString('es-PE')}</p>
          <div class="firmas">
            <div>________________________________<br><strong>Firma del Gestor</strong><br>Recibí conforme</div>
            <div>________________________________<br><strong>Firma de Almacén</strong><br>Despachado por</div>
          </div>
        </div>
      `;

      ventana.document.body.innerHTML = htmlContent;

      const style = ventana.document.createElement('style');
      style.textContent = `
        body { font-family: 'Arial', sans-serif; padding: 25px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #0a348a; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { margin: 0; color: #0a348a; font-size: 26px; }
        .header h2 { margin: 5px 0 0 0; color: #475569; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
        .info-box { border: 1px solid #cbd5e1; padding: 15px 20px; margin-bottom: 25px; border-radius: 8px; background: #f8fafc; }
        .info-box p { margin: 8px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 12px; }
        th { background-color: #0a348a; color: white; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #64748b; }
        .firmas { display: flex; justify-content: space-around; margin-top: 60px; font-size: 14px; color: #333; }
      `;
      ventana.document.head.appendChild(style);
      ventana.document.title = `Solicitud_Stock_REQ_${sol.id}`;

      setTimeout(() => { ventana.print(); ventana.close(); }, 250);

    } catch (error) {
      ventana.close();
      alert("Error al cargar los detalles para el PDF");
    }
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
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>Acciones</TableCell>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Ver Detalles y Atender">
                        <IconButton onClick={() => verDetalles(row)} sx={{ bgcolor: '#f1f5f9', color: '#64748b', borderRadius: 1, p: 1, '&:hover': { bgcolor: '#e2e8f0' } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {userRole === 'GERENTE' && (
                        <Tooltip title="Generar PDF (Orden de Despacho)">
                          <IconButton onClick={() => generarPDFDirecto(row)} sx={{ bgcolor: '#e0f2fe', color: '#0284c7', borderRadius: 1, p: 1, '&:hover': { bgcolor: '#bae6fd' } }}>
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
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
          
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TextField fullWidth placeholder="Buscar producto en almacén principal..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ mb: 2, mt: 1, bgcolor: 'white' }} slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) } }} />
            <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
              <Table size="small" stickyHeader>
                <TableHead><TableRow><TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell><TableCell align="center" sx={{ fontWeight: 'bold' }}>Stock Almacén</TableCell><TableCell align="center" sx={{ fontWeight: 'bold' }}>Agregar</TableCell></TableRow></TableHead>
                <TableBody>
                  {productosFiltrados.map((p) => (
                    <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre}</Typography><Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography></TableCell>
                      <TableCell align="center">{p.stock}</TableCell>
                      <TableCell align="center"><IconButton color="primary" size="small" onClick={() => agregarAlCarrito(p)}><AddIcon /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

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
            <TextField fullWidth label="Notas para el Gerente (Opcional)" multiline rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} sx={{ bgcolor: 'white' }} />
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

          {/* NUEVO: Mostrar cuadro de rechazo si aplica */}
          {solicitudSeleccionada?.estado === 'RECHAZADA' && solicitudSeleccionada?.motivo_rechazo && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 'bold', mb: 0.5 }}>Motivo del Rechazo de Gerencia:</Typography>
              <Typography variant="body2" sx={{ color: '#dc2626' }}>{solicitudSeleccionada.motivo_rechazo}</Typography>
            </Box>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell sx={{ fontWeight: 'bold' }}>Producto / Presentación</TableCell><TableCell align="center" sx={{ fontWeight: 'bold' }}>Cant. Pedida</TableCell></TableRow></TableHead>
              <TableBody>
                {detallesSolicitud.length === 0 ? (
                  <TableRow><TableCell colSpan={2} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : (
                  detallesSolicitud.map((item, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>{item.producto}</Typography><Typography variant="caption" sx={{ color: '#64748b' }}>{item.presentacion}</Typography></TableCell>
                      <TableCell align="center"><Chip label={item.cantidad} color="primary" sx={{ fontWeight: 'bold', borderRadius: 1 }} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: userRole === 'GERENTE' && solicitudSeleccionada?.estado === 'PENDIENTE' ? 'space-between' : 'center', bgcolor: '#f8fafc' }}>
          {userRole === 'GERENTE' && solicitudSeleccionada?.estado === 'PENDIENTE' ? (
            <>
              {/* AL HACER CLIC EN RECHAZAR, ABRIMOS EL MODAL PARA ESCRIBIR EL MOTIVO */}
              <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={abrirModalRechazo} sx={{ fontWeight: 'bold', textTransform: 'none' }}>Rechazar Pedido</Button>
              <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => cambiarEstado(solicitudSeleccionada.id, 'ATENDIDA')} sx={{ fontWeight: 'bold', textTransform: 'none' }}>Aprobar (Atender)</Button>
            </>
          ) : (
            <Button onClick={() => setOpenDetalles(false)} variant="outlined" sx={{ fontWeight: 'bold', textTransform: 'none' }}>Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* NUEVO MODAL: ESPECIFICAR MOTIVO DE RECHAZO (SOLO GERENTE) */}
      <Dialog open={openRechazo} onClose={() => setOpenRechazo(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 'bold', textAlign: 'center' }}>
          Especificar Motivo de Rechazo
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El gestor verá este mensaje para entender por qué su pedido no fue aprobado.
          </Typography>
          <TextField 
            fullWidth 
            multiline 
            rows={3} 
            placeholder="Ej. No hay stock suficiente, pedido duplicado, coordinar carga mañana..." 
            value={motivoRechazo} 
            onChange={(e) => setMotivoRechazo(e.target.value)} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenRechazo(false)} color="inherit" sx={{ fontWeight: 'bold', textTransform: 'none' }}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="error" 
            disabled={!motivoRechazo.trim()} 
            onClick={() => cambiarEstado(solicitudSeleccionada.id, 'RECHAZADA', motivoRechazo)}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};