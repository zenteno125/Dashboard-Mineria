import React, { useState, useEffect } from "react";
import { 
  Modal, Button, CircularProgress, List, ListItem, ListItemText,
  IconButton, TextField, Typography, Box, Paper, Divider, Chip, 
  ThemeProvider, createTheme, useTheme, Grid, Tabs, Tab
} from "@mui/material";
import { 
  ArrowUpward, BarChart, InsertDriveFile, CloudDownload, 
  WbSunny, BatteryChargingFull, Thermostat 
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Tema personalizado para el modal
const modalTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2e7d32',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

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

// Componente principal
const ReportModal: React.FC<ReportModalProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [pdfList, setPdfList] = useState<PdfItem[]>([]);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeText, setUpgradeText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(reportTemplates.basic);
  
  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const savedReports = localStorage.getItem('reports');
    if (savedReports) {
      setPdfList(JSON.parse(savedReports));
    }
  }, []);

  // Guardar en localStorage cuando cambia pdfList
  useEffect(() => {
    if (pdfList.length > 0) {
      localStorage.setItem('reports', JSON.stringify(pdfList));
    }
  }, [pdfList]);

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
        generatePDF(newReport);
        
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

  const generatePDF = (report: PdfItem) => {
    const doc = new jsPDF();
    
    // Aplicar diseño según plantilla
    doc.setFillColor(report.template.headerColor);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(report.template.title, 105, 15, { align: "center" });
    
    // Extraer argumentos del texto si existen
    const { cleanText, args } = parseArguments(report.content);
    
    // Contenido principal
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    let yPosition = 30;
    
    // Aplicar secciones según la plantilla
    report.template.sections.forEach(section => {
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text(section.title, 20, yPosition);
      yPosition += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      if (section.type === "text") {
        // Para secciones de texto
        if (section.title === "Resumen" || section.title === "Resumen Ejecutivo") {
          const splitText = doc.splitTextToSize(cleanText, 170);
          doc.text(splitText, 20, yPosition);
          yPosition += splitText.length * 6 + 10;
        } else if (section.title === "Recomendaciones" && args.recomendaciones) {
          const recomendaciones = doc.splitTextToSize(args.recomendaciones, 170);
          doc.text(recomendaciones, 20, yPosition);
          yPosition += recomendaciones.length * 6 + 10;
        }
      } else if (section.type === "data" && section.key) {
        // Para secciones de datos
        const keyPath = section.key.split('.');
        let sectionData: any = report.data;
        
        // Acceder a los datos según la ruta de la clave
        for (const key of keyPath) {
          if (sectionData && key in sectionData) {
            sectionData = sectionData[key];
          }
        }
        
        // Verificar si tenemos datos para esta sección
        if (sectionData) {
          if (section.key === "environment") {
            // Caso especial para datos de ambiente que tienen subgrupos
            Object.entries(sectionData).forEach(([subKey, subData]: [string, any]) => {
              doc.setFontSize(12);
              doc.text(`${subKey.charAt(0).toUpperCase() + subKey.slice(1)}:`, 25, yPosition);
              yPosition += 6;
              
              doc.setFontSize(10);
              doc.text(`Mín: ${subData.min}${subData.unit} | Máx: ${subData.max}${subData.unit} | Promedio: ${subData.avg}${subData.unit}`, 30, yPosition);
              yPosition += 10;
            });
          } else {
            // Para datos simples
            doc.text(`Mín: ${sectionData.min}${sectionData.unit} | Máx: ${sectionData.max}${sectionData.unit} | Promedio: ${sectionData.avg}${sectionData.unit}`, 25, yPosition);
            yPosition += 15;
          }
        }
      }
    });
    
    // Añadir pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleDateString()} - Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
    }
    
    // Guardar PDF
    doc.save(report.name);
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
      
      // Regenerar el PDF
      generatePDF(updatedReport);
      
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
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h2" id="report-modal-title" gutterBottom>
            Generador de Reportes Avanzado
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Generar Reporte" icon={<CloudDownload />} iconPosition="start" />
            <Tab label="Mis Reportes" icon={<InsertDriveFile />} iconPosition="start" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
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
                        border: selectedTemplate === reportTemplates.basic ? '2px solid #1976d2' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': { elevation: 3 }
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
                        border: selectedTemplate === reportTemplates.detailed ? '2px solid #2e7d32' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': { elevation: 3 }
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
              
              <Button 
                variant="contained" 
                color="primary"
                fullWidth
                size="large"
                onClick={generateReport} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
                sx={{ mb: 3 }}
              >
                {loading ? "Generando Reporte..." : "Generar Nuevo Reporte"}
              </Button>
              
              {reportText && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Vista previa:
                  </Typography>
                  <Typography variant="body1">
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
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay reportes generados aún. Crea tu primer reporte desde la pestaña "Generar Reporte".
                  </Typography>
                </Paper>
              ) : (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {pdfList.map((pdf, index) => (
                    <Paper
                      key={pdf.id} 
                      elevation={1}
                      sx={{ mb: 2, overflow: 'hidden' }}
                    >
                      <ListItem 
                        sx={{ 
                          borderLeft: `4px solid ${pdf.template.headerColor}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {pdf.name}
                            </Typography>
                            <Chip 
                              label={`v${pdf.version}`} 
                              size="small" 
                              color={pdf.version > 1 ? "secondary" : "primary"}
                              variant={pdf.version > 1 ? "filled" : "outlined"}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
                                  // Simular descarga del PDF existente
                                  generatePDF(pdf);
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
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Editar Reporte
                </Typography>
                
                <Typography variant="caption" color="text.secondary" paragraph>
                  Puedes incluir argumentos especiales usando el formato [clave:valor].
                  Por ejemplo: [recomendaciones:Revisar niveles de voltaje periódicamente]
                </Typography>
                
                <TextField
                  label="Personalizar reporte"
                  fullWidth
                  multiline
                  rows={4}
                  value={upgradeText}
                  onChange={(e) => setUpgradeText(e.target.value)}
                  sx={{ mb: 2 }}
                  variant="outlined"
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={() => setUpgrading(null)} 
                    sx={{ mr: 1 }}
                  >
                    Cancelar
                  </Button>
                  
                  <Button 
                    onClick={handleUpgradeSubmit} 
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
    </ThemeProvider>
  );
};

export default ReportModal;