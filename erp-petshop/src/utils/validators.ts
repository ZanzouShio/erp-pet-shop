export function isValidCPF(cpf: string): boolean {
    if (!cpf) return false;

    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');

    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const cpfArray = cpf.split('').map(el => +el);

    const rest = (count: number) => (cpfArray.slice(0, count - 12)
        .reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10) % 11 % 10;

    return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
}

export function formatCPF(cpf: string): string {
    return cpf
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

export const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não alfanuméricos
    const cleanCNPJ = cnpj.replace(/[^a-zA-Z0-9]/g, '');

    // Verifica tamanho
    if (cleanCNPJ.length !== 14) return false;

    // Elimina CNPJs com todos os caracteres iguais (ex: 00000000000000)
    if (/^(\w)\1+$/.test(cleanCNPJ)) return false;

    // Função para converter char para valor (Regra: ASCII - 48)
    const getCharValue = (char: string): number => {
        const code = char.charCodeAt(0);
        return code - 48;
    };

    // Cálculo do primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += getCharValue(cleanCNPJ[i]) * weight;
        weight--;
        if (weight < 2) weight = 9;
    }

    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Verifica primeiro dígito
    if (getCharValue(cleanCNPJ[12]) !== digit1) return false;

    // Cálculo do segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += getCharValue(cleanCNPJ[i]) * weight;
        weight--;
        if (weight < 2) weight = 9;
    }

    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    // Verifica segundo dígito
    if (getCharValue(cleanCNPJ[13]) !== digit2) return false;

    return true;
};
