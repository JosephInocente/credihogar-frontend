import { useState } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Divider, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  IconButton, Avatar 
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Inventory, LocalShipping, 
  People, Receipt, Logout, Badge as BadgeIcon, PointOfSale,
  Assessment as AssessmentIcon // <-- NUEVO ÍCONO IMPORTADO
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LocalOffer } from '@mui/icons-material';
import logoCredi from '../assets/LOGO_CREDI.png';

const drawerWidth = 260;

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Punto de Venta', icon: <PointOfSale />, path: '/punto-venta' },
    { text: 'Catálogo', icon: <LocalOffer />, path: '/productos' }, 
    { text: 'Inventario', icon: <Inventory />, path: '/inventario' },
    { text: 'Vehículos y Viajes', icon: <LocalShipping />, path: '/viajes' },
    { text: 'Personal', icon: <BadgeIcon />, path: '/trabajadores' },
    { text: 'Clientes', icon: <People />, path: '/clientes' },
    { text: 'Facturación', icon: <Receipt />, path: '/facturacion' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' }, // <-- NUEVO ITEM EN EL MENÚ
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0a348a', color: '#ffffff' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
        <Box component="img" src={logoCredi} alt="Logo" sx={{ height: 45, borderRadius: '50%', border: '2px solid white' }} />
        <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 }}>
          CREDI HOGAR
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: isActive ? '#d32f2f' : 'transparent',
                  '&:hover': { bgcolor: isActive ? '#d32f2f' : 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: isActive ? 'bold' : 'normal', fontSize: '0.95rem' }}>{item.text}</Typography>} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ px: 2, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <ListItemIcon sx={{ color: '#ffcdd2', minWidth: 40 }}><Logout /></ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontWeight: 'bold', color: '#ffcdd2' }}>Cerrar Sesión</Typography>} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f7fe' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {menuItems.find(i => i.path === location.pathname)?.text || 'Sistema de Gestión'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, fontWeight: 'bold', color: '#64748b' }}>
              Gerente General
            </Typography>
            <Avatar sx={{ bgcolor: '#0a348a', width: 35, height: 35 }}>G</Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet /> 
      </Box>
    </Box>
  );
};