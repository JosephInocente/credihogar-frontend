import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, CircularProgress, Chip, Dialog, DialogContent, DialogActions, TextField, 
  IconButton, Tooltip, MenuItem, InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Badge as BadgeIcon, Close as CloseIcon, Search as SearchIcon 
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const TrabajadoresPage = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscandoDni, setBuscandoDni] = useState(false);
  
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    dni: '', nombre: '', apellidos: '', username: '', email: '', telefono: '', rol: 'TRABAJADOR', estado: 'ACTIVO'
  });

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      // CORRECCIÓN 2: Filtramos para que SOLO se muestren los que tienen rol TRABAJADOR
      const soloTrabajadores = response.data.filter((u: any) => u.rol === 'TRABAJADOR');
      setUsuarios(soloTrabajadores);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const buscarReniec = async () => {
    if (form.dni.trim().length !== 8) {
      alert("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    setBuscandoDni(true);
    try {
      const response = await api.get(`/usuarios/dni/${form.dni}`);
      const nombreCompleto = response.data.nombreCompleto; // Ej: "HURTADO INOCENTE JOSEPH JUSTO"

      if (nombreCompleto) {
        const partes = nombreCompleto.split(' ').filter((p: string) => p.length > 0);
        let apellidosCalc = '';
        let nombresCalc = nombreCompleto;

        // CORRECCIÓN 1: En Perú, RENIEC devuelve casi siempre: [APELLIDO_PAT] [APELLIDO_MAT] [NOMBRES...]
        if (partes.length >= 3) {
          apellidosCalc = `${partes[0]} ${partes[1]}`; // Los dos primeros son apellidos
          nombresCalc = partes.slice(2).join(' '); // El resto son los nombres
        } else if (partes.length === 2) {
          apellidosCalc = partes[0];
          nombresCalc = partes[1];
        }

        setForm({
          ...form,
          nombre: nombresCalc,
          apellidos: apellidosCalc
        });
      }
    } catch (error: any) {
      console.error("Error consultando RENIEC", error);
      alert(error.response?.data?.error || "Hubo un problema al consultar el DNI.");
    } finally {
      setBuscandoDni(false);
    }
  };

  const abrirModalNuevo = () => {
    setIsEditing(false); setUsuarioSeleccionado(null);
    setForm({ dni: '', nombre: '', apellidos: '', username: '', email: '', telefono: '', rol: 'TRABAJADOR', estado: 'ACTIVO' });
    setOpenModal(true);
  };

  const abrirModalEditar = (u: any) => {
    setIsEditing(true); setUsuarioSeleccionado(u.id);
    setForm({ 
      dni: u.dni || '', nombre: u.nombre || '', apellidos: u.apellidos || '', 
      username: u.username || '', email: u.email || '', telefono: u.telefono || '', 
      rol: u.rol || 'TRABAJADOR', estado: u.estado || 'ACTIVO' 
    });
    setOpenModal(true);
  };

  const guardarUsuario = async () => {
    if (!form.dni || !form.nombre || !form.username) {
      alert("DNI, Nombre y Usuario son obligatorios"); return;
    }
    try {
      if (isEditing && usuarioSeleccionado) {
        await api.put(`/usuarios/${usuarioSeleccionado}`, form);
        alert("✅ Trabajador actualizado exitosamente.");
      } else {
        await api.post('/usuarios', form);
        alert("✅ Trabajador registrado. La contraseña temporal es su número de DNI.");
      }
      setOpenModal(false);
      cargarUsuarios();
    } catch (error: any) {
      alert("❌ Error: " + (error.response?.data?.error || error.response?.data || "Error al procesar"));
    }
  };

  const eliminarUsuario = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar a este trabajador?")) {
      try {
        await api.delete(`/usuarios/${id}`);
        alert("✅ Usuario eliminado");
        cargarUsuarios();
      } catch (error) {
        alert("❌ No se puede eliminar porque tiene viajes o registros asociados.");
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Gestión del Personal
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModalNuevo} sx={{ bgcolor: '#0a348a', textTransform: 'none', borderRadius: 2 }}>
          Nuevo Trabajador
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 3 }}>
        {loading ? <CircularProgress /> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>DNI</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No hay personal registrado</TableCell></TableRow>
                ) : (
                  usuarios.map((u) => (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{u.dni}</TableCell>
                      <TableCell>{u.nombre} {u.apellidos}</TableCell>
                      <TableCell>@{u.username}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{u.telefono || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.email || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.rol} color={u.rol === 'GERENTE' ? 'secondary' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={u.estado} color={u.estado === 'ACTIVO' ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar Datos">
                          <IconButton color="primary" size="small" onClick={() => abrirModalEditar(u)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Personal">
                          <IconButton color="error" size="small" onClick={() => eliminarUsuario(u.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, bgcolor: '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', p: 1, bgcolor: '#bae6fd', borderRadius: 2 }}><BadgeIcon sx={{ color: '#0369a1' }} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0c4a6e' }}>
              {isEditing ? 'Editar Personal' : 'Registrar Personal'}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField 
                label="DNI" 
                fullWidth 
                value={form.dni} 
                onChange={e => setForm({...form, dni: e.target.value})} 
                onKeyDown={(e) => e.key === 'Enter' && buscarReniec()} 
                slotProps={{ 
                  input: { 
                    sx: { bgcolor: '#f8fafc', borderRadius: 2 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={buscarReniec} disabled={buscandoDni} color="primary">
                          {buscandoDni ? <CircularProgress size={24} /> : <SearchIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  } 
                }} 
              />
              <TextField label="Usuario de Ingreso" fullWidth value={form.username} onChange={e => setForm({...form, username: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Nombres" fullWidth value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }} />
              <TextField label="Apellidos" fullWidth value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Teléfono" fullWidth value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }} />
              <TextField label="Email (Opcional)" fullWidth value={form.email} onChange={e => setForm({...form, email: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }} />
            </Box>

            {/* Ocultamos el campo "Rol" porque ya forzamos a que todos los creados por aquí sean TRABAJADOR */}
            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Estado" fullWidth value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} slotProps={{ input: { sx: { bgcolor: '#f8fafc', borderRadius: 2 } } }}>
                  <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                  <MenuItem value="INACTIVO">INACTIVO (Suspendido)</MenuItem>
                </TextField>
              </Box>
            )}

            {!isEditing && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                * La contraseña inicial por defecto será el mismo número de DNI del trabajador. El rol "Trabajador" se asignará automáticamente.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancelar</Button>
          <Button variant="contained" onClick={guardarUsuario} sx={{ bgcolor: '#0ea5e9', borderRadius: 2, px: 4, fontWeight: 'bold' }}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};