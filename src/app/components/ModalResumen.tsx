import React, { useState, useEffect } from "react";
import { 
  Modal, Button, CircularProgress, List, ListItem, ListItemText,
  IconButton, TextField, Typography, Box, Paper, Divider, Chip, 
  ThemeProvider, createTheme, useTheme, Grid, Tabs, Tab,
  Select, MenuItem, FormControl, InputLabel, Slider, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Alert
} from "@mui/material";
import { 
  ArrowUpward, BarChart, InsertDriveFile, CloudDownload, 
  WbSunny, BatteryChargingFull, Thermostat, ColorLens, FormatSize,
  Info, HelpOutline, Assessment, ShowChart, Refresh
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartTooltip, Legend, registerables } from 'chart.js';
import { Line, Bar, Scatter, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend, ...registerables);

// Interfaces para los datos de los endpoints
interface IrradianceVsPower {
  graph_type: string;
  description: string;
  data: {
    timestamp: string;
    irradiance: number;
    total_power: number;
  }[];
}

interface HistogramData {
  graph_type: string;
  measurement_type: string;
  description: string;
  bins: string[];
  counts: number[];
  expected_time: string;
  alert: string | null;
  time_distribution: Record<string, number>;
  extremes: {
    highest: {
      inverter: string;
      value: number;
    };
    lowest: {
      inverter: string;
      value: number;
    };
  };
}

interface TemperatureVsPower {
  graph_type: string;
  description: string;
  data: {
    timestamp: string;
    temperature: number;
    total_power: number;
  }[];
  time_slot_summary: Record<string, number>;
  expected_time: string;
  alert: string | null;
}

interface WindVsTemperature {
  graph_type: string;
  description: string;
  data: {
    timestamp: string;
    temperature: number;
    wind_speed: number;
  }[];
  expected_time: string;
  alert: string | null;
}

interface PowerAnomalies {
  graph_type: string;
  description: string;
  total_anomalies: number;
  anomalies: Record<string, any[]>;
}

interface EnergyByHour {
  graph_type: string;
  description: string;
  data: {
    hour: string;
    energy_generated: number;
  }[];
  expected_time: string;
  alert: string | null;
  time_slot_summary: Record<string, number>;
  extremes: {
    highest_hour: {
      hour: string;
      energy: number;
    };
    lowest_hour: {
      hour: string;
      energy: number;
    };
  };
}

// Interfaz para opciones de tema personalizado
interface ThemeOptions {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  paperColor: string;
  fontFamily: string;
  borderRadius: number;
  fontSize: number;
  darkMode?: boolean;
}

// Tema personalizado para el modal
const createModalTheme = (customOptions: ThemeOptions = {
  primaryColor: '#1976d2',
  secondaryColor: '#2e7d32',
  bgColor: '#f5f7fa',
  paperColor: '#ffffff',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  borderRadius: 8,
  fontSize: 14,
}) => {
  const {
    primaryColor,
    secondaryColor,
    bgColor,
    paperColor,
    fontFamily,
    borderRadius,
    fontSize,
  } = customOptions;

  return createTheme({
    palette: {
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        default: bgColor,
        paper: paperColor,
      },
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: fontSize,
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });
};

// Definiciones de fuentes disponibles
const availableFonts = [
  '"Roboto", "Helvetica", "Arial", sans-serif',
  '"Times New Roman", Times, serif',
  'Georgia, serif',
  '"Courier New", Courier, monospace',
  'Arial, sans-serif',
  '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
];

// Plantilla base para los reportes
const reportTemplates = {
  basic: {
    title: "Reporte de Minería de Datos",
    headerColor: "#1976d2",
    sections: [
      { title: "Resumen", type: "text" },
      { title: "Datos de Irradiancia", type: "data", key: "irradiance" },
      { title: "Datos de Voltaje", type: "data", key: "voltage" },
      { title: "Datos de Ambiente", type: "data", key: "environment" }
    ]
  },
  detailed: {
    title: "Análisis Detallado de Datos",
    headerColor: "#2e7d32",
    sections: [
      { title: "Resumen Ejecutivo", type: "text" },
      { title: "Análisis de Irradiancia", type: "data", key: "irradiance" },
      { title: "Análisis de Voltaje", type: "data", key: "voltage" },
      { title: "Análisis de Ambiente", type: "data", key: "environment" },
      { title: "Recomendaciones", type: "text" }
    ]
  }
};

// Datos simulados para pruebas
const sampleData = {
  irradiance: {
    labels: ["Ene", "Feb", "Mar", "Abr", "May"],
    values: [750, 800, 820, 780, 840],
    min: 750,
    max: 840,
    avg: 798,
    unit: "W/m²"
  },
  voltage: {
    labels: ["Ene", "Feb", "Mar", "Abr", "May"],
    values: [120, 122, 119, 121, 120],
    min: 119,
    max: 122,
    avg: 120.4,
    unit: "V"
  },
  environment: {
    temperature: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May"],
      values: [25, 27, 30, 28, 32],
      min: 25,
      max: 32,
      avg: 28.4,
      unit: "°C"
    },
    humidity: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May"],
      values: [45, 52, 48, 50, 55],
      min: 45,
      max: 55,
      avg: 50,
      unit: "%"
    }
  }
};

// Interfaces para el tipado
interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface Template {
  title: string;
  headerColor: string;
  sections: {
    title: string;
    type: string;
    key?: string;
  }[];
}

interface PdfItem {
  id: string;
  name: string;
  version: number;
  content: string;
  data: typeof sampleData;
  template: Template;
  createdAt: string;
}

// Extender la interfaz de jsPDF para incluir métodos que usa el código
declare module 'jspdf' {
  interface jsPDF {
    getNumberOfPages(): number;
    autoTable?: (options: any) => any;
  }
}

// Valores predeterminados para el tema
const defaultThemeSettings: ThemeOptions = {
  primaryColor: '#1976d2',
  secondaryColor: '#2e7d32',
  bgColor: '#f5f7fa',
  paperColor: '#ffffff',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  borderRadius: 8,
  fontSize: 14,
  darkMode: false
};

// Componente principal
const ReportModal: React.FC<ReportModalProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [pdfList, setPdfList] = useState<PdfItem[]>([]);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeText, setUpgradeText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(reportTemplates.basic);
  
  // Estados para personalización de temas
  const [themeSettings, setThemeSettings] = useState<ThemeOptions>(defaultThemeSettings);
  
  // Estado para controlar el panel de personalización
  const [customizeOpen, setCustomizeOpen] = useState<boolean>(false);
  
  // Estado para el diálogo de ayuda de formato
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  
  // Estados para los datos de los gráficos
  const [irradianceVsPowerData, setIrradianceVsPowerData] = useState<IrradianceVsPower | null>(null);
  const [voltageHistogramData, setVoltageHistogramData] = useState<HistogramData | null>(null);
  const [currentHistogramData, setCurrentHistogramData] = useState<HistogramData | null>(null);
  const [temperatureVsPowerData, setTemperatureVsPowerData] = useState<TemperatureVsPower | null>(null);
  const [windVsTemperatureData, setWindVsTemperatureData] = useState<WindVsTemperature | null>(null);
  const [powerAnomaliesData, setPowerAnomaliesData] = useState<PowerAnomalies | null>(null);
  const [energyByHourData, setEnergyByHourData] = useState<EnergyByHour | null>(null);
  
  // Estado para controlar errores de carga de datos
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Estado para mostrar panel de gráficos
  const [showGraphsPanel, setShowGraphsPanel] = useState<boolean>(false);
  
  // Crear tema basado en configuraciones
  const modalTheme = createModalTheme(themeSettings);
  
  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    // Cargar reportes generados
    const savedReports = localStorage.getItem('reports');
    if (savedReports) {
      setPdfList(JSON.parse(savedReports));
    }

    // Cargar configuración de tema personalizado
    const savedTheme = localStorage.getItem('theme-settings');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeSettings(parsedTheme);
      } catch (error) {
        console.error("Error al cargar configuración de tema:", error);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambia pdfList
  useEffect(() => {
    if (pdfList.length > 0) {
      localStorage.setItem('reports', JSON.stringify(pdfList));
    }
  }, [pdfList]);

  // Guardar configuración de tema cuando cambia
  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  // Función que simula un webhook para obtener datos en tiempo real
  const fetchDataFromWebhook = async () => {
    // En un caso real, esta función haría una petición a una API
    // Por ahora, simularemos con un timeout y datos de muestra
    return new Promise((resolve) => {
      setTimeout(() => {
        // Aquí se procesarían los datos del webhook
        resolve({
          success: true,
          data: sampleData,
          message: "Datos obtenidos correctamente"
        });
      }, 1500);
    });
  };

  // Analiza argumentos en el texto para personalizar el reporte
  const parseArguments = (text: string) => {
    const args: Record<string, any> = {};
    
    // Buscar parámetros en formato [clave:valor]
    const regex = /\[([^:]+):([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      args[key] = value;
      
      // Remover el argumento del texto original
      text = text.replace(match[0], '');
    }
    
    return { cleanText: text.trim(), args };
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTemplateChange = (template: 'basic' | 'detailed') => {
    setSelectedTemplate(reportTemplates[template]);
  };

  // Manejar cambios en los ajustes del tema
  const handleThemeChange = (property: keyof ThemeOptions, value: any) => {
    setThemeSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Aplicar tema personalizado a los PDF generados
  const applyCustomThemeToPDF = (doc: jsPDF) => {
    // Ajustar colores y estilos basado en themeSettings
    if (themeSettings.darkMode) {
      doc.setFillColor(themeSettings.secondaryColor);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(themeSettings.primaryColor);
      doc.setTextColor(255, 255, 255);
    }
    
    // Ajuste de fuente basado en la selección
    let fontName = 'helvetica';
    if (themeSettings.fontFamily.includes('Times')) {
      fontName = 'times';
    } else if (themeSettings.fontFamily.includes('Courier')) {
      fontName = 'courier';
    }
    
    doc.setFont(fontName);
    
    return doc;
  };

  // Función para generar canvas para cada gráfico
  const generateChartCanvases = async () => {
    if (!irradianceVsPowerData || !voltageHistogramData || !currentHistogramData || 
        !temperatureVsPowerData || !windVsTemperatureData || !energyByHourData) {
      return null;
    }
    
    // Crear elementos canvas para cada gráfico
    const canvasContainer = document.createElement('div');
    canvasContainer.style.position = 'absolute';
    canvasContainer.style.left = '-9999px';
    canvasContainer.style.width = '500px';
    canvasContainer.style.height = '300px';
    document.body.appendChild(canvasContainer);
    
    // Crear elementos de canvas para cada gráfico
    const irradianceVsPowerCanvas = document.createElement('canvas');
    irradianceVsPowerCanvas.width = 500;
    irradianceVsPowerCanvas.height = 300;
    canvasContainer.appendChild(irradianceVsPowerCanvas);
    
    const voltageHistogramCanvas = document.createElement('canvas');
    voltageHistogramCanvas.width = 500;
    voltageHistogramCanvas.height = 300;
    canvasContainer.appendChild(voltageHistogramCanvas);
    
    const currentHistogramCanvas = document.createElement('canvas');
    currentHistogramCanvas.width = 500;
    currentHistogramCanvas.height = 300;
    canvasContainer.appendChild(currentHistogramCanvas);
    
    const temperatureVsPowerCanvas = document.createElement('canvas');
    temperatureVsPowerCanvas.width = 500;
    temperatureVsPowerCanvas.height = 300;
    canvasContainer.appendChild(temperatureVsPowerCanvas);
    
    const windVsTemperatureCanvas = document.createElement('canvas');
    windVsTemperatureCanvas.width = 500;
    windVsTemperatureCanvas.height = 300;
    canvasContainer.appendChild(windVsTemperatureCanvas);
    
    const energyByHourCanvas = document.createElement('canvas');
    energyByHourCanvas.width = 500;
    energyByHourCanvas.height = 300;
    canvasContainer.appendChild(energyByHourCanvas);
    
    // Función para renderizar un gráfico en un canvas
    const renderChartToCanvas = (canvas: HTMLCanvasElement, chartType: string, data: any, options: any) => {
      return new Promise<void>((resolve) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve();
          return;
        }
        
        let chart: ChartJS;
        
        switch(chartType) {
          case 'scatter':
            chart = new ChartJS(ctx, {
              type: 'scatter',
              data,
              options
            });
            break;
          case 'bar':
            chart = new ChartJS(ctx, {
              type: 'bar',
              data,
              options
            });
            break;
          case 'line':
            chart = new ChartJS(ctx, {
              type: 'line',
              data,
              options
            });
            break;
          default:
            chart = new ChartJS(ctx, {
              type: 'bar',
              data,
              options
            });
        }
        
        // Esperar a que se renderice y resolver
        setTimeout(() => {
          resolve();
        }, 100);
      });
    };
    
    // Preparar datos para los gráficos
    const irradianceVsPowerChartData = {
      datasets: [
        {
          label: 'Irradiancia vs Potencia',
          data: irradianceVsPowerData.data.map(item => ({
            x: item.irradiance,
            y: item.total_power
          })),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: '#1976d2',
          borderWidth: 1,
          pointRadius: 3,
        }
      ]
    };
    
    // Filtrar bins con counts > 0 para el histograma de voltaje
    const nonZeroVoltageCountsIndices = voltageHistogramData.counts
      .map((count, index) => count > 0 ? index : -1)
      .filter(index => index !== -1);
    
    const voltageHistogramChartData = {
      labels: nonZeroVoltageCountsIndices.map(index => {
        const bin = voltageHistogramData.bins[index];
        const match = bin.match(/Bin \d+ \(([^-]+) - ([^)]+)\)/);
        if (match) {
          return `${parseFloat(match[1]).toFixed(1)}-${parseFloat(match[2]).toFixed(1)}`;
        }
        return bin;
      }),
      datasets: [
        {
          label: 'Voltaje (V)',
          data: nonZeroVoltageCountsIndices.map(index => voltageHistogramData.counts[index]),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: '#1976d2',
          borderWidth: 1,
        }
      ]
    };
    
    // Filtrar bins con counts > 0 para el histograma de corriente
    const nonZeroCurrentCountsIndices = currentHistogramData.counts
      .map((count, index) => count > 0 ? index : -1)
      .filter(index => index !== -1);
    
    const currentHistogramChartData = {
      labels: nonZeroCurrentCountsIndices.map(index => {
        const bin = currentHistogramData.bins[index];
        const match = bin.match(/Bin \d+ \(([^-]+) - ([^)]+)\)/);
        if (match) {
          return `${parseFloat(match[1]).toFixed(1)}-${parseFloat(match[2]).toFixed(1)}`;
        }
        return bin;
      }),
      datasets: [
        {
          label: 'Corriente (A)',
          data: nonZeroCurrentCountsIndices.map(index => currentHistogramData.counts[index]),
          backgroundColor: 'rgba(230, 81, 0, 0.6)',
          borderColor: '#e65100',
          borderWidth: 1,
        }
      ]
    };
    
    const temperatureVsPowerChartData = {
      datasets: [
        {
          label: 'Temperatura vs Potencia',
          data: temperatureVsPowerData.data.map(item => ({
            x: item.temperature,
            y: item.total_power
          })),
          backgroundColor: 'rgba(230, 81, 0, 0.6)',
          borderColor: '#e65100',
          borderWidth: 1,
          pointRadius: 3,
        }
      ]
    };
    
    const windVsTemperatureChartData = {
      labels: windVsTemperatureData.data.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: windVsTemperatureData.data.map(item => item.temperature),
          borderColor: '#e65100',
          backgroundColor: 'rgba(0, 0, 0, 0)',
        },
        {
          label: 'Velocidad del Viento (m/s)',
          data: windVsTemperatureData.data.map(item => item.wind_speed),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(0, 0, 0, 0)',
        }
      ]
    };
    
    const energyByHourChartData = {
      labels: energyByHourData.data.map(item => item.hour),
      datasets: [
        {
          label: 'Energía Generada',
          data: energyByHourData.data.map(item => item.energy_generated),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: '#1976d2',
          borderWidth: 1,
        }
      ]
    };
    
    // Opciones básicas para los gráficos en PDF
    const basicOptions = {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        }
      }
    };
    
    // Renderizar todos los gráficos en sus respectivos canvas
    await Promise.all([
      renderChartToCanvas(irradianceVsPowerCanvas, 'scatter', irradianceVsPowerChartData, basicOptions),
      renderChartToCanvas(voltageHistogramCanvas, 'bar', voltageHistogramChartData, basicOptions),
      renderChartToCanvas(currentHistogramCanvas, 'bar', currentHistogramChartData, basicOptions),
      renderChartToCanvas(temperatureVsPowerCanvas, 'scatter', temperatureVsPowerChartData, basicOptions),
      renderChartToCanvas(windVsTemperatureCanvas, 'line', windVsTemperatureChartData, basicOptions),
      renderChartToCanvas(energyByHourCanvas, 'bar', energyByHourChartData, basicOptions)
    ]);
    
    // Devolver los canvas
    return {
      irradianceVsPower: irradianceVsPowerCanvas,
      voltageHistogram: voltageHistogramCanvas,
      currentHistogram: currentHistogramCanvas,
      temperatureVsPower: temperatureVsPowerCanvas,
      windVsTemperature: windVsTemperatureCanvas,
      energyByHour: energyByHourCanvas,
      container: canvasContainer
    };
  };

  // Función para generar PDF con gráficos
  const generatePDFWithCharts = async (report: PdfItem) => {
    setLoading(true);
    
    try {
      // Verificar si tenemos datos para los gráficos
      if (!irradianceVsPowerData || !voltageHistogramData || !currentHistogramData || 
          !temperatureVsPowerData || !windVsTemperatureData || !energyByHourData) {
        // Si no hay datos, intentar obtenerlos
        await fetchGraphData();
      }
      
      // Generar canvas para los gráficos
      const chartCanvases = await generateChartCanvases();
      
      if (!chartCanvases) {
        console.error("No se pudieron generar los canvas para los gráficos");
        setDataError("No se pudieron generar los gráficos para el PDF. Intenta nuevamente.");
        setLoading(false);
        return;
      }
      
      // Crear nuevo PDF
      const doc = new jsPDF();
      
      // Aplicar tema personalizado
      applyCustomThemeToPDF(doc);
      
      // Extraer argumentos del texto si existen
      const { cleanText, args } = parseArguments(report.content);
      
      // Configurar ajustes basados en argumentos especiales
      let textSize = themeSettings.fontSize;
      let textColor = { r: 0, g: 0, b: 0 };
      const palabrasResaltadas: string[] = [];
      let formatoFecha = 'corto';
      
      // Procesar argumentos especiales
      if (args.texto_grande === 'true') {
        textSize += 4; // Aumentar tamaño del texto
      }
      
      if (args.color_texto && args.color_texto.startsWith('#')) {
        // Convertir hexadecimal a RGB
        const hex = args.color_texto.substring(1);
        textColor = {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
      }
      
      if (args.resaltar) {
        palabrasResaltadas.push(args.resaltar);
      }
      
      if (args.formato_fecha) {
        formatoFecha = args.formato_fecha;
      }
      
      // Aplicar diseño según plantilla y temas personalizados
      doc.setFillColor(themeSettings.darkMode ? themeSettings.secondaryColor : report.template.headerColor);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(textSize + 2); // Título ligeramente más grande
      doc.text(report.template.title, 105, 15, { align: "center" });
      
      // Formatear la fecha según el formato especificado
      const fechaActual = new Date();
      let fechaFormateada = fechaActual.toLocaleDateString();
      
      if (formatoFecha === 'largo') {
        fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Contenido principal
      doc.setTextColor(themeSettings.darkMode ? 255 : textColor.r, 
                      themeSettings.darkMode ? 255 : textColor.g, 
                      themeSettings.darkMode ? 255 : textColor.b);
      doc.setFontSize(textSize);
      
      let yPosition = 30;
      
      // Función para procesar texto resaltado
      const procesarTextoResaltado = (texto: string) => {
        // Si hay palabras a resaltar, implementar lógica aquí
        if (palabrasResaltadas.length > 0) {
          return texto; // Por ahora devolvemos el mismo texto
          // Nota: jsPDF tiene limitaciones para resaltar texto directamente
          // Una implementación completa requeriría dividir el texto y usar
          // configuraciones de color diferentes para partes específicas
        }
        return texto;
      };
      
      // Añadir resumen del reporte
      const textoResaltado = procesarTextoResaltado(cleanText);
      const splitText = doc.splitTextToSize(textoResaltado, 170);
      doc.text("Resumen del Reporte:", 20, yPosition);
      yPosition += 10;
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 6 + 15;
      
      // Añadir sección de gráficos
      doc.setFontSize(textSize + 2);
      doc.setTextColor(parseInt(themeSettings.primaryColor.slice(1, 3), 16), 
                     parseInt(themeSettings.primaryColor.slice(3, 5), 16), 
                     parseInt(themeSettings.primaryColor.slice(5, 7), 16));
      doc.text("Análisis Gráfico", 20, yPosition);
      yPosition += 10;
      
      // Resetear color del texto
      doc.setTextColor(themeSettings.darkMode ? 255 : textColor.r, 
                      themeSettings.darkMode ? 255 : textColor.g, 
                      themeSettings.darkMode ? 255 : textColor.b);
      doc.setFontSize(textSize);
      
      // Añadir gráficos de irradiancia vs potencia y temperatura vs potencia
      doc.text("Relación de Irradiancia y Temperatura con la Potencia", 20, yPosition);
      yPosition += 8;
      
      // Añadir gráfico de irradiancia vs potencia
      try {
        const irradianceVsPowerDataURL = chartCanvases.irradianceVsPower.toDataURL('image/png');
        doc.addImage(irradianceVsPowerDataURL, 'PNG', 20, yPosition, 80, 48);
        
        // Añadir gráfico de temperatura vs potencia a la derecha
        const temperatureVsPowerDataURL = chartCanvases.temperatureVsPower.toDataURL('image/png');
        doc.addImage(temperatureVsPowerDataURL, 'PNG', 110, yPosition, 80, 48);
        
        yPosition += 55;
      } catch (error) {
        console.error("Error al añadir gráficos de irradiancia y temperatura:", error);
        yPosition += 10;
      }
      
      // Si llegamos a la parte inferior de la página, añadir una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Añadir histogramas de voltaje y corriente
      doc.text("Distribución de Voltaje y Corriente", 20, yPosition);
      yPosition += 8;
      
      try {
        const voltageHistogramDataURL = chartCanvases.voltageHistogram.toDataURL('image/png');
        doc.addImage(voltageHistogramDataURL, 'PNG', 20, yPosition, 80, 48);
        
        const currentHistogramDataURL = chartCanvases.currentHistogram.toDataURL('image/png');
        doc.addImage(currentHistogramDataURL, 'PNG', 110, yPosition, 80, 48);
        
        yPosition += 55;
      } catch (error) {
        console.error("Error al añadir histogramas:", error);
        yPosition += 10;
      }
      
      // Si llegamos a la parte inferior de la página, añadir una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Añadir gráficos de viento vs temperatura y energía por hora
      doc.text("Viento vs Temperatura y Energía por Hora", 20, yPosition);
      yPosition += 8;
      
      try {
        const windVsTemperatureDataURL = chartCanvases.windVsTemperature.toDataURL('image/png');
        doc.addImage(windVsTemperatureDataURL, 'PNG', 20, yPosition, 80, 48);
        
        const energyByHourDataURL = chartCanvases.energyByHour.toDataURL('image/png');
        doc.addImage(energyByHourDataURL, 'PNG', 110, yPosition, 80, 48);
        
        yPosition += 55;
      } catch (error) {
        console.error("Error al añadir gráficos de viento y energía:", error);
        yPosition += 10;
      }
      
      // Si hay recomendaciones, añadirlas
      if (args.recomendaciones) {
        // Si llegamos a la parte inferior de la página, añadir una nueva página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(textSize + 2);
        doc.setTextColor(parseInt(themeSettings.primaryColor.slice(1, 3), 16), 
                       parseInt(themeSettings.primaryColor.slice(3, 5), 16), 
                       parseInt(themeSettings.primaryColor.slice(5, 7), 16));
        doc.text("Recomendaciones", 20, yPosition);
        yPosition += 10;
        
        doc.setTextColor(themeSettings.darkMode ? 255 : textColor.r, 
                        themeSettings.darkMode ? 255 : textColor.g, 
                        themeSettings.darkMode ? 255 : textColor.b);
        doc.setFontSize(textSize);
        
        const recomendaciones = procesarTextoResaltado(args.recomendaciones);
        const splitRecomendaciones = doc.splitTextToSize(recomendaciones, 170);
        doc.text(splitRecomendaciones, 20, yPosition);
        yPosition += splitRecomendaciones.length * 6 + 10;
      }
      
      // Añadir pie de página con la fecha formateada según la configuración
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(textSize - 6);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generado el ${fechaFormateada} - Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
      }
      
      // Eliminar el contenedor de canvas
      if (chartCanvases.container) {
        document.body.removeChild(chartCanvases.container);
      }
      
      // Guardar PDF
      doc.save(report.name);
      
    } catch (error) {
      console.error("Error al generar PDF con gráficos:", error);
      setDataError("Error al generar el PDF con gráficos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setReportText("Obteniendo datos para el reporte...");

    try {
      // Simular obtención de datos desde webhook
      const response: any = await fetchDataFromWebhook();
      
      if (response.success) {
        const reportData = response.data;
        
        // Generar texto de reporte
        const reportDate = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const report = `Reporte generado el ${reportDate}: Análisis de irradiancia (${reportData.irradiance.min}-${reportData.irradiance.max} ${reportData.irradiance.unit}), voltaje (${reportData.voltage.min}-${reportData.voltage.max} ${reportData.voltage.unit}) y condiciones ambientales (temperatura ${reportData.environment.temperature.avg}${reportData.environment.temperature.unit}).`;
        
        setReportText(report);
        
        // Crear ID único para el reporte
        const reportId = `report_${Date.now()}`;
        const pdfName = `Reporte_${pdfList.length + 1}.pdf`;
        
        // Crear nuevo reporte
        const newReport: PdfItem = {
          id: reportId,
          name: pdfName,
          version: 1,
          content: report,
          data: JSON.parse(JSON.stringify(reportData)),
          template: selectedTemplate,
          createdAt: new Date().toISOString()
        };
        
        // Generar PDF
        generatePDFWithCharts(newReport);
        
        // Actualizar lista de reportes
        setPdfList([...pdfList, newReport]);
      } else {
        setReportText("Error al obtener datos para el reporte");
      }
    } catch (error) {
      console.error("Error al generar reporte:", error);
      setReportText("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar la edición de un reporte
  const handleUpgrade = (reportId: string) => {
    const reportIndex = pdfList.findIndex(report => report.id === reportId);
    if (reportIndex !== -1) {
      setUpgrading(reportId);
      setUpgradeText(pdfList[reportIndex].content);
    }
  };

  // Función para aplicar la actualización de un reporte
  const handleUpgradeSubmit = async () => {
    if (!upgrading) return;
    
    const reportIndex = pdfList.findIndex(report => report.id === upgrading);
    if (reportIndex === -1) return;
    
    const report = pdfList[reportIndex];
    setLoading(true);
    
    try {
      // Extraer argumentos del texto actualizado
      const { cleanText, args } = parseArguments(upgradeText);
      
      // Actualizar el reporte
      const updatedReport: PdfItem = {
        ...report,
        content: upgradeText,
        version: report.version + 1,
      };
      
      // Actualizar la lista de reportes
      const updatedList = [...pdfList];
      updatedList[reportIndex] = updatedReport;
      setPdfList(updatedList);
      
      // Verificar si el nombre del reporte contiene "Grafico"
      if (report.name.includes("Grafico")) {
        // Si es reporte con gráficos, regenerar con gráficos
        await generatePDFWithCharts(updatedReport);
      } else {
        // Regenerar PDF normal
        generatePDF(updatedReport);
      }
      
      // Limpiar estado
      setUpgrading(null);
      setUpgradeText("");
    } catch (error) {
      console.error("Error al actualizar reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Restablecer tema a valores predeterminados
  const resetTheme = () => {
    setThemeSettings({...defaultThemeSettings});
  };

  // Función para obtener los datos de los endpoints
  const fetchGraphData = async () => {
    setDataError(null);
    setLoading(true);
    
    try {
      // URLs de los endpoints
      const endpoints = {
        irradianceVsPower: 'http://localhost:8000/irradiance-vs-power',
        voltageHistogram: 'http://localhost:8000/histogram/voltage',
        currentHistogram: 'http://localhost:8000/histogram/current',
        temperatureVsPower: 'http://localhost:8000/temperature-vs-power',
        windVsTemperature: 'http://localhost:8000/wind-vs-temperature',
        powerAnomalies: 'http://localhost:8000/power-anomalies',
        energyByHour: 'http://localhost:8000/energy-by-hour'
      };
      
      // Realizar peticiones en paralelo
      const [
        irradianceVsPowerResponse,
        voltageHistogramResponse,
        currentHistogramResponse,
        temperatureVsPowerResponse,
        windVsTemperatureResponse,
        powerAnomaliesResponse,
        energyByHourResponse
      ] = await Promise.all([
        axios.get(endpoints.irradianceVsPower),
        axios.get(endpoints.voltageHistogram),
        axios.get(endpoints.currentHistogram),
        axios.get(endpoints.temperatureVsPower),
        axios.get(endpoints.windVsTemperature),
        axios.get(endpoints.powerAnomalies),
        axios.get(endpoints.energyByHour)
      ]);
      
      // Almacenar los datos en el estado
      setIrradianceVsPowerData(irradianceVsPowerResponse.data);
      setVoltageHistogramData(voltageHistogramResponse.data);
      setCurrentHistogramData(currentHistogramResponse.data);
      setTemperatureVsPowerData(temperatureVsPowerResponse.data);
      setWindVsTemperatureData(windVsTemperatureResponse.data);
      setPowerAnomaliesData(powerAnomaliesResponse.data);
      setEnergyByHourData(energyByHourResponse.data);
      
      // Mostrar el panel de gráficos
      setShowGraphsPanel(true);
      
    } catch (error) {
      console.error("Error al obtener datos de gráficos:", error);
      setDataError("No se pudieron cargar los datos de los gráficos. Verifica que el servidor esté en funcionamiento.");
    } finally {
      setLoading(false);
    }
  };

  // Componente para renderizar gráficos de irradiancia vs potencia
  const IrradianceVsPowerChart = ({ data, darkMode, width = 500, height = 300 }: { data: IrradianceVsPower, darkMode: boolean, width?: number, height?: number }) => {
    const chartData = {
      datasets: [
        {
          label: 'Irradiancia vs Potencia',
          data: data.data.map(item => ({
            x: item.irradiance,
            y: item.total_power
          })),
          backgroundColor: darkMode ? 'rgba(46, 125, 50, 0.6)' : 'rgba(25, 118, 210, 0.6)',
          borderColor: darkMode ? '#2e7d32' : '#1976d2',
          borderWidth: 1,
          pointRadius: 3,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Irradiancia (W/m²)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Potencia (W)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: darkMode ? '#333333' : '#ffffff',
          titleColor: darkMode ? '#ffffff' : '#333333',
          bodyColor: darkMode ? '#ffffff' : '#333333',
          borderColor: darkMode ? '#555555' : '#dddddd',
          borderWidth: 1
        }
      }
    };

    return (
      <Box sx={{ width, height }}>
        <Scatter data={chartData} options={options as any} />
      </Box>
    );
  };

  // Componente para renderizar histograma
  const HistogramChart = ({ data, darkMode, width = 500, height = 300 }: { data: HistogramData, darkMode: boolean, width?: number, height?: number }) => {
    // Simplificar etiquetas para el histograma
    const simplifiedBins = data.bins.map(bin => {
      const match = bin.match(/Bin \d+ \(([^-]+) - ([^)]+)\)/);
      if (match) {
        return `${parseFloat(match[1]).toFixed(1)}-${parseFloat(match[2]).toFixed(1)}`;
      }
      return bin;
    });

    // Filtrar bins con counts > 0 y sus etiquetas correspondientes
    const nonZeroCounts = data.counts.filter(count => count > 0);
    const nonZeroBins = data.bins.filter((_, index) => data.counts[index] > 0)
      .map(bin => {
        const match = bin.match(/Bin \d+ \(([^-]+) - ([^)]+)\)/);
        if (match) {
          return `${parseFloat(match[1]).toFixed(1)}-${parseFloat(match[2]).toFixed(1)}`;
        }
        return bin;
      });

    const chartData = {
      labels: nonZeroBins,
      datasets: [
        {
          label: data.measurement_type === 'voltage' ? 'Voltaje (V)' : 'Corriente (A)',
          data: nonZeroCounts,
          backgroundColor: darkMode ? 'rgba(46, 125, 50, 0.6)' : 'rgba(25, 118, 210, 0.6)',
          borderColor: darkMode ? '#2e7d32' : '#1976d2',
          borderWidth: 1,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: data.measurement_type === 'voltage' ? 'Rango de Voltaje (V)' : 'Rango de Corriente (A)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Frecuencia',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    return (
      <Box sx={{ width, height }}>
        <Bar data={chartData} options={options as any} />
      </Box>
    );
  };

  // Componente para renderizar gráficos de temperatura vs potencia
  const TemperatureVsPowerChart = ({ data, darkMode, width = 500, height = 300 }: { data: TemperatureVsPower, darkMode: boolean, width?: number, height?: number }) => {
    const chartData = {
      datasets: [
        {
          label: 'Temperatura vs Potencia',
          data: data.data.map(item => ({
            x: item.temperature,
            y: item.total_power
          })),
          backgroundColor: darkMode ? 'rgba(230, 81, 0, 0.6)' : 'rgba(230, 81, 0, 0.6)',
          borderColor: darkMode ? '#e65100' : '#e65100',
          borderWidth: 1,
          pointRadius: 3,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Potencia (W)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    return (
      <Box sx={{ width, height }}>
        <Scatter data={chartData} options={options as any} />
      </Box>
    );
  };

  // Componente para renderizar gráficos de viento vs temperatura
  const WindVsTemperatureChart = ({ data, darkMode, width = 500, height = 300 }: { data: WindVsTemperature, darkMode: boolean, width?: number, height?: number }) => {
    const chartData = {
      labels: data.data.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: data.data.map(item => item.temperature),
          borderColor: darkMode ? '#e65100' : '#e65100',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          yAxisID: 'y',
        },
        {
          label: 'Velocidad del Viento (m/s)',
          data: data.data.map(item => item.wind_speed),
          borderColor: darkMode ? '#2e7d32' : '#1976d2',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          yAxisID: 'y1',
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Velocidad del Viento (m/s)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            drawOnChartArea: false,
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          },
        },
        x: {
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: darkMode ? '#ffffff' : '#666666'
          }
        }
      }
    };

    return (
      <Box sx={{ width, height }}>
        <Line data={chartData} options={options as any} />
      </Box>
    );
  };

  // Componente para renderizar gráficos de energía por hora
  const EnergyByHourChart = ({ data, darkMode, width = 500, height = 300 }: { data: EnergyByHour, darkMode: boolean, width?: number, height?: number }) => {
    const chartData = {
      labels: data.data.map(item => item.hour),
      datasets: [
        {
          label: 'Energía Generada',
          data: data.data.map(item => item.energy_generated),
          backgroundColor: darkMode ? 'rgba(46, 125, 50, 0.6)' : 'rgba(25, 118, 210, 0.6)',
          borderColor: darkMode ? '#2e7d32' : '#1976d2',
          borderWidth: 1,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Hora del Día',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Energía (kWh)',
            color: darkMode ? '#ffffff' : '#666666'
          },
          ticks: {
            color: darkMode ? '#ffffff' : '#666666'
          },
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    return (
      <Box sx={{ width, height }}>
        <Bar data={chartData} options={options as any} />
      </Box>
    );
  };

  return (
    <ThemeProvider theme={modalTheme}>
      <Modal 
        open={open} 
        onClose={onClose}
        aria-labelledby="report-modal-title"
      >
        <Paper 
          elevation={3}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: {xs: '90%', sm: '80%', md: '700px'},
            maxHeight: '85vh',
            overflow: 'auto',
            p: 3,
            bgcolor: themeSettings.darkMode ? '#2d2d2d' : 'background.paper',
            borderRadius: themeSettings.borderRadius,
            color: themeSettings.darkMode ? '#ffffff' : 'inherit',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" id="report-modal-title" gutterBottom className="text-black">
              Generador de Reportes Avanzado
            </Typography>
            
            <Box>
              <IconButton 
                color="primary" 
                onClick={() => setCustomizeOpen(!customizeOpen)}
                title="Personalizar tema"
              >
                <ColorLens />
              </IconButton>
              
              <IconButton 
                color="primary" 
                onClick={fetchGraphData}
                title="Cargar datos de gráficos"
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          {customizeOpen && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: themeSettings.darkMode ? '#3d3d3d' : '#f8f9fa',
                borderRadius: themeSettings.borderRadius - 2,
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                <ColorLens sx={{ mr: 1 }} /> Personalización de Tema
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Tipo de fuente</InputLabel>
                    <Select
                      value={themeSettings.fontFamily}
                      onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                      label="Tipo de fuente"
                    >
                      {availableFonts.map((font, index) => (
                        <MenuItem key={index} value={font} style={{ fontFamily: font }}>
                          {font.split(',')[0].replace(/['"]/g, '')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography id="font-size-slider" gutterBottom variant="caption">
                      <FormatSize fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Tamaño de texto: {themeSettings.fontSize}px
                    </Typography>
                    <Slider
                      value={themeSettings.fontSize}
                      onChange={(_, value) => handleThemeChange('fontSize', value)}
                      min={12}
                      max={20}
                      step={1}
                      aria-labelledby="font-size-slider"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography id="border-radius-slider" gutterBottom variant="caption">
                      Borde redondeado: {themeSettings.borderRadius}px
                    </Typography>
                    <Slider
                      value={themeSettings.borderRadius}
                      onChange={(_, value) => handleThemeChange('borderRadius', value)}
                      min={0}
                      max={16}
                      step={1}
                      aria-labelledby="border-radius-slider"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom variant="caption">Color primario</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: themeSettings.primaryColor,
                          mr: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                      <TextField
                        type="color"
                        value={themeSettings.primaryColor}
                        onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom variant="caption">Color secundario</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: themeSettings.secondaryColor,
                          mr: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                      <TextField
                        type="color"
                        value={themeSettings.secondaryColor}
                        onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom variant="caption">Color de fondo</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: themeSettings.bgColor,
                          mr: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                      <TextField
                        type="color"
                        value={themeSettings.bgColor}
                        onChange={(e) => handleThemeChange('bgColor', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={themeSettings.darkMode} 
                        onChange={(e) => handleThemeChange('darkMode', e.target.checked)}
                      />
                    }
                    label="Modo oscuro"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  size="small" 
                  color="error"
                  variant="outlined"
                  onClick={resetTheme}
                  sx={{ mr: 1 }}
                >
                  Restablecer
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setCustomizeOpen(false)}
                >
                  Cerrar
                </Button>
              </Box>
            </Paper>
          )}
          
          {showGraphsPanel && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: themeSettings.darkMode ? '#3d3d3d' : '#f8f9fa',
                borderRadius: themeSettings.borderRadius - 2,
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} /> 
                Datos de gráficos cargados correctamente
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Los siguientes gráficos se incluirán automáticamente en tu reporte PDF:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      Irradiancia vs Potencia
                    </Typography>
                  </Box>
                  {irradianceVsPowerData && (
                    <Paper sx={{ p: 1, height: '150px', bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff' }}>
                      <IrradianceVsPowerChart 
                        data={irradianceVsPowerData} 
                        darkMode={themeSettings.darkMode} 
                        width={250} 
                        height={130} 
                      />
                    </Paper>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      Temperatura vs Potencia
                    </Typography>
                  </Box>
                  {temperatureVsPowerData && (
                    <Paper sx={{ p: 1, height: '150px', bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff' }}>
                      <TemperatureVsPowerChart 
                        data={temperatureVsPowerData} 
                        darkMode={themeSettings.darkMode} 
                        width={250} 
                        height={130} 
                      />
                    </Paper>
                  )}
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => setShowGraphsPanel(false)}
                >
                  Cerrar
                </Button>
              </Box>
            </Paper>
          )}
          
          {dataError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dataError}
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Generar Reporte" icon={<CloudDownload />} iconPosition="start" />
            <Tab label="Mis Reportes" icon={<InsertDriveFile />} iconPosition="start" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: themeSettings.darkMode ? '#3d3d3d' : 'rgba(245, 247, 250, 0.5)' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Seleccionar plantilla:
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={selectedTemplate === reportTemplates.basic ? 3 : 1}
                      onClick={() => handleTemplateChange('basic')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedTemplate === reportTemplates.basic ? `2px solid ${themeSettings.primaryColor}` : 'none',
                        transition: 'all 0.2s',
                        '&:hover': { elevation: 3 },
                        bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff',
                        color: themeSettings.darkMode ? '#ffffff' : 'inherit',
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600} color="primary">
                        Plantilla Básica
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Formato estándar con secciones para resumen y datos principales.
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={selectedTemplate === reportTemplates.detailed ? 3 : 1}
                      onClick={() => handleTemplateChange('detailed')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedTemplate === reportTemplates.detailed ? `2px solid ${themeSettings.secondaryColor}` : 'none',
                        transition: 'all 0.2s',
                        '&:hover': { elevation: 3 },
                        bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff',
                        color: themeSettings.darkMode ? '#ffffff' : 'inherit',
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600} color="secondary">
                        Plantilla Detallada
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Formato extendido con análisis detallado y recomendaciones.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={generateReport} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
                  >
                    {loading ? "Generando Reporte..." : "Generar Reporte Básico"}
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    fullWidth
                    size="large"
                    onClick={async () => {
                      // Si no hay datos cargados, cargarlos primero
                      if (!irradianceVsPowerData) {
                        await fetchGraphData();
                      }
                      
                      // Si hay datos o se acaban de cargar, generar el reporte
                      if (irradianceVsPowerData) {
                        setLoading(true);
                        setReportText("Obteniendo datos para el reporte con gráficos...");
                        
                        try {
                          // Simular obtención de datos desde webhook
                          const response: any = await fetchDataFromWebhook();
                          
                          if (response.success) {
                            const reportData = response.data;
                            
                            // Generar texto de reporte
                            const reportDate = new Date().toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            
                            const report = `Reporte generado el ${reportDate}: Análisis de irradiancia (${reportData.irradiance.min}-${reportData.irradiance.max} ${reportData.irradiance.unit}), voltaje (${reportData.voltage.min}-${reportData.voltage.max} ${reportData.voltage.unit}) y condiciones ambientales (temperatura ${reportData.environment.temperature.avg}${reportData.environment.temperature.unit}). Incluye análisis gráfico de relaciones entre variables.`;
                            
                            setReportText(report);
                            
                            // Crear ID único para el reporte
                            const reportId = `report_${Date.now()}`;
                            const pdfName = `Reporte_Grafico_${pdfList.length + 1}.pdf`;
                            
                            // Crear nuevo reporte
                            const newReport: PdfItem = {
                              id: reportId,
                              name: pdfName,
                              version: 1,
                              content: report,
                              data: JSON.parse(JSON.stringify(reportData)),
                              template: selectedTemplate,
                              createdAt: new Date().toISOString()
                            };
                            
                            // Generar PDF con gráficos
                            await generatePDFWithCharts(newReport);
                            
                            // Actualizar lista de reportes
                            setPdfList([...pdfList, newReport]);
                          } else {
                            setReportText("Error al obtener datos para el reporte");
                          }
                        } catch (error) {
                          console.error("Error al generar reporte con gráficos:", error);
                          setReportText("Error al generar el reporte con gráficos");
                        } finally {
                          setLoading(false);
                        }
                      }
                    }} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShowChart />}
                  >
                    {loading ? "Generando..." : "Generar con Gráficos"}
                  </Button>
                </Grid>
              </Grid>
              
              {reportText && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: themeSettings.darkMode 
                      ? 'rgba(46, 125, 50, 0.1)' 
                      : 'rgba(25, 118, 210, 0.05)',
                    borderRadius: themeSettings.borderRadius - 2,
                  }}
                >
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Vista previa:
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{
                      fontFamily: themeSettings.fontFamily,
                      fontSize: themeSettings.fontSize / 16 + 'rem',
                    }}
                  >
                    {reportText}
                  </Typography>
                </Paper>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Puedes añadir argumentos especiales en formato [clave:valor] cuando edites un reporte para personalizar secciones específicas.
              </Typography>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              {pdfList.length === 0 ? (
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    bgcolor: themeSettings.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: themeSettings.borderRadius - 2,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No hay reportes generados aún. Crea tu primer reporte desde la pestaña "Generar Reporte".
                  </Typography>
                </Paper>
              ) : (
                <List sx={{ bgcolor: 'background.paper', borderRadius: themeSettings.borderRadius - 2 }}>
                  {pdfList.map((pdf, index) => (
                    <Paper
                      key={pdf.id} 
                      elevation={1}
                      sx={{ 
                        mb: 2, 
                        overflow: 'hidden',
                        bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff',
                        borderRadius: themeSettings.borderRadius - 2,
                      }}
                    >
                      <ListItem 
                        sx={{ 
                          borderLeft: `4px solid ${themeSettings.darkMode ? themeSettings.secondaryColor : pdf.template.headerColor}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight={600}
                              sx={{
                                fontFamily: themeSettings.fontFamily,
                              }}
                            >
                              {pdf.name}
                            </Typography>
                            <Chip 
                              label={`v${pdf.version}`} 
                              size="small" 
                              color={pdf.version > 1 ? "secondary" : "primary"}
                              variant={pdf.version > 1 ? "filled" : "outlined"}
                            />
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 0.5,
                              fontFamily: themeSettings.fontFamily,
                              fontSize: (themeSettings.fontSize - 2) / 16 + 'rem',
                            }}
                          >
                            {pdf.content.substring(0, 80)}...
                          </Typography>
                          
                          <Box sx={{ display: 'flex', mt: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Creado: {formatDate(pdf.createdAt)}
                            </Typography>
                            
                            <Box sx={{ ml: 'auto', display: 'flex' }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  // Verificar si el nombre del reporte contiene "Grafico"
                                  if (pdf.name.includes("Grafico")) {
                                    // Si es reporte con gráficos
                                    generatePDFWithCharts(pdf);
                                  } else {
                                    // Generar PDF normal
                                    generatePDF(pdf);
                                  }
                                }}
                                sx={{ mr: 1 }}
                              >
                                <CloudDownload fontSize="small" />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleUpgrade(pdf.id)}
                              >
                                <ArrowUpward fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          )}
          
          {upgrading !== null && (
            <Box sx={{ mt: 3 }}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2,
                  bgcolor: themeSettings.darkMode ? '#3d3d3d' : '#ffffff',
                  borderRadius: themeSettings.borderRadius - 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600} 
                    sx={{ fontFamily: themeSettings.fontFamily }}
                  >
                    Editar Reporte
                  </Typography>

                  <Tooltip title="Ver ejemplos de comandos de formato">
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={() => setHelpDialogOpen(true)}
                      sx={{ ml: 1 }}
                    >
                      <HelpOutline />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  paragraph
                  sx={{ fontFamily: themeSettings.fontFamily, display: 'flex', alignItems: 'center' }}
                >
                  <Info fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  Puedes incluir comandos especiales usando el formato [clave:valor].
                  <Button 
                    size="small" 
                    color="primary" 
                    variant="text" 
                    onClick={() => setHelpDialogOpen(true)}
                    sx={{ ml: 1, minWidth: 'auto', p: '2px 5px' }}
                  >
                    Ver ejemplos
                  </Button>
                </Typography>
                
                <TextField
                  label="Personalizar reporte"
                  fullWidth
                  multiline
                  rows={4}
                  value={upgradeText}
                  onChange={(e) => setUpgradeText(e.target.value)}
                  sx={{ 
                    mb: 2,
                    '& .MuiInputBase-root': {
                      fontFamily: themeSettings.fontFamily,
                      fontSize: themeSettings.fontSize / 16 + 'rem',
                    }
                  }}
                  variant="outlined"
                  InputProps={{
                    style: { 
                      backgroundColor: themeSettings.darkMode ? 'rgba(255,255,255,0.05)' : undefined,
                      color: themeSettings.darkMode ? '#fff' : undefined
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={() => setUpgrading(null)} 
                    sx={{ mr: 1 }}
                  >
                    Cancelar
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      if (!upgrading) return;
                      
                      const reportIndex = pdfList.findIndex(report => report.id === upgrading);
                      if (reportIndex === -1) return;
                      
                      const report = pdfList[reportIndex];
                      setLoading(true);
                      
                      try {
                        // Extraer argumentos del texto actualizado
                        const { cleanText, args } = parseArguments(upgradeText);
                        
                        // Actualizar el reporte
                        const updatedReport: PdfItem = {
                          ...report,
                          content: upgradeText,
                          version: report.version + 1,
                        };
                        
                        // Actualizar la lista de reportes
                        const updatedList = [...pdfList];
                        updatedList[reportIndex] = updatedReport;
                        setPdfList(updatedList);
                        
                        // Verificar si el nombre del reporte contiene "Grafico"
                        if (report.name.includes("Grafico")) {
                          // Si es reporte con gráficos, regenerar con gráficos
                          await generatePDFWithCharts(updatedReport);
                        } else {
                          // Regenerar PDF normal
                          generatePDF(updatedReport);
                        }
                        
                        // Limpiar estado
                        setUpgrading(null);
                        setUpgradeText("");
                      } catch (error) {
                        console.error("Error al actualizar reporte:", error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    variant="contained" 
                    color="secondary"
                    startIcon={<ArrowUpward />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Actualizar y Generar"}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>
      </Modal>
      
      {/* Diálogo de ayuda con ejemplos de formato */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontFamily: themeSettings.fontFamily,
          bgcolor: themeSettings.darkMode ? '#3d3d3d' : '#f5f7fa',
          color: themeSettings.darkMode ? '#ffffff' : 'inherit',
        }}>
          <Info color="primary" sx={{ mr: 1 }} /> 
          Guía para personalizar texto en reportes
        </DialogTitle>
        
        <DialogContent sx={{ 
          bgcolor: themeSettings.darkMode ? '#2d2d2d' : '#ffffff',
          color: themeSettings.darkMode ? '#ffffff' : 'inherit',
          p: 3
        }}>
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Utiliza comandos especiales en formato [clave:valor] para personalizar tus reportes:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography fontFamily={themeSettings.fontFamily}>
                <strong>[texto_grande:true]</strong> - Aumenta el tamaño del texto principal
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 1 }}>
              <Typography fontFamily={themeSettings.fontFamily}>
                <strong>[color_texto:#FF5733]</strong> - Cambia el color del texto (utiliza código hexadecimal)
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 1 }}>
              <Typography fontFamily={themeSettings.fontFamily}>
                <strong>[recomendaciones:Texto de recomendaciones específicas que aparecerán en esa sección]</strong> - Añade contenido a la sección de recomendaciones
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 1 }}>
              <Typography fontFamily={themeSettings.fontFamily}>
                <strong>[resaltar:voltaje]</strong> - Resalta todas las menciones de "voltaje" en el documento
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 1 }}>
              <Typography fontFamily={themeSettings.fontFamily}>
                <strong>[formato_fecha:largo]</strong> - Cambia el formato de fechas a versión completa
              </Typography>
            </Box>
          </Box>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mt: 2, 
              bgcolor: themeSettings.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(25, 118, 210, 0.05)',
              borderRadius: themeSettings.borderRadius - 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom color="primary">
              Ejemplo completo:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                p: 1
              }}
            >
              Reporte generado el 15 de mayo: Análisis de irradiancia (750-840 W/m²), voltaje (119-122 V) y condiciones ambientales (temperatura 28.4°C).
              [texto_grande:true]
              [color_texto:#2E7D32]
              [recomendaciones:Revisar niveles de voltaje semanalmente. Limpiar paneles solares cada 15 días para mantener eficiencia óptima.]
              [resaltar:irradiancia]
              [formato_fecha:largo]
            </Typography>
          </Paper>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Estos comandos se procesarán al generar el PDF y no aparecerán en el documento final.
            Pueden combinarse varios comandos en el mismo texto.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          bgcolor: themeSettings.darkMode ? '#3d3d3d' : '#f5f7fa',
          p: 2 
        }}>
          <Button 
            onClick={() => {
              // Añadir ejemplo al texto actual
              setUpgradeText(prev => {
                const ejemplo = "[texto_grande:true]\n[color_texto:#2E7D32]\n[recomendaciones:Añade aquí tus recomendaciones específicas]";
                return prev ? `${prev}\n${ejemplo}` : ejemplo;
              });
              setHelpDialogOpen(false);
            }}
            variant="outlined"
            startIcon={<CloudDownload />}
            sx={{ mr: 1 }}
          >
            Insertar Ejemplo
          </Button>
          <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default ReportModal;