import React, { useState } from "react";
import { Modal, Button, CircularProgress, List, ListItem, ListItemText, IconButton, TextField, Typography } from "@mui/material";
import { ArrowUpward } from "@mui/icons-material";
import { jsPDF } from "jspdf";

const ReportModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [pdfList, setPdfList] = useState<{ name: string; version: number; content: string }[]>([]);
  const [upgrading, setUpgrading] = useState(null);
  const [upgradeText, setUpgradeText] = useState("");

  const generateReport = async () => {
    setLoading(true);
    setReportText("Generando reporte...");

    setTimeout(() => {
      const report = `Reporte generado: Datos analizados correctamente.`;
      setReportText(report);

      const doc = new jsPDF();
      doc.text(report, 10, 10);
      const pdfName = `Reporte_${pdfList.length + 1}.pdf`;
      doc.save(pdfName);

      setPdfList([...pdfList, { name: pdfName, version: 1, content: report }]);
      setLoading(false);
    }, 2000);
  };

  const handleUpgrade = (index) => {
    setUpgrading(index);
    setUpgradeText(pdfList[index].content);
  };

  const handleUpgradeSubmit = async () => {
    const pdf = pdfList[upgrading];

    setTimeout(() => {
      const improvedReport = `${pdf.content} (Mejorado con más detalles)`;
      const updatedPdf = [...pdfList];
      updatedPdf[upgrading] = { ...pdf, content: improvedReport, version: pdf.version + 1 };
      setPdfList(updatedPdf);

      const doc = new jsPDF();
      doc.text(improvedReport, 10, 10);
      doc.save(`Reporte_${pdf.name.split("_")[1].replace(".pdf", "")}_v${pdf.version + 1}.pdf`);

      setUpgrading(null);
      setUpgradeText("");
    }, 2000);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-black" style={{ padding: "20px", backgroundColor: "#fff", width: "500px", margin: "50px auto", borderRadius: "8px" }}>
        <Typography variant="h6">Generador de Reportes</Typography>

        <Button variant="contained" onClick={generateReport} disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : "Generar Reporte"}
        </Button>

        <List>
          {pdfList.map((pdf, index) => (
            <ListItem key={index} style={{ marginTop: "10px" }}>
              <ListItemText primary={pdf.name} secondary={`Versión: ${pdf.version}`} />
              <IconButton onClick={() => handleUpgrade(index)}>
                <ArrowUpward />
              </IconButton>
            </ListItem>
          ))}
        </List>

        {upgrading !== null && (
          <div>
            <TextField
              label="Reescribir el reporte"
              fullWidth
              multiline
              rows={4}
              value={upgradeText}
              onChange={(e) => setUpgradeText(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            <Button onClick={handleUpgradeSubmit} variant="contained" color="primary">
              Mejorar Reporte
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReportModal;
