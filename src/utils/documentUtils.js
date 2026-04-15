
/**
 * Calculates values for a document row (Preventivo, Ordine, Fattura, etc.)
 * @param {Object} row - The row object
 * @param {Array} aliquoteIva - List of available VAT rates
 * @returns {Object} { netPrice, imponibile, total, iva }
 */
export const getRowValues = (row, aliquoteIva = []) => {
    if (row.tipo === 'N') return { netPrice: 0, imponibile: 0, total: 0, iva: 0 };

    const qty = parseFloat(row.quantita) || 0;
    const price = parseFloat(row.prezzo) || 0;
    const discountStr = row.sconto ? String(row.sconto) : '';

    let netPrice = price;
    if (discountStr) {
        const trimmed = discountStr.trim();
        // Handle multi-discount "10+5+2"
        if (trimmed.includes('+')) {
            const tokens = trimmed.split('+');
            tokens.forEach(t => {
                const perc = parseFloat(t.trim().replace('%', '').replace(',', '.')) || 0;
                netPrice = netPrice * (1 - perc / 100);
            });
        } else {
            // Handle single discount "10" or "10%" or value
            if (trimmed.endsWith('%')) {
                const perc = parseFloat(trimmed.replace('%', '').replace(',', '.')) || 0;
                netPrice = price * (1 - perc / 100);
            } else {
                // Try to parse as percentage if it's just a number, or value?
                // Legacy logic in Preventivi seemed to treat "value" as subtraction if not %?
                // "netPrice = price - val"
                // But usually simple numbers in discount field mean percentage in Italian ERPs.
                // Let's stick to Preventivi logic:
                // if (trimmed.endsWith('%')) ... else netPrice = price - val
                // WAIT: PreventiviDetail.jsx logic:
                /*
                if (trimmed.endsWith('%')) {
                    const perc = parseFloat(trimmed.replace('%', '')) || 0;
                    netPrice = price * (1 - perc / 100);
                } else {
                    const val = parseFloat(trimmed) || 0;
                    netPrice = price - val;
                }
                */
                // ConfOrdine logic was simple % subtract.
                // We will use the Preventivi logic as it is the "reference".
                // However, treating simple number as CURRENCY subtraction is rare. usually it is %.
                // But I will stick to the code I saw in PreventiviDetail.jsx.

                // Re-reading PreventiviDetail.jsx snippet from memory/cache:
                // "const val = parseFloat(trimmed) || 0; netPrice = price - val;"
                // This implies a fixed amount discount.

                const val = parseFloat(trimmed.replace(',', '.')) || 0;
                // If value is < 1 (e.g. 0.10) it might be ambiguous, but let's assume strict subtraction per legacy code.
                netPrice = price - val;
            }
        }
    }

    const rowImponibile = qty * netPrice;
    const aliquota = (aliquoteIva || []).find(a => a.id === parseInt(row.idAliquotaIva));
    const impostaPerc = aliquota ? (aliquota.imposta || 0) : 0;
    const rowTotal = rowImponibile * (1 + impostaPerc / 100);

    return {
        netPrice,
        imponibile: rowImponibile,
        total: rowTotal,
        iva: rowTotal - rowImponibile
    };
};

export const calculateRowTotal = (row, aliquoteIva = []) => {
    return getRowValues(row, aliquoteIva).total;
};

/**
 * Formats the document status string returned by the get_descrizione_doccollegato SQL function.
 * Format: "Descrizione 1---ID1---TIPO1,Descrizione 2---ID2---TIPO2"
 * @param {string} statusStr - The raw status string from database
 * @returns {string|Array} - Formatted string (with \n for multiline) or empty string
 */
export const formatStato = (statusStr) => {
    if (!statusStr || typeof statusStr !== 'string' || statusStr.trim() === '') {
        return '';
    }

    const array = statusStr.split(",");
    const formattedElements = array.map(item => {
        const parts = item.split('---');
        return parts[0].replace('&&&', '').trim();
    }).filter(desc => desc !== '');

    return formattedElements.join('\n');
};

/**
 * Formats TipoFattura enum values for display
 * @param {string} tipo - The TipoFattura enum value
 * @returns {string} - Formatted label
 */
export const formatTipoFattura = (tipo) => {
    if (!tipo) return '';
    const map = {
        'FATTURA': 'Fattura',
        'FATTURA_ACCOMPAGNATORIA': 'Accompagnatoria',
        'FATTURA_ACCONTO': 'Acconto',
        'FATTURA_PROFORMA': 'Pro Forma',
        'NOTA_DEBITO': 'Nota di Debito',
        'FATTURA_SEMPLIFICATA': 'Semplificata (TD07)'
    };
    return map[tipo] || tipo.replace(/_/g, ' ');
};
