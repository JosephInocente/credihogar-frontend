import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, CircularProgress, Chip, IconButton, Tooltip
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon, 
  Code as XmlIcon, 
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const FacturacionPage = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/facturacion/ventas');
      setVentas(res.data);
    } catch (error) {
      console.error("Error al cargar ventas para facturación:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const emitirComprobante = async (ventaId: number, tipoDocumentoCliente: string) => {
    setProcesandoId(ventaId);
    try {
      const tipoComprobante = tipoDocumentoCliente === 'RUC' ? 'FACTURA' : 'BOLETA';
      
      await api.post(`/facturacion/emitir/${ventaId}`, { tipo: tipoComprobante });
      alert(`✅ ${tipoComprobante} emitida exitosamente a SUNAT.`);
      cargarVentas();
    } catch (error: any) {
      alert("❌ Error al emitir: " + (error.response?.data?.error || "Fallo de conexión."));
    }
    setProcesandoId(null);
  };

  const descargarArchivo = (ventaId: number, formato: 'PDF' | 'XML') => {
    alert(`Simulando descarga del comprobante en formato ${formato} para la venta #${ventaId}`);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Control de Facturación Electrónica</Typography>
          <Typography variant="body2" color="text.secondary">Emisión de Boletas y Facturas a SUNAT y descarga de comprobantes.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={cargarVentas} sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: 2 }}>
          Actualizar Lista
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Ticket / Viaje</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Total (S/)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>Estado SUNAT</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : ventas.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No hay ventas pendientes de facturación.</TableCell></TableRow>
              ) : (
                ventas.map((venta) => (
                  <TableRow key={venta.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0a348a' }}>V-{String(venta.id).padStart(6, '0')}</Typography>
                      <Typography variant="caption" color="text.secondary">Viaje: TRIP-{venta.viaje_id || 'Tienda'}</Typography>
                    </TableCell>
                    <TableCell>{new Date(venta.fecha).toLocaleDateString('es-PE')} <br/><Typography variant="caption">{new Date(venta.fecha).toLocaleTimeString('es-PE')}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{venta.cliente_nombre || 'Cliente General'}</Typography>
                      <Typography variant="caption" color="text.secondary">{venta.tipo_documento_cliente || 'DNI'}: {venta.cliente_documento || '00000000'}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#16a34a' }}>{venta.total.toFixed(2)}</TableCell>
                    
                    <TableCell align="center">
                      <Chip 
                        label={venta.estado_facturacion || 'PENDIENTE'} 
                        color={venta.estado_facturacion === 'EMITIDO' ? 'success' : venta.estado_facturacion === 'ERROR' ? 'error' : 'warning'} 
                        size="small" 
                        sx={{ fontWeight: 'bold', borderRadius: 1 }} 
                      />
                      {venta.comprobante_numero && (
                      <Box sx={{ mt: 0.5, fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {venta.comprobante_numero}
                      </Box>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {venta.estado_facturacion !== 'EMITIDO' ? (
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="primary"
                          startIcon={procesandoId === venta.id ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
                          onClick={() => emitirComprobante(venta.id, venta.tipo_documento_cliente)}
                          disabled={procesandoId === venta.id}
                          sx={{ bgcolor: '#0ea5e9', textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}
                        >
                          {venta.tipo_documento_cliente === 'RUC' ? 'Emitir Factura' : 'Emitir Boleta'}
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Descargar PDF">
                            <IconButton color="error" size="small" onClick={() => descargarArchivo(venta.id, 'PDF')} sx={{ bgcolor: '#fef2f2' }}>
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar XML">
                            <IconButton color="primary" size="small" onClick={() => descargarArchivo(venta.id, 'XML')} sx={{ bgcolor: '#eff6ff' }}>
                              <XmlIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};