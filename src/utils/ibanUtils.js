export const validateIban = (iban) => {
    if (!iban) return false;

    // Remove spaces and uppercase
    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Check length (min 15, max 34 per ISO 13616)
    if (cleanIban.length < 15 || cleanIban.length > 34) return false;

    // Move first 4 chars to the end
    const reordered = cleanIban.slice(4) + cleanIban.slice(0, 4);

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    const numeric = reordered.replace(/[A-Z]/g, char => char.charCodeAt(0) - 55);

    // Calculate mod 97 (using BigInt for safety with large numbers)
    try {
        return BigInt(numeric) % 97n === 1n;
    } catch (e) {
        return false; // Fallback if BigInt is not supported (unlikely in modern browsers)
    }
};

export const parseIban = (iban) => {
    if (!iban) return null;

    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const country = cleanIban.slice(0, 2);

    // Basic structure for any IBAN
    const result = {
        country: country,
        check: cleanIban.slice(2, 4),
        cin: '',
        abi: '',
        cab: '',
        conto: '',
        isValid: validateIban(cleanIban)
    };

    // Specific parsing for Italian IBANs (IT, 27 chars)
    // Format: IT kk x aaaa bbbb cccccccccccc
    // IT (2) + Check (2) + CIN (1) + ABI (5) + CAB (5) + Conto (12)
    if (country === 'IT' && cleanIban.length === 27) {
        result.cin = cleanIban.slice(4, 5);
        result.abi = cleanIban.slice(5, 10);
        result.cab = cleanIban.slice(10, 15);
        result.conto = cleanIban.slice(15, 27);
    }

    return result;
};
