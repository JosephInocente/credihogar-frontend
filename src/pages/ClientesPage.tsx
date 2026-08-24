import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, 
  IconButton, Dialog, DialogContent, DialogActions, 
  Button, DialogTitle, Tooltip
} from '@mui/material';
import { ReceiptLong as ReceiptIcon, Print as PrintIcon } from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const ClientesPage = () => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal del Ticket
  const [openTicket, setOpenTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [detallesTicket, setDetallesTicket] = useState<any[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Cargar lista de historial
  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await api.get('/historial-ventas');
      setHistorial(response.data);
    } catch (error) {
      console.error("Error al cargar historial de ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const verTicket = async (venta: any) => {
    setTicketData(venta);
    setOpenTicket(true);
    setLoadingTicket(true);
    try {
      const response = await api.get(`/historial-ventas/${venta.venta_id}/ticket`);
      setDetallesTicket(response.data);
    } catch (error) {
      console.error("Error al cargar detalles del ticket:", error);
    }
    setLoadingTicket(false);
  };

  const imprimirTicket = () => {
    const contenido = document.getElementById('area-impresion-ticket-gerente')?.innerHTML;
    const ventanaImpresion = window.open('', '', 'width=400,height=600');
    if (ventanaImpresion && contenido) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Copia de Ticket #${ticketData?.venta_id}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 10px; color: #000; font-size: 12px; }
              .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 2px 0; font-size: 12px; }
              .header-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            Historial de Clientes y Ventas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Registro detallado de ventas en ruta, clientes atendidos y copias de tickets.
          </Typography>
        </Box>
      </Box>

      {/* TABLA DE HISTORIAL - CON EL ESTILO ORIGINAL */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Doc.</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Número</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Razón Social / Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Dirección (Ruta)</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Fecha y Hora</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>Total</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>Ticket</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
            ) : historial.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>No hay ventas registradas aún.</TableCell></TableRow>
            ) : (
              historial.map((row) => (
                <TableRow key={row.venta_id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <TableCell>{row.tipo_documento}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>{row.numero_documento}</TableCell>
                  <TableCell>{row.cliente_nombre}</TableCell>
                  <TableCell>{row.direccion_viaje}</TableCell>
                  <TableCell>{row.fecha_hora}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
                    S/ {row.total.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Ticket">
                      <IconButton color="primary" onClick={() => verTicket(row)}>
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL: VER TICKET DEL GERENTE */}
      <Dialog open={openTicket} onClose={() => setOpenTicket(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: '#f8fafc', color: '#0f172a', fontWeight: 'bold', pb: 1 }}>
          Copia de Ticket
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f1f5f9', py: 3, display: 'flex', justifyContent: 'center' }}>
          {loadingTicket ? (
            <CircularProgress />
          ) : (
            <Paper id="area-impresion-ticket-gerente" elevation={3} sx={{ width: '100%', maxWidth: '300px', p: 2, fontFamily: 'monospace', bgcolor: '#fff' }}>
              <div className="center" style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>CREDI HOGAR</div>
              <div className="center" style={{ textAlign: 'center' }}>Copia Administrativa</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
              <div><span style={{ fontWeight: 'bold' }}>Ticket:</span> V-{String(ticketData?.venta_id).padStart(6, '0')}</div>
              <div><span style={{ fontWeight: 'bold' }}>Fecha:</span> {ticketData?.fecha_hora}</div>
              <div><span style={{ fontWeight: 'bold' }}>Cliente:</span> {ticketData?.cliente_nombre}</div>
              <div><span style={{ fontWeight: 'bold' }}>Doc:</span> {ticketData?.numero_documento}</div>
              <div><span style={{ fontWeight: 'bold' }}>Ruta:</span> {ticketData?.direccion_viaje}</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '2px 0', fontSize: '12px' }}>CANT</th>
                    <th style={{ textAlign: 'left', padding: '2px 0', fontSize: '12px' }}>DESCRIPCIÓN</th>
                    <th style={{ textAlign: 'right', padding: '2px 0', fontSize: '12px' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesTicket.map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'left', padding: '2px 0', fontSize: '12px' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'left', padding: '2px 0', fontSize: '12px' }}>{item.producto} - {item.presentacion}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0', fontSize: '12px' }}>{(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
              <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                TOTAL: S/ {ticketData?.total.toFixed(2)}
              </div>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setOpenTicket(false)} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
            Cerrar
          </Button>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={imprimirTicket} disabled={loadingTicket} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
            Imprimir Copia
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};