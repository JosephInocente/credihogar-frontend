import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, CircularProgress, TextField, IconButton, List, ListItem, ListItemText, Divider, Dialog, DialogContent, DialogActions, Chip, InputAdornment, MenuItem, DialogTitle, Alert
} from '@mui/material';
import { 
  LocalShipping, AddShoppingCart, Delete as DeleteIcon, Payment as PaymentIcon, Search as SearchIcon, CheckCircleOutlined, Print as PrintIcon, CloudOff, CloudSync, Wifi 
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const VentasTrabajadorPage = () => {
  const miUsuario = localStorage.getItem('username'); 

  // --- ESTADOS ORIGINALES ---
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [inventario, setInventario] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Estados Producto Modal
  const [openModalVenta, setOpenModalVenta] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadInput, setCantidadInput] = useState('1');
  const [precioFinalInput, setPrecioFinalInput] = useState('');

  // Estados Modal Checkout (Cliente)
  const [openCheckout, setOpenCheckout] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [buscandoExterna, setBuscandoExterna] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  // Estados Modal Ticket
  const [openTicket, setOpenTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  // --- NUEVOS ESTADOS PWA OFFLINE (HU-28) ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [ventasPendientes, setVentasPendientes] = useState<any[]>(() => {
    const guardadas = localStorage.getItem('credi_ventas_offline');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  // MONITOREO DE RED
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // AUTO-SINCRONIZAR CUANDO VUELVE LA SEÑAL
  useEffect(() => {
    if (isOnline && ventasPendientes.length > 0) {
      sincronizarPendientes();
    }
  }, [isOnline, ventasPendientes.length]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resViaje = await api.get(`/ventas-movil/mi-viaje/${miUsuario}`);
      if (resViaje.data.id) {
        setViajeActivo(resViaje.data);
        localStorage.setItem('credi_viaje_activo', JSON.stringify(resViaje.data)); // Caché
        
        const resInv = await api.get(`/ventas-movil/mi-inventario/${resViaje.data.vehiculo_id}`);
        setInventario(resInv.data);
        localStorage.setItem('credi_inventario', JSON.stringify(resInv.data)); // Caché
      } else {
        setViajeActivo(null); 
        localStorage.removeItem('credi_viaje_activo');
        localStorage.removeItem('credi_inventario');
      }
    } catch (e) {
      console.warn("Fallo de conexión al cargar datos. Usando caché offline...");
      // RECUPERACIÓN OFFLINE
      const viajeOffline = localStorage.getItem('credi_viaje_activo');
      const inventarioOffline = localStorage.getItem('credi_inventario');
      if (viajeOffline && inventarioOffline) {
        setViajeActivo(JSON.parse(viajeOffline));
        setInventario(JSON.parse(inventarioOffline));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- LÓGICA DE SINCRONIZACIÓN ---
  const guardarVentaOffline = (payload: any, ticketLocal: any) => {
    const nuevaPendiente = { payload, ticketLocal, id: Date.now() };
    const actualizadas = [...ventasPendientes, nuevaPendiente];
    
    setVentasPendientes(actualizadas);
    localStorage.setItem('credi_ventas_offline', JSON.stringify(actualizadas));
    
    // Descontamos visualmente del inventario caché para que no siga vendiendo lo que ya no hay
    const nuevoInventario = inventario.map(prod => {
      const itemVendido = carrito.find(c => c.presentacionId === prod.presentacion_id);
      return itemVendido ? { ...prod, cantidad: prod.cantidad - itemVendido.cantidad } : prod;
    });
    setInventario(nuevoInventario);
    localStorage.setItem('credi_inventario', JSON.stringify(nuevoInventario));

    setTicketData(ticketLocal);
    setCarrito([]);
    setBusqueda('');
    setNumeroDocumento('');
    setRazonSocial('');
    setOpenCheckout(false);
    setOpenTicket(true);
  };

  const sincronizarPendientes = async () => {
    if (syncing || ventasPendientes.length === 0) return;
    setSyncing(true);
    
    let pendientesRestantes = [...ventasPendientes];

    for (const ventaGuardada of ventasPendientes) {
      try {
        await api.post('/ventas-movil/registrar', ventaGuardada.payload);
        // Si tiene éxito, la sacamos de la lista
        pendientesRestantes = pendientesRestantes.filter(v => v.id !== ventaGuardada.id);
      } catch (error) {
        console.error("Fallo al sincronizar una venta:", error);
      }
    }

    setVentasPendientes(pendientesRestantes);
    if (pendientesRestantes.length === 0) {
      localStorage.removeItem('credi_ventas_offline');
      cargarDatos(); // Actualizamos el inventario real
    } else {
      localStorage.setItem('credi_ventas_offline', JSON.stringify(pendientesRestantes));
    }
    
    setSyncing(false);
  };

  // --- LÓGICA DE CARRITO Y MODALES (INTACTA) ---
  const abrirModalProducto = (prod: any) => {
    setProductoSeleccionado(prod);
    setCantidadInput('1');
    setPrecioFinalInput(prod.precio_base.toString()); 
    setOpenModalVenta(true);
  };

  const agregarAlCarrito = () => {
    const cant = parseInt(cantidadInput);
    const precioF = parseFloat(precioFinalInput);

    if (cant <= 0 || cant > productoSeleccionado.cantidad) return alert("Stock insuficiente en el camión.");
    if (precioF <= 0) return alert("El precio no puede ser cero.");

    const nuevoItem = {
      presentacionId: productoSeleccionado.presentacion_id,
      nombreInfo: `${productoSeleccionado.producto} - ${productoSeleccionado.presentacion}`,
      cantidad: cant,
      precioBase: productoSeleccionado.precio_base,
      precioFinal: precioF,
      subtotal: cant * precioF
    };

    setCarrito([...carrito, nuevoItem]);
    setOpenModalVenta(false);
  };

  const eliminarDelCarrito = (index: number) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  const buscarDocumento = async () => {
    if (!numeroDocumento || !isOnline) return;
    setBuscandoExterna(true);
    setErrorMensaje('');
    try {
      const response = await api.get(`/clientes/externo/${tipoDocumento}/${numeroDocumento}`);
      setRazonSocial(response.data.razonSocial || '');
    } catch (error) {
      setErrorMensaje('Documento no encontrado.');
      setRazonSocial('');
    } finally {
      setBuscandoExterna(false);
    }
  };

  // --- NUEVA LÓGICA DE REGISTRO (HÍBRIDA Y CORREGIDA) ---
  const registrarVenta = async () => {
    if (carrito.length === 0) return;
    const totalVenta = carrito.reduce((sum, item) => sum + item.subtotal, 0);

    const payload = {
      viajeId: viajeActivo.id,
      vehiculoId: viajeActivo.vehiculo_id,
      trabajadorId: viajeActivo.trabajador_id, 
      clienteDocumento: numeroDocumento || '00000000',     // <-- CORRECCIÓN APLICADA
      clienteNombre: razonSocial || 'Público en General', // <-- CORRECCIÓN APLICADA
      total: totalVenta,
      items: carrito.map(i => ({ presentacionId: i.presentacionId, cantidad: i.cantidad, precioBase: i.precioBase, precioFinal: i.precioFinal })),
      idempotencyKey: `venta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Clave para evitar duplicados al sincronizar
    };

    const ticketLocal = {
      ventaId: 'PENDIENTE',
      clienteDocumento: numeroDocumento || '00000000',
      clienteNombre: razonSocial || 'Público en General',
      fecha: new Date().toLocaleString('es-PE'),
      detalles: [...carrito],
      total: totalVenta
    };

    if (isOnline) {
      try {
        const res = await api.post('/ventas-movil/registrar', payload);
        ticketLocal.ventaId = res.data.ventaId;
        
        setTicketData(ticketLocal);
        setCarrito([]);
        setBusqueda('');
        setNumeroDocumento('');
        setRazonSocial('');
        setOpenCheckout(false);
        setOpenTicket(true); 
        cargarDatos(); 
      } catch (error) {
        console.warn("Error en servidor, guardando venta offline...");
        guardarVentaOffline(payload, ticketLocal);
      }
    } else {
      guardarVentaOffline(payload, ticketLocal);
    }
  };

  const imprimirTicket = () => {
    const contenido = document.getElementById('area-impresion-ticket')?.innerHTML;
    const ventanaImpresion = window.open('', '', 'width=400,height=600');
    if (ventanaImpresion && contenido) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Ticket Venta #${ticketData?.ventaId}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 10px; color: #000; font-size: 12px; }
              .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 2px 0; font-size: 12px; }
              .col-precio { text-align: right; } .header-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            </style>
          </head>
          <body>${contenido}</body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
      }, 250);
    }
  };

  if (loading && !viajeActivo) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  if (!viajeActivo) return (
    <Box sx={{ p: 3, maxWidth: 600, margin: 'auto', textAlign: 'center', mt: 5 }}>
      <LocalShipping sx={{ fontSize: 80, color: '#cbd5e1' }} />
      <Typography variant="h5" sx={{ mt: 2, color: '#475569', fontWeight: 'bold' }}>No tienes rutas activas</Typography>
      <Typography color="text.secondary">Espera a que el gerente te asigne un viaje y cargue tu camión.</Typography>
    </Box>
  );

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const inventarioFiltrado = inventario.filter(prod => 
    prod.producto.toLowerCase().includes(busqueda.toLowerCase()) || 
    prod.presentacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 500, margin: 'auto', pb: 15, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA CON ESTADO DE RED */}
      <Box sx={{ bgcolor: '#0a348a', color: 'white', p: 2, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, boxShadow: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Mi Ruta Actual</Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Camión {viajeActivo.placa}</Typography>
          <Typography variant="body2">Destino: {viajeActivo.destino}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          {ventasPendientes.length > 0 && (
            <Chip 
              icon={syncing ? <CloudSync fontSize="small" /> : <CloudOff fontSize="small" />} 
              label={syncing ? 'Enviando...' : `${ventasPendientes.length} Pendientes`} 
              size="small" 
              sx={{ fontWeight: 'bold', bgcolor: '#fef08a', color: '#854d0e', border: 'none' }}
            />
          )}
          <Chip 
            icon={isOnline ? <Wifi fontSize="small" /> : <CloudOff fontSize="small" />} 
            label={isOnline ? 'Conectado' : 'Sin Señal'} 
            size="small" 
            sx={{ fontWeight: 'bold', bgcolor: isOnline ? '#22c55e' : '#64748b', color: 'white', border: 'none' }} 
          />
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1e293b' }}>Inventario a Bordo</Typography>
        <TextField fullWidth size="small" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} sx={{ mb: 3, bgcolor: '#ffffff', borderRadius: 2 }} slotProps={{ input: { startAdornment: ( <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment> ) } }} />

        {inventarioFiltrado.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ mt: 3 }}>No se encontraron productos.</Typography>
        ) : (
          inventarioFiltrado.map((prod) => (
            <Paper key={prod.presentacion_id} sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: '6px solid #0ea5e9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', color: '#0f172a' }}>{prod.producto}</Typography>
                  <Typography variant="body2" color="text.secondary">{prod.presentacion}</Typography>
                  <Chip label={`Stock: ${prod.cantidad}`} size="small" color="primary" sx={{ mt: 1, fontWeight: 'bold' }} />
                </Box>
                <Button variant="contained" sx={{ bgcolor: '#0ea5e9', borderRadius: '50%', minWidth: 50, height: 50 }} onClick={() => abrirModalProducto(prod)}>
                  <AddShoppingCart />
                </Button>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {carrito.length > 0 && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: '0 -8px 20px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Cesta de Venta ({carrito.length})</Typography>
          <List dense disablePadding sx={{ maxHeight: '120px', overflowY: 'auto' }}>
            {carrito.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                <ListItemText primary={<Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{item.cantidad}x {item.nombreInfo}</Typography>} secondary={`S/ ${item.precioFinal.toFixed(2)} c/u`} />
                <Typography sx={{ fontWeight: 'bold', color: '#16a34a', mr: 2 }}>S/ {item.subtotal.toFixed(2)}</Typography>
                <IconButton size="small" color="error" onClick={() => eliminarDelCarrito(index)}><DeleteIcon /></IconButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Button fullWidth variant="contained" size="large" startIcon={<PaymentIcon />} onClick={() => setOpenCheckout(true)} sx={{ bgcolor: '#16a34a', borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem' }}>
            COBRAR S/ {totalCarrito.toFixed(2)}
          </Button>
        </Paper>
      )}

      <Dialog open={openModalVenta} onClose={() => setOpenModalVenta(false)} fullWidth maxWidth="xs" sx={{ '& .MuiDialog-paper': { borderRadius: 4, m: 2 } }}>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', textAlign: 'center', mb: 1 }}>{productoSeleccionado?.producto}</Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>{productoSeleccionado?.presentacion} (Disp: {productoSeleccionado?.cantidad})</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Cantidad" type="number" fullWidth value={cantidadInput} onChange={e => setCantidadInput(e.target.value)} />
            <TextField label="Precio Base" fullWidth value={`S/ ${productoSeleccionado?.precio_base}`} disabled sx={{ bgcolor: '#f1f5f9' }} />
            <TextField label="Precio Negociado (S/)" type="number" fullWidth value={precioFinalInput} onChange={e => setPrecioFinalInput(e.target.value)} color="success" focused />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setOpenModalVenta(false)}>Cancelar</Button>
          <Button variant="contained" onClick={agregarAlCarrito} sx={{ bgcolor: '#0ea5e9', px: 4 }}>Añadir</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCheckout} onClose={() => setOpenCheckout(false)} fullWidth maxWidth="xs" sx={{ '& .MuiDialog-paper': { borderRadius: 4, m: 2 } }}>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 2 }}>Datos del Cliente</Typography>
          
          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 2, py: 0 }}>
              Sin conexión. La búsqueda automática de DNI/RUC está deshabilitada.
            </Alert>
          )}
          {errorMensaje && <Alert severity="error" sx={{ mb: 2, py: 0 }}>{errorMensaje}</Alert>}
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField select size="small" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} sx={{ width: '35%' }}>
              <MenuItem value="DNI">DNI</MenuItem>
              <MenuItem value="RUC">RUC</MenuItem>
            </TextField>
            <TextField size="small" placeholder="Documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} fullWidth slotProps={{ input: { endAdornment: ( <IconButton onClick={buscarDocumento} disabled={buscandoExterna || !isOnline} size="small" color="primary">{buscandoExterna ? <CircularProgress size={20} /> : <SearchIcon fontSize="small" />}</IconButton> ) } }} />
          </Box>
          <TextField size="small" placeholder="Razón Social / Nombres" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} fullWidth sx={{ mb: 3 }} />
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: '900', color: '#d32f2f', textAlign: 'center' }}>Total: S/ {totalCarrito.toFixed(2)}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
          <Button fullWidth variant="contained" onClick={registrarVenta} sx={{ bgcolor: '#16a34a', py: 1.5, fontWeight: 'bold' }}>CONFIRMAR VENTA</Button>
          <Button fullWidth onClick={() => setOpenCheckout(false)}>Volver al carrito</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTicket} onClose={() => setOpenTicket(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: '#f8fafc', color: '#0f172a', fontWeight: 'bold' }}>
          <CheckCircleOutlined color="success" sx={{ fontSize: 40, mb: 1 }} /><br />
          {ticketData?.ventaId === 'PENDIENTE' ? 'Venta Guardada (Offline)' : 'Venta Exitosa'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f1f5f9', py: 3, display: 'flex', justifyContent: 'center' }}>
          <Paper id="area-impresion-ticket" elevation={3} sx={{ width: '100%', maxWidth: '300px', p: 2, fontFamily: 'monospace', bgcolor: '#fff' }}>
            <div className="center header-title">CREDI HOGAR</div>
            <div className="center">En Ruta - {viajeActivo?.placa}</div>
            <div className="divider"></div>
            <div><span className="bold">Ticket:</span> {ticketData?.ventaId === 'PENDIENTE' ? 'PENDIENTE (Offline)' : `V-${String(ticketData?.ventaId).padStart(6, '0')}`}</div>
            <div><span className="bold">Fecha:</span> {ticketData?.fecha}</div>
            <div><span className="bold">Cliente:</span> {ticketData?.clienteNombre}</div>
            <div><span className="bold">Doc:</span> {ticketData?.clienteDocumento}</div>
            <div className="divider"></div>
            <table style={{ width: '100%' }}>
              <thead>
                <tr><th align="left">CANT</th><th align="left">DESCRIPCIÓN</th><th align="right">IMPORTE</th></tr>
              </thead>
              <tbody>
                {ticketData?.detalles.map((item: any, i: number) => (
                  <tr key={i}><td>{item.cantidad}</td><td>{item.nombreInfo}</td><td align="right">{(item.subtotal).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="divider"></div>
            <div className="right bold" style={{ fontSize: '16px', marginTop: '10px', textAlign: 'right' }}>TOTAL: S/ {ticketData?.total.toFixed(2)}</div>
            <div className="divider"></div>
            <div className="center" style={{ marginTop: '15px', textAlign: 'center' }}>¡Gracias por su compra!</div>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setOpenTicket(false)}>Cerrar</Button>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={imprimirTicket}>Imprimir</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};