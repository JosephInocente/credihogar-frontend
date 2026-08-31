import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Divider, CircularProgress, MenuItem, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Search as SearchIcon, AddShoppingCart, Delete as DeleteIcon, PointOfSale, Print as PrintIcon, CheckCircleOutlined } from '@mui/icons-material';
import { api } from '../api/axiosConfig';

interface ProductoPOS {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
}

export const PuntoDeVentaPage = () => {
  const [productos, setProductos] = useState<ProductoPOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [buscandoExterna, setBuscandoExterna] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const [openConfirmarVenta, setOpenConfirmarVenta] = useState(false);
  const [openTicket, setOpenTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  useEffect(() => {
    const fetchProductosPOS = async () => {
      try {
        const response = await api.get('/pos/productos');
        setProductos(response.data);
      } catch (error) {
        console.error("Error al cargar el catálogo de ventas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductosPOS();
  }, []);

  const buscarDocumento = async () => {
    if (!numeroDocumento) return;
    setBuscandoExterna(true);
    setErrorMensaje('');
    
    try {
      const response = await api.get(`/clientes/externo/${tipoDocumento}/${numeroDocumento}`);
      setRazonSocial(response.data.razonSocial || '');
    } catch (error) {
      setErrorMensaje('Documento no encontrado o error en la API externa');
      setRazonSocial('');
    } finally {
      setBuscandoExterna(false);
    }
  };

  const agregarAlCarrito = (producto: ProductoPOS) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad < producto.stock) {
        setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      }
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const productosFiltrados = productos.filter(prod => 
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    prod.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  const manejarEnterEnBusqueda = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && busqueda.trim() !== '') {
      let coincidencia = productos.find(p => p.sku.toLowerCase() === busqueda.trim().toLowerCase());
      if (!coincidencia && productosFiltrados.length === 1) {
        coincidencia = productosFiltrados[0];
      }
      if (coincidencia) {
        agregarAlCarrito(coincidencia);
        setBusqueda(''); 
      }
    }
  };

  const total = carrito.reduce((sum, item) => {
    const precioSeguro = Number(item.precio) || 0;
    const cantidadSegura = Number(item.cantidad) || 0;
    return sum + (precioSeguro * cantidadSegura);
  }, 0);

  const intentarProcesarVenta = () => {
    if (numeroDocumento.trim() !== '' && razonSocial.trim() === '') {
      setErrorMensaje('Debe buscar el documento ingresado (lupa) o borrarlo para emitir una Boleta Simple.');
      return;
    }
    setErrorMensaje('');
    setOpenConfirmarVenta(true);
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    setOpenConfirmarVenta(false);

    const payload = {
      clienteDocumento: numeroDocumento,
      clienteNombre: razonSocial,
      totalVenta: total,
      detalles: carrito.map(item => ({
        inventarioId: item.id,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.cantidad * item.precio
      }))
    };

    try {
      const response = await api.post('/pos/procesar', payload);
      
      setTicketData({
        ventaId: response.data.ventaId,
        clienteDocumento: numeroDocumento || '00000000',
        clienteNombre: razonSocial || 'Público en General',
        fecha: new Date().toLocaleString('es-PE'),
        detalles: [...carrito],
        total: total
      });

      setCarrito([]);
      setNumeroDocumento('');
      setRazonSocial('');
      
      const resCat = await api.get('/pos/productos');
      setProductos(resCat.data);

      setOpenTicket(true);
      
    } catch (error) {
      console.error(error);
      alert("❌ Error al procesar la venta. Revisa la consola.");
    }
  };

  const imprimirTicket = () => {
    const contenido = document.getElementById('area-impresion-ticket')?.innerHTML;
    const ventanaImpresion = window.open('', '', 'width=400,height=600');
    if (ventanaImpresion && contenido) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Ticket Venta #${ticketData?.ventaId || '000'}</title>
            <style>
              body { 
                font-family: 'Courier New', Courier, monospace; 
                width: 80mm; 
                margin: 0; 
                padding: 10px; 
                color: #000; 
                font-size: 12px;
              }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 2px 0; font-size: 12px; }
              .col-precio { text-align: right; }
              .header-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            ${contenido}
          </body>
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

  // CORRECCIÓN PRINCIPAL: Solo ocultamos el ticket, NO vaciamos los datos
  const cerrarTicket = () => {
    setOpenTicket(false);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 3 }}>
        Punto de Venta (Tienda Principal)
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, flexGrow: 1, alignItems: 'stretch' }}>
        
        {/* PANEL IZQUIERDO */}
        <Box sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: { xs: 'auto', md: 'calc(100vh - 160px)' }, display: 'flex', flexDirection: 'column' }}>
            <TextField 
              fullWidth placeholder="Buscar producto por nombre o SKU (Presiona Enter para agregar)..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={manejarEnterEnBusqueda} 
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />, } }}
              sx={{ mb: 3 }}
            />

            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Precio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Stock</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : productosFiltrados.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>No se encontraron productos.</TableCell></TableRow>
                  ) : (
                    productosFiltrados.map((prod) => (
                      <TableRow key={prod.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{prod.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">SKU: {prod.sku}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>S/ {prod.precio.toFixed(2)}</TableCell>
                        <TableCell>{prod.stock}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" onClick={() => agregarAlCarrito(prod)}>
                            <AddShoppingCart />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* PANEL DERECHO */}
        <Box sx={{ height: '100%' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: { xs: 'auto', md: 'calc(100vh - 160px)' }, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#64748b', mb: 1 }}>DETALLE DE VENTA</Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, p: 1, mb: 2, minHeight: '100px' }}>
              {carrito.length === 0 ? (
                <Typography align="center" sx={{ color: '#94a3b8', mt: 3 }}>El carrito está vacío</Typography>
              ) : (
                carrito.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, borderBottom: '1px dashed #e2e8f0' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.cantidad} x S/ {Number(item.precio).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 2 }}>S/ {(item.cantidad * Number(item.precio)).toFixed(2)}</Typography>
                      <IconButton size="small" color="error" onClick={() => eliminarDelCarrito(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#64748b', mb: 1 }}>CLIENTE</Typography>
            {errorMensaje && <Alert severity="error" sx={{ mb: 1, py: 0, '& .MuiAlert-message': { py: 1 } }}>{errorMensaje}</Alert>}
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField 
                select size="small" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}
                sx={{ width: '35%', bgcolor: '#ffffff' }}
              >
                <MenuItem value="DNI">DNI</MenuItem>
                <MenuItem value="RUC">RUC</MenuItem>
              </TextField>
              
              <TextField 
                size="small" placeholder="Número de Documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)}
                fullWidth sx={{ bgcolor: '#ffffff' }} onKeyDown={(e) => { if (e.key === 'Enter') buscarDocumento(); }} 
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton onClick={buscarDocumento} disabled={buscandoExterna} size="small" color="primary">
                        {buscandoExterna ? <CircularProgress size={20} /> : <SearchIcon fontSize="small" />}
                      </IconButton>
                    )
                  }
                }}
              />
            </Box>
            <TextField 
              size="small" placeholder="Razón Social / Nombres" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)}
              fullWidth sx={{ mb: 3, bgcolor: '#ffffff' }} 
            />

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>TOTAL A PAGAR:</Typography>
              <Typography variant="h4" sx={{ fontWeight: '900', color: '#d32f2f' }}>S/ {total.toFixed(2)}</Typography>
            </Box>

            <Button 
              variant="contained" size="large" startIcon={<PointOfSale />} disabled={carrito.length === 0} onClick={intentarProcesarVenta} 
              sx={{ bgcolor: '#0a348a', py: 1.5, fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'none', flexShrink: 0 }}
            >
              Procesar Venta
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* MODAL DE CONFIRMACIÓN DE DATOS DEL CLIENTE */}
      <Dialog open={openConfirmarVenta} onClose={() => setOpenConfirmarVenta(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#0a348a', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          Confirmar Datos de Venta
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Por favor, verifica a nombre de quién saldrá el comprobante:
          </Typography>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">Documento:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1.5, color: '#0f172a' }}>
              {numeroDocumento || 'Sin Documento'}
            </Typography>

            <Typography variant="body2" color="text.secondary">Cliente / Razón Social:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
              {razonSocial || 'Público en General'}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenConfirmarVenta(false)} color="inherit" sx={{ fontWeight: 'bold', textTransform: 'none' }}>
            Atrás (Corregir)
          </Button>
          <Button variant="contained" onClick={procesarVenta} startIcon={<PointOfSale />} sx={{ bgcolor: '#16a34a', fontWeight: 'bold', textTransform: 'none' }}>
            Realizar Venta
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO / MODAL DEL TICKET DE VENTA (BLINDADO CONTRA ERRORES) */}
      <Dialog open={openTicket} onClose={cerrarTicket} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: '#f8fafc', color: '#0f172a', fontWeight: 'bold' }}>
          <CheckCircleOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
          <br />
          Venta Exitosa
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f1f5f9', py: 3, display: 'flex', justifyContent: 'center' }}>
          
          <Paper id="area-impresion-ticket" elevation={3} sx={{ width: '300px', p: 2, fontFamily: 'monospace', bgcolor: '#fff' }}>
            <div className="center header-title">CREDI HOGAR</div>
            <div className="center">Pichanaki, Perú</div>
            <div className="center">RUC: 20123456789</div>
            <div className="divider"></div>
            
            {/* El operador ?. y || previenen que el ticket truene si falta algún dato */}
            <div><span className="bold">Ticket:</span> V-{ticketData?.ventaId ? String(ticketData.ventaId).padStart(6, '0') : '------'}</div>
            <div><span className="bold">Fecha:</span> {ticketData?.fecha || '--'}</div>
            <div><span className="bold">Cliente:</span> {ticketData?.clienteNombre || '--'}</div>
            <div><span className="bold">Doc:</span> {ticketData?.clienteDocumento || '--'}</div>
            <div className="divider"></div>
            
            <table>
              <thead>
                <tr>
                  <th>CANT</th>
                  <th>DESCRIPCIÓN</th>
                  <th className="col-precio">IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                {ticketData?.detalles?.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.cantidad}</td>
                    <td>{item.nombre}</td>
                    <td className="col-precio">{(item.cantidad * Number(item.precio || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="divider"></div>
            <div className="right bold" style={{ fontSize: '16px', marginTop: '10px' }}>
              TOTAL: S/ {Number(ticketData?.total || 0).toFixed(2)}
            </div>
            <div className="divider"></div>
            <div className="center" style={{ marginTop: '15px' }}>
              ¡Gracias por su compra!
            </div>
          </Paper>

        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={cerrarTicket}>
            Nueva Venta
          </Button>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={imprimirTicket}>
            Imprimir Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};