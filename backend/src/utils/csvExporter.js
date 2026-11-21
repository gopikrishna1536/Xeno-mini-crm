/**
 * RFC-4180 Compliant CSV Exporter with Formula Injection (CSV Injection) Protection.
 */

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitizes a field against CSV formula injection (DDE attacks).
 * If a value starts with =, +, -, @, prepend a single quote (').
 */
function sanitizeCellValue(val) {
    if (val === null || val === undefined) return '';
    let str = String(val);

    // If starting with formula trigger chars, escape with leading single-quote
    if (str.length > 0 && DANGEROUS_PREFIXES.includes(str[0])) {
        str = "'" + str;
    }
    return str;
}

/**
 * Formats a single field according to RFC-4180 escaping rules.
 */
function formatCell(val) {
    const sanitized = sanitizeCellValue(val);
    const needsQuotes = /[",\r\n]/.test(sanitized);

    if (needsQuotes) {
        return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
}

/**
 * Generates an RFC-4180 compliant CSV string from an array of records and column definitions.
 * @param {Array<Object>} records - The records to export.
 * @param {Array<{ key: string, label: string }>} columns - Column mappings.
 * @returns {string} The CSV formatted output.
 */
function exportToCsv(records, columns) {
    if (!Array.isArray(records) || !Array.isArray(columns) || columns.length === 0) {
        return '';
    }

    const headerRow = columns.map(col => formatCell(col.label)).join(',');
    const dataRows = records.map(record => {
        return columns.map(col => formatCell(record[col.key])).join(',');
    });

    return [headerRow, ...dataRows].join('\r\n');
}

module.exports = {
    exportToCsv,
    sanitizeCellValue,
    formatCell
};
