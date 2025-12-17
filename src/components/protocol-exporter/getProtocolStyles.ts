type StyleOptions = {
  includePrintButton?: boolean;
};

export const getProtocolStyles = ({ includePrintButton = false }: StyleOptions = {}): string => {
  return `
    @media print {
      body { margin: 0; padding: 20px; }
      ${includePrintButton ? '.no-print { display: none; }' : ''}
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #1f2937;
    }
    .header {
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .header-logo {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
    }
    .header-info {
      flex: 1;
    }
    .header h1 {
      margin: 0 0 5px 0;
      color: #0ea5e9;
      font-size: 24px;
    }
    .clinic-info {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: 600;
      width: 180px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #0ea5e9;
      color: white;
      padding: 10px;
      text-align: left;
      border: 1px solid #0ea5e9;
    }
    .conclusion {
      background-color: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 15px;
      margin-bottom: 40px;
    }
    .conclusion h3 {
      margin-top: 0;
      color: #0ea5e9;
    }
    .signature {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-line {
      border-bottom: 1px solid #000;
      width: 200px;
      padding-top: 40px;
    }
    .signature-image {
      max-width: 150px;
      max-height: 60px;
    }
    ${includePrintButton ? `
    .print-button {
      background-color: #0ea5e9;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .print-button:hover {
      background-color: #0284c7;
    }
    ` : ''}
  `;
};
