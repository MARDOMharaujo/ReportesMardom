const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

const ADMIN_CODE = 'Haraujo1324';

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Endpoint para obtener códigos
app.get('/api/codes', (req, res) => {
  const p = path.join(__dirname, 'dept_codes.json');
  if (fs.existsSync(p)) {
    try {
      const data = fs.readFileSync(p, 'utf8');
      return res.json(JSON.parse(data));
    } catch (e) {
      return res.status(500).json({ error: 'read_error' });
    }
  }
  return res.json({});
});

// Endpoint para publicar/actualizar códigos (protegido por ADMIN_CODE)
app.post('/api/codes', (req, res) => {
  const { codes, admin } = req.body || {};
  if (admin !== ADMIN_CODE) return res.status(401).json({ error: 'unauthorized' });
  if (!codes || typeof codes !== 'object') return res.status(400).json({ error: 'invalid_payload' });
  const p = path.join(__dirname, 'dept_codes.json');
  try {
    fs.writeFileSync(p, JSON.stringify(codes, null, 2), 'utf8');
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'write_error', message: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
