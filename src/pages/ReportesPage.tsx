import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, CircularProgress, MenuItem, TextField
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { api } from '../api/axiosConfig';

export const ReportesPage = () => {
  const [tipoReporte, setTipoReporte] = useState('ventas');
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarReporte = async (tipo: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes/${tipo}`);
      setDatos(res.data);
    } catch (error) {
      console.error("Error al cargar reporte", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarReporte(tipoReporte);
  }, [tipoReporte]);

  const exportarExcel = () => {
    if (datos.length === 0) return alert("No hay datos para exportar");
    
    // Creamos la hoja de cálculo con los datos en formato JSON
    const worksheet = XLSX.utils.json_to_sheet(datos);
    
    // Creamos el libro de trabajo y agregamos la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Gerencial");
    
    // Exportamos el archivo con extensión real .xlsx
    XLSX.writeFile(workbook, `reporte_${tipoReporte}.xlsx`);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Reportes Gerenciales</Typography>
          <Typography variant="body2" color="text.secondary">Análisis y exportación de datos operativos a formato Excel.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />} 
          onClick={exportarExcel} 
          disabled={datos.length === 0}
          sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, textTransform: 'none', borderRadius: 2 }}
        >
          Exportar a Excel
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ width: { xs: '100%', md: '350px' } }}>
          <TextField 
            select 
            fullWidth 
            size="small" 
            label="Seleccionar Tipo de Reporte" 
            value={tipoReporte} 
            onChange={(e) => setTipoReporte(e.target.value)}
          >
            <MenuItem value="ventas">Reporte de Ventas Generales</MenuItem>
            <MenuItem value="inventario">Reporte de Inventario Actual</MenuItem>
            <MenuItem value="diferencias">Reporte de Diferencias y Mermas</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {datos.length > 0 && Object.keys(datos[0]).map((key) => (
                  <TableCell key={key} sx={{ fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                    {key.replace('_', ' ')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : datos.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>No hay registros disponibles para este reporte.</TableCell></TableRow>
              ) : (
                datos.map((fila, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                    {Object.values(fila).map((val: any, vIdx) => (
                      <TableCell key={vIdx}>{val !== null ? val.toString() : '-'}</TableCell>
                    ))}
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