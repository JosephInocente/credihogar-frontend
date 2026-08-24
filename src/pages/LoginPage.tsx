import React, { useState } from 'react';
import { 
  Button, TextField, Box, Typography, Container, Alert, Paper, CssBaseline, CircularProgress 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { api } from '../api/axiosConfig';

import logoCredi from '../assets/LOGO_CREDI.png';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0a348a' },
    background: { default: '#f4f6f9' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // ¡CLAVE! Guardamos el usuario escrito (Ej: @joseph) para buscar su camión
      localStorage.setItem('username', username);
      
      // DECODIFICAR EL TOKEN JWT PARA VER QUIÉN ES Y QUÉ ROL TIENE
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      const userRole = payload.rol || payload.role || payload.authorities || 'GERENTE';
      const userId = payload.id || payload.usuarioId || 2; 

      localStorage.setItem('usuarioId', userId.toString());

      // REDIRECCIÓN DURA (F5 AUTOMÁTICO) PARA EVITAR PANTALLA BLANCA
      if (userRole === 'TRABAJADOR' || userRole === 'ROLE_TRABAJADOR' || (Array.isArray(userRole) && userRole.includes('TRABAJADOR'))) {
        window.location.href = '/ventas-trabajador';
      } else {
        window.location.href = '/dashboard';
      }
      
    } catch (err) {
      setError('Credenciales incorrectas o servidor desconectado');
      setIsLoading(false); // Apagamos el spinner solo si hay error. Si hay éxito, sigue girando hasta que cambie la página.
    } 
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Container component="main" maxWidth="xs">
          <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
            <Box component="img" src={logoCredi} alt="Logo Credi Hogar Plus" sx={{ width: 180, mb: 3, borderRadius: '50%' }} />

            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>Bienvenido</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sistema de Gestión Logística y Ventas</Typography>
            
            {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              <TextField margin="normal" required fullWidth label="Usuario" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} variant="outlined" disabled={isLoading} />
              <TextField margin="normal" required fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} variant="outlined" disabled={isLoading} />
              
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                size="large" 
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold', textTransform: 'none', fontSize: '1.1rem' }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar al Sistema'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};