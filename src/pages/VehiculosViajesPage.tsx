import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, CircularProgress, Tabs, Tab, Chip, Dialog, DialogContent, DialogActions, TextField, IconButton, Tooltip, MenuItem, DialogTitle, Alert
} from '@mui/material';
import { 
  LocalShipping, Map as MapIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Close as CloseIcon, DirectionsCar, Route as RouteIcon, Person as PersonIcon, Inventory as InventoryIcon,
  AssignmentTurnedIn as LiquidarIcon, Print as PrintIcon, Storefront as StorefrontIcon, PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { api } from '../api/axiosConfig';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const VehiculosViajesPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [viajes, setViajes] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]); 
  const [inventarioAlmacen, setInventarioAlmacen] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  const [openVehiculo, setOpenVehiculo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<number | null>(null);
  
  const [formVehiculo, setFormVehiculo] = useState({
    placa: '', marca: '', modelo: '', capacidad: '', estado: 'DISPONIBLE', observaciones: ''
  });

  const [openViaje, setOpenViaje] = useState(false);
  const [formViaje, setFormViaje] = useState({
    destino: '', vehiculoId: '', trabajadorId: '', fecha: new Date().toISOString().split('T')[0] 
  });

  const [openCarga, setOpenCarga] = useState(false);
  const [pasoModal, setPasoModal] = useState(1); 
  const [viajeACargar, setViajeACargar] = useState<any>(null);
  const [itemsCarga, setItemsCarga] = useState<any[]>([]);
  const [formItem, setFormItem] = useState({
    presentacionId: '', cantidad: '', precioVenta: '', nombreInfo: '', maxStock: 0
  });

  const [openLiquidacion, setOpenLiquidacion] = useState(false);
  const [viajeLiquidacion, setViajeLiquidacion] = useState<any>(null);
  const [datosLiquidacion, setDatosLiquidacion] = useState<any>(null);
  const [loadingLiquidacion, setLoadingLiquidacion] = useState(false);
  
  const [liquidacionInputs, setLiquidacionInputs] = useState<Record<number, { fisico: number, comentario: string }>>({});

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resVeh = await api.get('/logistica/vehiculos');
      setVehiculos(resVeh.data);
    } catch (e) { console.error("Error al cargar vehículos", e); }

    try {
      const resViajes = await api.get('/logistica/viajes');
      setViajes(resViajes.data);
    } catch (e) { console.error("Error al cargar viajes", e); }

    try {
      const resUsu = await api.get('/usuarios');
      setTrabajadores(resUsu.data.filter((u: any) => u.rol === 'TRABAJADOR' && u.estado === 'ACTIVO'));
    } catch (e) { console.error("Error al cargar usuarios", e); }

    try {
      const resInv = await api.get('/logistica/inventario-almacen');
      setInventarioAlmacen(resInv.data);
    } catch (e) { console.error("Error al cargar el inventario del almacén", e); }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const obtenerNombreChofer = (id: number) => {
    const chofer = trabajadores.find(t => t.id === id);
    return chofer ? `${chofer.nombre} ${chofer.apellidos}` : `Trabajador #${id}`;
  };

  const abrirModalNuevo = () => {
    setIsEditing(false); setVehiculoSeleccionado(null);
    setFormVehiculo({ placa: '', marca: '', modelo: '', capacidad: '', estado: 'DISPONIBLE', observaciones: '' });
    setOpenVehiculo(true);
  };

  const abrirModalEditar = (vehiculo: any) => {
    setIsEditing(true); setVehiculoSeleccionado(vehiculo.id);
    setFormVehiculo({ ...vehiculo, capacidad: vehiculo.capacidad.toString(), observaciones: vehiculo.observaciones || '' });
    setOpenVehiculo(true);
  };

  const guardarVehiculo = async () => {
    if (!formVehiculo.placa || !formVehiculo.marca || !formVehiculo.capacidad) return alert("Placa, Marca y Capacidad soy obligatorios");
    try {
      const payload = { ...formVehiculo, capacidad: parseFloat(formVehiculo.capacidad) };
      if (isEditing && vehiculoSeleccionado) await api.put(`/logistica/vehiculos/${vehiculoSeleccionado}`, payload);
      else await api.post('/logistica/vehiculos', payload);
      alert("✅ Vehículo guardado exitosamente"); setOpenVehiculo(false); cargarDatos();
    } catch (error) { alert("❌ Error al procesar el vehículo"); }
  };

  const eliminarVehiculo = async (id: number) => {
    if (window.confirm("¿Eliminar vehículo de la flota?")) {
      try { await api.delete(`/logistica/vehiculos/${id}`); alert("✅ Vehículo eliminado"); cargarDatos(); } 
      catch (error: any) { alert("❌ " + (error.response?.data?.error || "Error al eliminar")); }
    }
  };

  const guardarViaje = async () => {
    if (!formViaje.destino || !formViaje.vehiculoId || !formViaje.trabajadorId || !formViaje.fecha) return alert("Faltan datos obligatorios");
    try {
      await api.post('/logistica/viajes', { 
        ...formViaje, vehiculoId: parseInt(formViaje.vehiculoId), trabajadorId: parseInt(formViaje.trabajadorId) 
      });
      alert("✅ Viaje programado"); setOpenViaje(false);
      setFormViaje({ destino: '', vehiculoId: '', trabajadorId: '', fecha: new Date().toISOString().split('T')[0] });
      cargarDatos();
    } catch (error) { alert("❌ Error al programar el viaje"); }
  };

  const abrirModalCarga = async (viaje: any) => {
    setViajeACargar(viaje); 
    setItemsCarga([]); 
    setPasoModal(1); 
    setFormItem({ presentacionId: '', cantidad: '', precioVenta: '', nombreInfo: '', maxStock: 0 }); 
    setOpenCarga(true);

    try {
      const idVehiculo = viaje.vehiculoId || viaje.vehiculo_id || viaje.vehiculo?.id;
      const res = await api.get(`/logistica/vehiculos/${idVehiculo}/inventario`);
      
      if (res.data && res.data.length > 0) {
        const inventarioPrevio = res.data.map((i: any) => ({
          presentacionId: (i.presentacion_id || i.presentacion?.id).toString(),
          nombreInfo: `${i.producto_nombre || i.presentacion?.producto?.nombre} - ${i.presentacion_nombre || i.presentacion?.nombre}`,
          cantidad: i.cantidad,
          precioVenta: i.precio_venta || i.presentacion?.precio || 0,
          esPrevio: true 
        }));
        setItemsCarga(inventarioPrevio);
      }
    } catch (error) {
      console.error("El vehículo está vacío o hubo un error al consultar su inventario.");
    }
  };

  const handleProductoSelect = (e: any) => {
    const id = e.target.value;
    const producto = inventarioAlmacen.find(p => p.presentacion_id.toString() === id.toString());
    if (producto) {
      setFormItem({
        ...formItem, 
        presentacionId: id, 
        precioVenta: producto.precio_venta || '', 
        nombreInfo: `${producto.producto} - ${producto.presentacion}`, 
        maxStock: producto.cantidad 
      });
    }
  };

  const agregarItemCarga = () => {
    if (!formItem.presentacionId || !formItem.cantidad) return alert("Seleccione un producto y digite la cantidad.");
    const cant = parseInt(formItem.cantidad);
    if (cant <= 0) return alert("Cantidad inválida");

    const existeIndex = itemsCarga.findIndex(i => i.presentacionId === formItem.presentacionId);

    if (existeIndex >= 0) {
      const nuevaLista = [...itemsCarga];
      const cantidadNuevaExistente = nuevaLista[existeIndex].esPrevio ? 0 : nuevaLista[existeIndex].cantidad;
      
      if (cantidadNuevaExistente + cant > formItem.maxStock) {
        return alert(`No puedes exceder el stock del almacén. Máximo a subir: ${formItem.maxStock}.`);
      }
      
      nuevaLista[existeIndex].cantidad += cant;
      setItemsCarga(nuevaLista);
    } else {
      if (cant > formItem.maxStock) return alert(`Stock disponible en almacén: ${formItem.maxStock}`);
      setItemsCarga([...itemsCarga, { ...formItem, cantidad: cant, precioVenta: parseFloat(formItem.precioVenta), esPrevio: false }]);
    }
    setFormItem({ presentacionId: '', cantidad: '', precioVenta: '', nombreInfo: '', maxStock: 0 });
  };

  const eliminarItemCarga = (index: number) => {
    const nuevaLista = [...itemsCarga];
    nuevaLista.splice(index, 1);
    setItemsCarga(nuevaLista);
  };

  const imprimirGuiaCargaPDF = (viaje: any, items: any[]) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const fechaActual = new Date().toLocaleString('es-PE');
    let totalPotencial = 0;
    let filasTabla = '';

    items.forEach((item: any) => {
      const importe = item.cantidad * item.precioVenta;
      totalPotencial += importe;
      const partesNombre = item.nombreInfo.split(' - ');
      const nombreProducto = partesNombre[0] || item.nombreInfo;
      const presentacion = partesNombre[1] || '';

      filasTabla += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${nombreProducto}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${presentacion}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><strong>${item.cantidad}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${item.precioVenta.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: #16a34a; font-weight: bold;">S/ ${importe.toFixed(2)}</td>
        </tr>
      `;
    });

    const htmlPDF = `
      <html>
        <head>
          <title>Guia_Carga_TRIP_${viaje.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #0a348a; margin: 0 0 10px 0; }
            .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
            .info-box p { margin: 5px 0; font-size: 14px; }
            .total-recaudado { font-size: 20px; color: #16a34a; font-weight: bold; text-align: right; margin-bottom: 20px;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #0a348a; color: white; padding: 12px 10px; text-align: left; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px;}
            .firmas { display: flex; justify-content: space-between; margin-top: 80px; padding: 0 50px; }
            .firma-linea { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 5px; font-weight: bold;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Guía de Carga de Vehículo</h1>
            <p>Sistema de Gestión Logística - CREDI HOGAR PLUS</p>
          </div>
          <div class="info-box">
            <table style="margin-bottom: 0;">
              <tr>
                <td><p><strong>ID Viaje:</strong> TRIP-${viaje.id}</p></td>
                <td><p><strong>Fecha de Despacho:</strong> ${fechaActual}</p></td>
              </tr>
              <tr>
                <td><p><strong>Vehículo:</strong> ${viaje.vehiculoPlaca || viaje.vehiculo?.placa || 'Desconocido'}</p></td>
                <td><p><strong>Ruta / Destino:</strong> ${viaje.destino}</p></td>
              </tr>
              <tr>
                <td><p><strong>Trabajador:</strong> ${obtenerNombreChofer(viaje.trabajadorId)}</p></td>
                <td><p><strong>Almacén Origen:</strong> Almacén Principal</p></td>
              </tr>
            </table>
          </div>
          <h3>Detalle de Mercadería Cargada (Incluye Stock Mantenido)</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Presentación</th>
                <th style="text-align: center;">Cantidad Total</th>
                <th style="text-align: right;">Precio Autorizado</th>
                <th style="text-align: right;">Venta Potencial</th>
              </tr>
            </thead>
            <tbody>${filasTabla}</tbody>
          </table>
          <div class="total-recaudado">Total Potencial de Venta: S/ ${totalPotencial.toFixed(2)}</div>
          <div class="firmas">
            <div class="firma-linea">Despachado por (Almacén)</div>
            <div class="firma-linea">Recibido por (Trabajador)</div>
          </div>
          <div class="footer">Documento generado automáticamente por el Sistema - CREDI HOGAR PLUS</div>
        </body>
      </html>
    `;
    
    (ventanaImpresion.document as any).write(htmlPDF);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => { ventanaImpresion.print(); }, 500);
  };

  const confirmarDespacho = async () => {
    try {
      const itemsNuevos = itemsCarga.filter(i => !i.esPrevio).map(i => ({ 
        presentacionId: parseInt(i.presentacionId), 
        cantidad: i.cantidad 
      }));

      const payload = { items: itemsNuevos };
      await api.post(`/logistica/viajes/${viajeACargar.id}/carga`, payload);
      
      imprimirGuiaCargaPDF(viajeACargar, itemsCarga);
      
      alert("🚛 ¡Camión cargado y despachado exitosamente!"); 
      setOpenCarga(false); 
      cargarDatos();
    } catch (error: any) { alert("❌ Error: " + (error.response?.data?.error || "Error al despachar.")); }
  };

  const descargarGuia = async (viaje: any) => {
    try {
      const res = await api.get(`/logistica/viajes/${viaje.id}/carga`);
      const itemsAdaptados = res.data.items.map((i: any) => ({
        nombreInfo: `${i.producto_nombre} - ${i.presentacion_nombre}`,
        cantidad: i.cantidad,
        precioVenta: i.precio_venta
      }));
      imprimirGuiaCargaPDF(viaje, itemsAdaptados);
    } catch (error) {
      alert("❌ Error al descargar la guía de carga.");
    }
  };

  const descargarLiquidacionCerrada = async (viaje: any) => {
    try {
      const res = await api.get(`/liquidacion/resumen/${viaje.id}`);
      const datos = res.data;
      
      const ventanaImpresion = window.open('', '_blank');
      if (!ventanaImpresion) return;

      const fechaActual = new Date().toLocaleString('es-PE');
      let filasTabla = '';
      
      datos?.detalles.forEach((d: any) => {
        filasTabla += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${d.producto}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${d.presentacion}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><strong>${d.cantidad_vendida}</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><strong>${d.stock_restante}</strong></td>
          </tr>
        `;
      });

      const htmlPDF = `
        <html>
          <head>
            <title>Liquidacion_TRIP_${viaje.id}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #0a348a; margin: 0 0 10px 0; }
              .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
              .info-box p { margin: 5px 0; font-size: 14px; }
              .total-recaudado { font-size: 24px; color: #16a34a; font-weight: bold; text-align: right; margin-bottom: 20px;}
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background-color: #0a348a; color: white; padding: 12px 10px; text-align: left; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px;}
              .firmas { display: flex; justify-content: space-around; margin-top: 80px; }
              .firma-linea { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 5px; font-weight: bold;}
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte de Liquidación de Viaje</h1>
              <p>Sistema de Gestión Logística - CREDI HOGAR PLUS</p>
            </div>
            <div class="info-box">
              <table style="margin-bottom: 0;">
                <tr>
                  <td><p><strong>ID Viaje:</strong> TRIP-${viaje.id}</p></td>
                  <td><p><strong>Fecha de Liquidación:</strong> ${fechaActual}</p></td>
                </tr>
                <tr>
                  <td><p><strong>Vehículo:</strong> ${viaje.vehiculoPlaca || viaje.vehiculo?.placa || 'Desconocido'}</p></td>
                  <td><p><strong>Ruta / Destino:</strong> ${viaje.destino}</p></td>
                </tr>
                <tr>
                  <td colspan="2"><p><strong>Trabajador:</strong> ${obtenerNombreChofer(viaje.trabajadorId)}</p></td>
                </tr>
              </table>
            </div>
            <div class="total-recaudado">
              Total a Rendir en Caja: S/ ${datos?.totalRecaudado?.toFixed(2) || '0.00'}
            </div>
            <h3>Detalle de Inventario y Movimientos</h3>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Presentación</th>
                  <th style="text-align: center;">Cant. Vendida</th>
                  <th style="text-align: center;">Stock Físico Retornado</th>
                </tr>
              </thead>
              <tbody>
                ${filasTabla || '<tr><td colspan="4" style="text-align:center; padding:10px;">No hubo movimientos</td></tr>'}
              </tbody>
            </table>
            <div class="firmas">
              <div class="firma-linea">Firma del Trabajador</div>
              <div class="firma-linea">Firma del Gerente</div>
            </div>
            <div class="footer">
              Documento generado automáticamente por el Sistema - CREDI HOGAR PLUS
            </div>
          </body>
        </html>
      `;

      (ventanaImpresion.document as any).write(htmlPDF);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
      }, 500);

    } catch (error) {
      alert("❌ Error al generar el reporte de liquidación histórico.");
    }
  };

  const abrirLiquidacion = async (viaje: any) => {
    setViajeLiquidacion(viaje);
    setOpenLiquidacion(true);
    setLoadingLiquidacion(true);
    try {
      const res = await api.get(`/liquidacion/resumen/${viaje.id}`);
      setDatosLiquidacion(res.data);
      
      const inputsIniciales: any = {};
      res.data.detalles?.forEach((d: any, idx: number) => {
        inputsIniciales[idx] = { fisico: d.stock_restante, comentario: '' };
      });
      setLiquidacionInputs(inputsIniciales);

    } catch (error) {
      console.error("Error al calcular liquidación:", error);
    }
    setLoadingLiquidacion(false);
  };

  const totalFisicoRestante = datosLiquidacion?.detalles?.reduce((acc: number, _d: any, idx: number) => {
    const input = liquidacionInputs[idx];
    return acc + (input?.fisico || 0);
  }, 0) || 0;

  const confirmarCierre = async (accion: 'DEVOLVER' | 'MANTENER') => {
    let faltanMotivos = false;
    const ajustes = datosLiquidacion?.detalles.map((d: any, idx: number) => {
      const input = liquidacionInputs[idx];
      const diferencia = input.fisico - d.stock_restante;
      if (diferencia !== 0 && !input.comentario.trim()) faltanMotivos = true;
      return {
        presentacionId: d.presentacion_id || d.presentacionId || 0,
        teorico: d.stock_restante,
        fisico: input.fisico,
        diferencia: diferencia,
        motivo: input.comentario
      };
    });

    if (faltanMotivos) {
      return alert("⚠️ Hay diferencias de stock (pérdidas o sobrantes) sin justificar. Por favor, agregue un motivo.");
    }

    try {
      await api.post('/liquidacion/cerrar', {
        viajeId: viajeLiquidacion.id,
        vehiculoId: viajeLiquidacion.vehiculoId || viajeLiquidacion.vehiculo_id || viajeLiquidacion.vehiculo?.id,
        accionStock: accion,
        ajustes: ajustes 
      });

      let mensajeExito = `✅ Viaje cerrado exitosamente.`;
      if (totalFisicoRestante > 0) {
        mensajeExito += `\nStock: ${accion === 'DEVOLVER' ? 'Devuelto al Almacén Principal' : 'Mantenido en el Vehículo'}`;
      } else {
        mensajeExito += `\nTodo el inventario fue vendido o justificado. El camión quedó vacío.`;
      }
      alert(mensajeExito);
      
      setOpenLiquidacion(false);
      cargarDatos();
    } catch (error) {
      alert("❌ Error al cerrar el viaje");
      console.error(error);
    }
  };

  const imprimirReportePDF = () => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const fechaActual = new Date().toLocaleString('es-PE');
    let filasTabla = '';
    
    datosLiquidacion?.detalles.forEach((d: any, idx: number) => {
      const input = liquidacionInputs[idx];
      const dif = input.fisico - d.stock_restante;
      const colorDif = dif < 0 ? 'red' : (dif > 0 ? '#16a34a' : 'black');

      filasTabla += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${d.producto}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${d.presentacion}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><strong>${d.cantidad_vendida}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${d.stock_restante}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: #0a348a;"><strong>${input.fisico}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: ${colorDif};"><strong>${dif}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px;">${input.comentario}</td>
        </tr>
      `;
    });

    const htmlPDF = `
      <html>
        <head>
          <title>Liquidacion_TRIP_${viajeLiquidacion.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #0a348a; margin: 0 0 10px 0; }
            .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
            .info-box p { margin: 5px 0; font-size: 14px; }
            .total-recaudado { font-size: 24px; color: #16a34a; font-weight: bold; text-align: right; margin-bottom: 20px;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #0a348a; color: white; padding: 12px 10px; text-align: left; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px;}
            .firmas { display: flex; justify-content: space-around; margin-top: 80px; }
            .firma-linea { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 5px; font-weight: bold;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Liquidación de Viaje</h1>
            <p>Sistema de Gestión Logística - CREDI HOGAR PLUS</p>
          </div>
          <div class="info-box">
            <table style="margin-bottom: 0;">
              <tr>
                <td><p><strong>ID Viaje:</strong> TRIP-${viajeLiquidacion.id}</p></td>
                <td><p><strong>Fecha de Liquidación:</strong> ${fechaActual}</p></td>
              </tr>
              <tr>
                <td><p><strong>Vehículo:</strong> ${viajeLiquidacion.vehiculoPlaca || viajeLiquidacion.vehiculo?.placa || 'Desconocido'}</p></td>
                <td><p><strong>Ruta / Destino:</strong> ${viajeLiquidacion.destino}</p></td>
              </tr>
              <tr>
                <td colspan="2"><p><strong>Trabajador:</strong> ${obtenerNombreChofer(viajeLiquidacion.trabajadorId)}</p></td>
              </tr>
            </table>
          </div>
          <div class="total-recaudado">Total a Rendir en Caja: S/ ${datosLiquidacion?.totalRecaudado?.toFixed(2) || '0.00'}</div>
          <h3>Detalle de Inventario Físico y Mermas</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Presentación</th>
                <th style="text-align: center;">Vendidos</th>
                <th style="text-align: center;">Teórico</th>
                <th style="text-align: center;">Físico</th>
                <th style="text-align: center;">Dif.</th>
                <th>Motivo de Merma</th>
              </tr>
            </thead>
            <tbody>${filasTabla || '<tr><td colspan="7" style="text-align:center; padding:10px;">No hubo movimientos</td></tr>'}</tbody>
          </table>
          <div class="firmas">
            <div class="firma-linea">Firma del Trabajador</div>
            <div class="firma-linea">Aprobado por (Gerencia)</div>
          </div>
          <div class="footer">Documento generado automáticamente por el Sistema - CREDI HOGAR PLUS</div>
        </body>
      </html>
    `;

    (ventanaImpresion.document as any).write(htmlPDF);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => { ventanaImpresion.print(); }, 500);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Gestión de Logística y Flota</Typography>
        {tabIndex === 0 ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModalNuevo} sx={{ bgcolor: '#0a348a', textTransform: 'none', borderRadius: 2 }}>Nuevo Vehículo</Button>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenViaje(true)} sx={{ bgcolor: '#0a348a', textTransform: 'none', borderRadius: 2 }}>Programar Viaje</Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab icon={<LocalShipping />} iconPosition="start" label="Flota de Vehículos" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab icon={<MapIcon />} iconPosition="start" label="Control de Viajes" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? <Box sx={{ display:'flex', justifyContent:'center', p:4 }}><CircularProgress /></Box> : (
            <>
              <CustomTabPanel value={tabIndex} index={0}>
                <TableContainer><Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Placa</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Vehículo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Capacidad</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehiculos.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No hay vehículos registrados.</TableCell></TableRow> : vehiculos.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{v.placa}</TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{v.marca}</Typography><Typography variant="caption">{v.modelo}</Typography></TableCell>
                        <TableCell>{v.capacidad} Ton.</TableCell>
                        <TableCell>
                          <Chip 
                            label={v.estado} 
                            color={v.estado === 'DISPONIBLE' ? 'success' : v.estado === 'EN_RUTA' ? 'info' : v.estado === 'MANTENIMIENTO' ? 'error' : 'warning'} 
                            size="small" sx={{ fontWeight: 'bold' }} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" size="small" onClick={() => abrirModalEditar(v)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton color="error" size="small" onClick={() => eliminarVehiculo(v.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></TableContainer>
              </CustomTabPanel>

              <CustomTabPanel value={tabIndex} index={1}>
                <TableContainer><Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID Viaje</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fecha Salida</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Destino / Ruta</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Vehículo / Chofer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones (PDFs y Liquidación)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viajes.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No hay viajes programados</TableCell></TableRow> : viajes.map((viaje) => (
                      <TableRow key={viaje.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell sx={{ fontWeight: 'bold', color: '#0a348a' }}>TRIP-{viaje.id}</TableCell>
                        <TableCell>{viaje.fecha}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>{viaje.destino}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShipping fontSize="small" sx={{ color: '#64748b' }}/> {viaje.vehiculoPlaca || viaje.vehiculo?.placa}</Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonIcon fontSize="small" sx={{ color: '#64748b' }}/> <Typography variant="caption">{obtenerNombreChofer(viaje.trabajadorId)}</Typography></Box>
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={viaje.estado} color={viaje.estado === 'BORRADOR' ? 'primary' : viaje.estado === 'CARGADO' ? 'success' : viaje.estado === 'EN_RUTA' ? 'info' : 'default'} size="small" sx={{ fontWeight: 'bold', borderRadius: 1 }} /></TableCell>
                        
                        <TableCell align="center">
                          {viaje.estado === 'BORRADOR' && (
                            <Tooltip title="Preparar Carga del Camión">
                              <IconButton color="secondary" onClick={() => abrirModalCarga(viaje)} sx={{ bgcolor: '#fdf4ff', '&:hover': { bgcolor: '#fae8ff' } }}>
                                <InventoryIcon fontSize="small" sx={{ color: '#c026d3' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {(viaje.estado === 'CARGADO' || viaje.estado === 'EN_RUTA' || viaje.estado === 'CERRADO') && (
                            <Tooltip title="Descargar Guía de Carga (PDF)">
                              <IconButton color="primary" onClick={() => descargarGuia(viaje)} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' }, ml: 1 }}>
                                <PdfIcon fontSize="small" sx={{ color: '#0ea5e9' }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {(viaje.estado === 'EN_RUTA' || viaje.estado === 'CARGADO') && (
                            <Tooltip title="Liquidar y Cerrar Viaje">
                              <IconButton color="primary" onClick={() => abrirLiquidacion(viaje)} sx={{ bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' }, ml: 1 }}>
                                <LiquidarIcon fontSize="small" sx={{ color: '#16a34a' }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {viaje.estado === 'CERRADO' && (
                             <Tooltip title="Imprimir Reporte de Liquidación Final">
                              <IconButton color="primary" onClick={() => descargarLiquidacionCerrada(viaje)} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, ml: 1 }}>
                                <PdfIcon fontSize="small" sx={{ color: '#ef4444' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table></TableContainer>
              </CustomTabPanel>
            </>
          )}
        </Box>
      </Paper>

      <Dialog open={openVehiculo} onClose={() => setOpenVehiculo(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ display: 'flex', p: 1, bgcolor: '#e0e7ff', borderRadius: 2 }}><DirectionsCar sx={{ color: '#4f46e5' }} /></Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>{isEditing ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</Typography></Box>
          <IconButton onClick={() => setOpenVehiculo(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* CORRECCIÓN APLICADA: slotProps para no chocar con las interfaces estrictas de MUI */}
            <TextField 
              label="Placa" 
              fullWidth 
              value={formVehiculo.placa} 
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                if(val.length <= 10) setFormVehiculo({...formVehiculo, placa: val});
              }}
              slotProps={{ htmlInput: { maxLength: 10 } }}
              helperText="Máximo 10 caracteres"
            />
            <Box sx={{ display: 'flex', gap: 2 }}><TextField label="Marca" fullWidth value={formVehiculo.marca} onChange={(e) => setFormVehiculo({...formVehiculo, marca: e.target.value})} /><TextField label="Modelo" fullWidth value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({...formVehiculo, modelo: e.target.value})} /></Box>
            <Box sx={{ display: 'flex', gap: 2 }}><TextField label="Capacidad" type="number" fullWidth value={formVehiculo.capacidad} onChange={(e) => setFormVehiculo({...formVehiculo, capacidad: e.target.value})} />
              {isEditing && <TextField select label="Estado" fullWidth value={formVehiculo.estado} onChange={(e) => setFormVehiculo({...formVehiculo, estado: e.target.value})}>
                <MenuItem value="DISPONIBLE">DISPONIBLE</MenuItem>
                <MenuItem value="MANTENIMIENTO">MANTENIMIENTO</MenuItem>
                <MenuItem value="EN_RUTA">EN_RUTA</MenuItem>
              </TextField>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setOpenVehiculo(false)}>Cancelar</Button><Button variant="contained" onClick={guardarVehiculo} sx={{ bgcolor: '#4f46e5' }}>Guardar</Button></DialogActions>
      </Dialog>

      <Dialog open={openViaje} onClose={() => setOpenViaje(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, bgcolor: '#fdf4ff', borderBottom: '1px solid #fae8ff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ display: 'flex', p: 1, bgcolor: '#f5d0fe', borderRadius: 2 }}><RouteIcon sx={{ color: '#c026d3' }} /></Box><Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4a044e' }}>Programar Viaje</Typography></Box>
          <IconButton onClick={() => setOpenViaje(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Destino / Ruta" fullWidth value={formViaje.destino} onChange={(e) => setFormViaje({...formViaje, destino: e.target.value})} />
            <TextField select label="Vehículo" fullWidth value={formViaje.vehiculoId} onChange={(e) => setFormViaje({...formViaje, vehiculoId: e.target.value})}>
              {vehiculos.filter(v => v.estado === 'DISPONIBLE').map((v) => <MenuItem key={v.id} value={v.id.toString()}>{v.placa} - {v.marca}</MenuItem>)}
            </TextField>
            <TextField select label="Chofer" fullWidth value={formViaje.trabajadorId} onChange={(e) => setFormViaje({...formViaje, trabajadorId: e.target.value})}>
              {trabajadores.map((t) => <MenuItem key={t.id} value={t.id.toString()}>{t.nombre} {t.apellidos}</MenuItem>)}
            </TextField>
            <TextField label="Fecha" type="date" fullWidth value={formViaje.fecha} onChange={(e) => setFormViaje({...formViaje, fecha: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setOpenViaje(false)}>Cancelar</Button><Button variant="contained" onClick={guardarViaje} sx={{ bgcolor: '#c026d3' }}>Programar</Button></DialogActions>
      </Dialog>

      <Dialog open={openCarga} onClose={() => setOpenCarga(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, bgcolor: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', p: 1, bgcolor: '#bbf7d0', borderRadius: 2 }}><InventoryIcon sx={{ color: '#16a34a' }} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#14532d' }}>
              {pasoModal === 1 ? `Subir Carga a TRIP-${viajeACargar?.id}` : 'Resumen Final de Despacho'}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenCarga(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {pasoModal === 1 && (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField select label="Producto del Almacén" fullWidth sx={{ flex: 2, minWidth: 200 }} value={formItem.presentacionId} onChange={handleProductoSelect} size="small">
                  {inventarioAlmacen.length === 0 ? <MenuItem disabled value="">Sin stock</MenuItem> : inventarioAlmacen.map((p) => <MenuItem key={p.presentacion_id} value={p.presentacion_id.toString()}>{p.producto} - {p.presentacion} (Stock: {p.cantidad})</MenuItem>)}
                </TextField>
                <TextField label="Cantidad" type="number" size="small" sx={{ flex: 1, minWidth: 100 }} value={formItem.cantidad} onChange={e => setFormItem({...formItem, cantidad: e.target.value})} helperText={`Máx: ${formItem.maxStock}`} />
                <TextField label="Precio Base (S/)" type="number" size="small" sx={{ flex: 1, minWidth: 120, bgcolor: '#f1f5f9' }} value={formItem.precioVenta} disabled />
                <Button variant="contained" onClick={agregarItemCarga} sx={{ bgcolor: '#16a34a', height: 40, mt: -2.5 }}>Agregar</Button>
              </Box>
            </Paper>
          )}

          {pasoModal === 2 && (
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#fffbeb', border: '1px solid #fef08a', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: '#b45309', fontWeight: 'bold' }}>
                ⚠️ Por favor, confirme que las cantidades son exactas. Al despachar, estos productos se restarán automáticamente del almacén y pasarán al inventario del vehículo.
              </Typography>
            </Paper>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Precio Base</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Ref.</TableCell>
                  {pasoModal === 1 && <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsCarga.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Agrega productos a la carga.</TableCell></TableRow> : itemsCarga.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.nombreInfo}</TableCell>
                    <TableCell align="center"><Chip label={item.cantidad} color="primary" size="small" /></TableCell>
                    <TableCell align="center">S/ {item.precioVenta.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 'bold' }}>S/ {(item.cantidad * item.precioVenta).toFixed(2)}</TableCell>
                    {pasoModal === 1 && (
                      <TableCell align="center">
                        {!item.esPrevio ? (
                          <IconButton size="small" color="error" onClick={() => eliminarItemCarga(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <Chip label="En Camión" size="small" color="secondary" variant="outlined" />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, bgcolor: '#ffffff' }}>
          {pasoModal === 1 ? (
            <>
              <Button onClick={() => setOpenCarga(false)}>Cerrar</Button>
              <Button variant="contained" onClick={() => setPasoModal(2)} disabled={itemsCarga.length === 0} sx={{ bgcolor: '#0ea5e9' }}>
                Confirmar Carga
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setPasoModal(1)}>Atrás (Editar)</Button>
              <Button variant="contained" onClick={confirmarDespacho} sx={{ bgcolor: '#16a34a' }}>
                Despachar Camión
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openLiquidacion} onClose={() => setOpenLiquidacion(false)} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#0a348a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Liquidación de Viaje: TRIP-{viajeLiquidacion?.id}</Typography>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<PrintIcon />} 
            onClick={imprimirReportePDF}
            disabled={loadingLiquidacion}
            sx={{ boxShadow: 'none', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            REPORTE PDF
          </Button>
        </DialogTitle>
        
        <DialogContent sx={{ bgcolor: '#f8fafc', py: 3 }}>
          {loadingLiquidacion ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Si el <strong>Stock Físico Retornado</strong> no coincide con el Teórico, el sistema exigirá obligatoriamente un Motivo (Merma/Daño) para cerrar el viaje.
              </Alert>

              <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Recaudado en Ruta</Typography>
                  <Typography variant="h4" sx={{ fontWeight: '900', color: '#16a34a' }}>
                    S/ {datosLiquidacion?.totalRecaudado?.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2"><strong>Camión:</strong> {viajeLiquidacion?.vehiculoPlaca || viajeLiquidacion?.vehiculo?.placa || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Destino:</strong> {viajeLiquidacion?.destino}</Typography>
                </Box>
              </Paper>

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1e293b' }}>Resumen de Inventario y Mermas</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Vendidos</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Teórico</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#0a348a', width: '120px' }}>FÍSICO</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Dif.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Motivo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosLiquidacion?.detalles?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Sin movimientos de inventario.</TableCell></TableRow>
                    ) : (
                      datosLiquidacion?.detalles?.map((item: any, idx: number) => {
                        const input = liquidacionInputs[idx] || { fisico: item.stock_restante, comentario: '' };
                        const diferencia = input.fisico - item.stock_restante;
                        const colorDif = diferencia < 0 ? '#d32f2f' : (diferencia > 0 ? '#16a34a' : '#64748b');

                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>{item.producto} - {item.presentacion}</TableCell>
                            <TableCell align="center" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{item.cantidad_vendida}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>{item.stock_restante}</TableCell>
                            
                            <TableCell align="center">
                              <TextField 
                                type="number" 
                                size="small" 
                                value={input.fisico} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setLiquidacionInputs({ ...liquidacionInputs, [idx]: { ...input, fisico: val } });
                                }}
                                sx={{ 
                                  bgcolor: '#eff6ff', 
                                  borderRadius: 1,
                                  width: '90px',
                                  '& input': { textAlign: 'center', fontWeight: 'bold', color: '#0a348a' } 
                                }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Typography sx={{ fontWeight: 'bold', color: colorDif }}>
                                {diferencia > 0 ? `+${diferencia}` : diferencia}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <TextField 
                                size="small" 
                                fullWidth
                                placeholder="Obligatorio si hay dif..."
                                disabled={diferencia === 0}
                                value={input.comentario}
                                onChange={(e) => setLiquidacionInputs({ ...liquidacionInputs, [idx]: { ...input, comentario: e.target.value } })}
                              />
                            </TableCell>

                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#ffffff', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenLiquidacion(false)} color="inherit" sx={{ fontWeight: 'bold', textTransform: 'none' }}>Cancelar</Button>
          
          {totalFisicoRestante === 0 ? (
            <Button 
              variant="contained" color="success" startIcon={<StorefrontIcon />}
              onClick={() => confirmarCierre('DEVOLVER')} sx={{ fontWeight: 'bold', textTransform: 'none' }}
            >
              Cerrar Viaje (Todo Vendido)
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" color="primary" startIcon={<LocalShipping />}
                onClick={() => confirmarCierre('MANTENER')} sx={{ fontWeight: 'bold', textTransform: 'none' }}
              >
                Cerrar y Mantener Stock
              </Button>
              <Button 
                variant="contained" color="error" startIcon={<StorefrontIcon />}
                onClick={() => confirmarCierre('DEVOLVER')} sx={{ fontWeight: 'bold', textTransform: 'none' }}
              >
                Cerrar y Devolver al Almacén
              </Button>
            </Box>
          )}

        </DialogActions>
      </Dialog>
    </Box>
  );
};