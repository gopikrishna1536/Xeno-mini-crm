const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { exportToCsv, sanitizeCellValue, formatCell } = require('../src/utils/csvExporter');

describe('CSV Exporter & Formula Injection Protection Tests', () => {
    test('should escape dangerous formula injection characters at the start of a cell', () => {
        assert.equal(sanitizeCellValue('=SUM(1,2)'), "'=SUM(1,2)");
        assert.equal(sanitizeCellValue('+cmd|"/C calc"!A0'), "'+cmd|\"/C calc\"!A0");
        assert.equal(sanitizeCellValue('-5+2'), "'-5+2");
        assert.equal(sanitizeCellValue('@HYPERLINK("http://evil.com")'), "'@HYPERLINK(\"http://evil.com\")");
    });

    test('should allow benign text without alteration', () => {
        assert.equal(sanitizeCellValue('Gopi Krishna'), 'Gopi Krishna');
        assert.equal(sanitizeCellValue('150.75'), '150.75');
        assert.equal(sanitizeCellValue(null), '');
        assert.equal(sanitizeCellValue(undefined), '');
    });

    test('should properly quote fields containing commas, quotes, and newlines', () => {
        assert.equal(formatCell('Bangalore, Karnataka'), '"Bangalore, Karnataka"');
        assert.equal(formatCell('He said "Hello"'), '"He said ""Hello"""');
        assert.equal(formatCell("Line 1\nLine 2"), '"Line 1\nLine 2"');
    });

    test('should generate RFC-4180 compliant CSV document from customer records', () => {
        const columns = [
            { key: 'id', label: 'Customer ID' },
            { key: 'name', label: 'Full Name' },
            { key: 'city', label: 'City' },
            { key: 'spend', label: 'Total Spend' }
        ];

        const customers = [
            { id: 1, name: 'John Doe', city: 'Mumbai', spend: 1250 },
            { id: 2, name: 'Alice, "The VIP"', city: 'Bangalore, KA', spend: 3500 },
            { id: 3, name: '=1+1', city: 'Delhi', spend: 400 }
        ];

        const csv = exportToCsv(customers, columns);
        const rows = csv.split('\r\n');

        assert.equal(rows.length, 4);
        assert.equal(rows[0], 'Customer ID,Full Name,City,Total Spend');
        assert.equal(rows[1], '1,John Doe,Mumbai,1250');
        assert.equal(rows[2], '2,"Alice, ""The VIP""","Bangalore, KA",3500');
        assert.equal(rows[3], "3,'=1+1,Delhi,400");
    });
});
