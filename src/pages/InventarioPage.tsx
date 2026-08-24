import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, CircularProgress, Chip, Dialog, DialogContent, DialogActions, TextField, IconButton, MenuItem, DialogTitle, Alert
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Close as CloseIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const InventarioPage = () => {
  const [inventario, setInventario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA EL MODAL DE REGISTRAR ENTRADA ---
  const [openEntrada, setOpenEntrada] = useState(false);
  const [presentaciones, setPresentaciones] = useState<any[]>([]);
  const [formEntrada, setFormEntrada] = useState({
    presentacionId: '',
    cantidad: '',
    motivo: 'Compra a proveedor',
    documentoReferencia: ''
  });

  const cargarInventario = async () => {
    setLoading(true);
    try {
      // 1. Ruta actualizada a la vista del backend
      const res = await api.get('/inventario/vista');
      setInventario(res.data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
    setLoading(false);
  };

  const cargarPresentaciones = async () => {
    try {
      // 2. Ruta actualizada para las presentaciones activas
      const res = await api.get('/inventario/vista/presentaciones');
      setPresentaciones(res.data);
    } catch (error) {
      console.error("Error al cargar presentaciones:", error);
    }
  };

  useEffect(() => {
    cargarInventario();
    cargarPresentaciones();
  }, []);

  const abrirModalEntrada = () => {
    setFormEntrada({ presentacionId: '', cantidad: '', motivo: 'Compra a proveedor', documentoReferencia: '' });
    setOpenEntrada(true);
  };

  const registrarEntrada = async () => {
    if (!formEntrada.presentacionId || !formEntrada.cantidad) {
      return alert("El producto y la cantidad son obligatorios.");
    }
    if (parseInt(formEntrada.cantidad) <= 0) {
      return alert("La cantidad debe ser mayor a cero.");
    }

    try {
      // 3. Ruta actualizada al POST de entradas respetando tu arquitectura
      await api.post('/inventario/entradas', {
        ubicacionDestinoId: 1, // Siempre al Almacén Principal por defecto
        presentacionId: parseInt(formEntrada.presentacionId),
        cantidad: parseInt(formEntrada.cantidad),
        motivo: formEntrada.motivo,
        documentoReferencia: formEntrada.documentoReferencia
      });
      alert("✅ Entrada de inventario registrada con éxito");
      setOpenEntrada(false);
      cargarInventario(); // Se refresca la tabla automáticamente
    } catch (error) {
      alert("❌ Error al registrar la entrada");
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Gestión de Inventario</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={cargarInventario} sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: 2 }}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModalEntrada} sx={{ bgcolor: '#0a348a', textTransform: 'none', borderRadius: 2 }}>
            Registrar Entrada
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Presentación</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Ubicación</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Stock</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : inventario.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No hay registros de inventario.</TableCell></TableRow>
              ) : (
                inventario.map((row, index) => (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>{row.sku}</TableCell>
                    <TableCell>{row.producto}</TableCell>
                    <TableCell>{row.presentacion}</TableCell>
                    <TableCell>{row.ubicacion}</TableCell>
                    {/* SOLUCIÓN: Cambiamos row.stock por row.cantidad */}
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{row.cantidad}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.estado} 
                        color={row.estado === 'ÓPTIMO' ? 'success' : row.estado === 'BAJO STOCK' ? 'warning' : 'error'} 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                        variant={row.estado === 'ÓPTIMO' ? "filled" : "outlined"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODAL REGISTRAR ENTRADA */}
      <Dialog open={openEntrada} onClose={() => setOpenEntrada(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#0a348a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InventoryIcon />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Registrar Entrada al Almacén</Typography>
          </Box>
          <IconButton onClick={() => setOpenEntrada(false)} sx={{ color: 'white' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Este registro sumará stock automáticamente al <strong>Almacén Principal</strong>.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField select label="Seleccionar Producto / Presentación" fullWidth value={formEntrada.presentacionId} onChange={(e) => setFormEntrada({...formEntrada, presentacionId: e.target.value})}>
              {presentaciones.length === 0 ? <MenuItem disabled value="">No hay productos activos</MenuItem> : 
                presentaciones.map((p) => (
                  <MenuItem key={p.id} value={p.id.toString()}>
                    [{p.sku}] {p.producto} - {p.presentacion}
                  </MenuItem>
                ))
              }
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Cantidad a ingresar" type="number" fullWidth value={formEntrada.cantidad} onChange={(e) => setFormEntrada({...formEntrada, cantidad: e.target.value})} />
              <TextField select label="Motivo" fullWidth value={formEntrada.motivo} onChange={(e) => setFormEntrada({...formEntrada, motivo: e.target.value})}>
                <MenuItem value="Compra a proveedor">Compra a proveedor</MenuItem>
                <MenuItem value="Ajuste de inventario positivo">Ajuste de inventario positivo</MenuItem>
                <MenuItem value="Devolución de cliente">Devolución de cliente</MenuItem>
                <MenuItem value="Saldo inicial">Saldo inicial</MenuItem>
              </TextField>
            </Box>

            <TextField label="Documento de Referencia (Opcional)" placeholder="Ej. Factura F001-000452" fullWidth value={formEntrada.documentoReferencia} onChange={(e) => setFormEntrada({...formEntrada, documentoReferencia: e.target.value})} helperText="Número de factura o guía de remisión del proveedor" />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0, bgcolor: '#ffffff' }}>
          <Button onClick={() => setOpenEntrada(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
          <Button variant="contained" onClick={registrarEntrada} sx={{ bgcolor: '#16a34a', fontWeight: 'bold', '&:hover': { bgcolor: '#15803d' } }}>
            Confirmar Entrada
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};