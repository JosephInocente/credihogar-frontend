import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, CircularProgress, Dialog, DialogContent, DialogActions, 
  TextField, IconButton, DialogTitle, Card, CardContent, CardActions, Chip, Divider, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, Close as CloseIcon, CloudUpload as UploadIcon, Layers as LayersIcon, 
  LocalOffer as PriceIcon, Edit as EditIcon, Delete as DeleteIcon 
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

export const ProductosPage = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Producto
  const [openProducto, setOpenProducto] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);
  const [formProducto, setFormProducto] = useState({
    sku: '', nombre: '', marca: '', categoria: '', imagenUrl: ''
  });

  // Estados para Modal de Presentación
  const [openPresentacion, setOpenPresentacion] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [formPresentacion, setFormPresentacion] = useState({
    nombre: '', unidad_base: 'Unidad', factor_conversion: 1, precio_compra_referencial: '', precio_venta: '', codigo_barras: ''
  });

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // --- LÓGICA DE CLOUDINARY ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'sistema_abarrotes'); // TU PRESET
    const cloudName = 'dxnorupkm'; // TU CLOUD NAME

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if(data.secure_url) {
        setFormProducto({ ...formProducto, imagenUrl: data.secure_url });
      }
    } catch (error) {
      alert("Error al subir la imagen a Cloudinary");
    } finally {
      setUploadingImage(false);
    }
  };

  // --- LÓGICA DE GUARDAR / EDITAR / ELIMINAR PRODUCTO ---
  const abrirModalNuevoProducto = () => {
    setEditandoProductoId(null);
    setFormProducto({ sku: '', nombre: '', marca: '', categoria: '', imagenUrl: '' });
    setOpenProducto(true);
  };

  const abrirModalEditarProducto = (prod: any) => {
    setEditandoProductoId(prod.id);
    setFormProducto({
      sku: prod.sku, nombre: prod.nombre, marca: prod.marca, categoria: prod.categoria, imagenUrl: prod.imagen_url || ''
    });
    setOpenProducto(true);
  };

  const guardarProducto = async () => {
    try {
      if (editandoProductoId) {
        await api.put(`/productos/${editandoProductoId}`, formProducto);
        alert("✅ Producto actualizado");
      } else {
        await api.post('/productos', formProducto);
        alert("✅ Producto creado");
      }
      setOpenProducto(false);
      cargarProductos();
    } catch (error) {
      alert("❌ Error al guardar producto");
    }
  };

  const eliminarProducto = async (id: number) => {
    if(window.confirm("¿Estás seguro de eliminar este producto del catálogo?")) {
      try {
        await api.delete(`/productos/${id}`);
        alert("✅ Producto eliminado");
        cargarProductos();
      } catch (error) {
        alert("❌ Error al eliminar producto");
      }
    }
  };

  // --- LÓGICA DE PRESENTACIONES ---
  const abrirModalPresentacion = (producto: any) => {
    setProductoSeleccionado(producto);
    setFormPresentacion({ nombre: '', unidad_base: 'Unidad', factor_conversion: 1, precio_compra_referencial: '', precio_venta: '', codigo_barras: '' });
    setOpenPresentacion(true);
  };

  const guardarPresentacion = async () => {
    try {
      await api.post(`/productos/${productoSeleccionado.id}/presentaciones`, {
        ...formPresentacion,
        factor_conversion: parseInt(formPresentacion.factor_conversion.toString()),
        precio_compra_referencial: parseFloat(formPresentacion.precio_compra_referencial),
        precio_venta: parseFloat(formPresentacion.precio_venta)
      });
      setOpenPresentacion(false);
      cargarProductos();
    } catch (error) {
      alert("❌ Error al guardar la presentación");
    }
  };

  const eliminarPresentacion = async (id: number) => {
    if(window.confirm("¿Seguro que deseas quitar esta presentación/precio?")) {
      try {
        await api.delete(`/productos/presentaciones/${id}`);
        cargarProductos();
      } catch (error: any) {
        alert("❌ " + (error.response?.data?.error || "Error al eliminar. Es posible que ya tenga inventario asignado."));
      }
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a' }}>Catálogo de Productos</Typography>
          <Typography variant="body1" color="text.secondary">Gestiona tus productos, imágenes y precios de venta.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModalNuevoProducto} sx={{ bgcolor: '#0a348a', textTransform: 'none', borderRadius: 2 }}>
          Nuevo Producto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {productos.map((prod) => (
            <Card key={prod.id} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Botones de acción del producto */}
              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 0.5, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
                <Tooltip title="Editar Producto"><IconButton size="small" color="primary" onClick={() => abrirModalEditarProducto(prod)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Eliminar Producto"><IconButton size="small" color="error" onClick={() => eliminarProducto(prod.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </Box>

              {/* CORRECCIÓN DE LA IMAGEN: Usando Flexbox para centrar perfectamente sin estirar */}
              <Box sx={{ height: 220, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <img 
                  src={prod.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+Imagen'} 
                  alt={prod.nombre} 
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                />
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold' }}>SKU: {prod.sku}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', lineHeight: 1.2, mb: 1 }}>
                  {prod.nombre}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={prod.marca} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 'bold' }} />
                  <Chip label={prod.categoria} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 'bold' }} />
                </Box>

                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#334155', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LayersIcon fontSize="small" /> Presentaciones y Precios:
                </Typography>
                
                {prod.presentaciones?.length === 0 ? (
                  <Typography variant="body2" color="error" sx={{ fontStyle: 'italic' }}>Sin presentaciones configuradas</Typography>
                ) : (
                  prod.presentaciones?.map((pres: any) => (
                    <Box key={pres.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, p: 1, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{pres.nombre}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: '900' }}>S/ {pres.precio_venta}</Typography>
                        {/* Botón para eliminar la presentación */}
                        <IconButton size="small" onClick={() => eliminarPresentacion(pres.id)} sx={{ p: 0.5, color: '#ef4444' }}><CloseIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button fullWidth variant="outlined" startIcon={<PriceIcon />} onClick={() => abrirModalPresentacion(prod)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Añadir Precio / Presentación
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* MODAL CREAR/EDITAR PRODUCTO MAESTRO */}
      <Dialog open={openProducto} onClose={() => setOpenProducto(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#0a348a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{editandoProductoId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</Typography>
          <IconButton onClick={() => setOpenProducto(false)} sx={{ color: 'white' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            
            {/* ZONA DE CARGA DE IMAGEN MEJORADA */}
            <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {formProducto.imagenUrl ? (
                <>
                  <img src={formProducto.imagenUrl} alt="Vista previa" style={{ height: 120, maxWidth: '100%', objectFit: 'contain' }} />
                  <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>Imagen cargada exitosamente</Typography>
                  <Button size="small" onClick={() => setFormProducto({...formProducto, imagenUrl: ''})} sx={{ mt: 1 }}>Cambiar Imagen</Button>
                </>
              ) : uploadingImage ? (
                <CircularProgress />
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>Sube una foto del producto</Typography>
                  <Button variant="contained" component="label" sx={{ bgcolor: '#0ea5e9', textTransform: 'none' }}>
                    Seleccionar Archivo
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="SKU (Código Interno)" fullWidth value={formProducto.sku} onChange={e => setFormProducto({...formProducto, sku: e.target.value})} />
              <TextField label="Nombre del Producto" fullWidth value={formProducto.nombre} onChange={e => setFormProducto({...formProducto, nombre: e.target.value})} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Marca" fullWidth value={formProducto.marca} onChange={e => setFormProducto({...formProducto, marca: e.target.value})} />
              <TextField label="Categoría" fullWidth value={formProducto.categoria} onChange={e => setFormProducto({...formProducto, categoria: e.target.value})} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}><Button onClick={() => setOpenProducto(false)}>Cancelar</Button><Button variant="contained" onClick={guardarProducto} sx={{ bgcolor: '#0a348a' }}>Guardar Producto</Button></DialogActions>
      </Dialog>

      {/* MODAL CREAR PRESENTACIÓN Y PRECIO */}
      <Dialog open={openPresentacion} onClose={() => setOpenPresentacion(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#16a34a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Asignar Precio a: {productoSeleccionado?.nombre}</Typography>
          <IconButton onClick={() => setOpenPresentacion(false)} sx={{ color: 'white' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Nombre de Presentación" placeholder="Ej. Caja x 12, Balde 5L" fullWidth value={formPresentacion.nombre} onChange={e => setFormPresentacion({...formPresentacion, nombre: e.target.value})} />
              <TextField label="Unidad Base" placeholder="Ej. Botella, Litro" fullWidth value={formPresentacion.unidad_base} onChange={e => setFormPresentacion({...formPresentacion, unidad_base: e.target.value})} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Factor de Conversión" type="number" fullWidth value={formPresentacion.factor_conversion} onChange={e => setFormPresentacion({...formPresentacion, factor_conversion: parseInt(e.target.value)})} helperText="¿Cuántas unidades base trae esta presentación?" />
              <TextField label="Código de Barras (Opcional)" fullWidth value={formPresentacion.codigo_barras} onChange={e => setFormPresentacion({...formPresentacion, codigo_barras: e.target.value})} />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Precio Compra Referencial (S/)" type="number" fullWidth value={formPresentacion.precio_compra_referencial} onChange={e => setFormPresentacion({...formPresentacion, precio_compra_referencial: e.target.value})} />
              <TextField label="Precio de Venta Autorizado (S/)" type="number" sx={{ bgcolor: '#f0fdf4' }} fullWidth value={formPresentacion.precio_venta} onChange={e => setFormPresentacion({...formPresentacion, precio_venta: e.target.value})} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}><Button onClick={() => setOpenPresentacion(false)}>Cancelar</Button><Button variant="contained" onClick={guardarPresentacion} sx={{ bgcolor: '#16a34a' }}>Guardar Precio</Button></DialogActions>
      </Dialog>
    </Box>
  );
};
