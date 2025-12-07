
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const products = [
    { name: 'Ração Golden Adulto 15kg', price: 149.90, ncm: '23091000' },
    { name: 'Ração Premium Filhote 3kg', price: 45.90, ncm: '23091000' },
    { name: 'Petisco Bifinho Carne', price: 5.90, ncm: '23091000' },
    { name: 'Shampoo Antipulgas 500ml', price: 32.50, ncm: '33051000' },
    { name: 'Tapete Higiênico 30un', price: 59.90, ncm: '96190000' },
    { name: 'Simparic 10mg (3 cães)', price: 99.90, ncm: '30049099' },
    { name: 'Apoquel 5.4mg', price: 210.00, ncm: '30049099' },
    { name: 'Brinquedo Bola Corda', price: 15.00, ncm: '95030099' },
    { name: 'Coleira Peitoral P', price: 45.00, ncm: '42010010' },
    { name: 'Guia Retrátil 5m', price: 65.00, ncm: '42010010' },
    { name: 'Comedouro Inox M', price: 25.00, ncm: '73239300' },
    { name: 'Caminha Soft P', price: 89.90, ncm: '63079090' },
    { name: 'Arranhador Torre', price: 150.00, ncm: '94036000' },
    { name: 'Areia Sanitária 4kg', price: 12.00, ncm: '25081000' },
    { name: 'Vermífugo Drontal', price: 45.00, ncm: '30049099' },
    { name: 'Frontline Pipeta', price: 55.00, ncm: '30029099' },
    { name: 'Escova Rasqueadeira', price: 22.00, ncm: '96032900' },
    { name: 'Cortador de Unhas', price: 18.00, ncm: '82142000' },
    { name: 'Perfume Pet 100ml', price: 29.90, ncm: '33030010' },
    { name: 'Sabonete Matacura', price: 8.50, ncm: '34011190' },
    { name: 'Ossinho de Couro', price: 2.50, ncm: '05119999' },
    { name: 'Gravata Borboleta', price: 10.00, ncm: '62149090' },
    { name: 'Bandana Estampada', price: 12.00, ncm: '62149090' },
    { name: 'Ração Úmida Sachê', price: 3.50, ncm: '23091000' },
    { name: 'Portão de Proteção', price: 120.00, ncm: '73089090' },
    { name: 'Bebedouro Automático', price: 180.00, ncm: '84137090' },
    { name: 'Caixa de Transporte N1', price: 60.00, ncm: '39249000' },
    { name: 'Identificador QR Code', price: 20.00, ncm: '39269090' },
    { name: 'Cinto de Segurança Pet', price: 25.00, ncm: '42010010' },
    { name: 'Capa Protetora Carro', price: 90.00, ncm: '63079090' }
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n' +
    '  <NFe>\n' +
    '    <infNFe Id="NFe35231212345678000199550010000012341000012345" versao="4.00">\n' +
    '      <ide>\n' +
    '        <cUF>35</cUF>\n' +
    '        <cNF>00001234</cNF>\n' +
    '        <natOp>Venda de Mercadoria</natOp>\n' +
    '        <mod>55</mod>\n' +
    '        <serie>1</serie>\n' +
    '        <nNF>1234</nNF>\n' +
    '        <dhEmi>2023-12-07T10:00:00-03:00</dhEmi>\n' +
    '        <tpNF>1</tpNF>\n' +
    '        <idDest>1</idDest>\n' +
    '        <cMunFG>3550308</cMunFG>\n' +
    '        <tpImp>1</tpImp>\n' +
    '        <tpEmis>1</tpEmis>\n' +
    '        <cDV>5</cDV>\n' +
    '        <tpAmb>2</tpAmb>\n' +
    '        <finNFe>1</finNFe>\n' +
    '        <indFinal>1</indFinal>\n' +
    '        <indPres>1</indPres>\n' +
    '        <procEmi>0</procEmi>\n' +
    '        <verProc>1.0</verProc>\n' +
    '      </ide>\n' +
    '      <emit>\n' +
    '        <CNPJ>12345678000199</CNPJ>\n' +
    '        <xNome>Distribuidora PetGlobal Ltda</xNome>\n' +
    '        <xFant>PetGlobal</xFant>\n' +
    '        <enderEmit>\n' +
    '          <xLgr>Rua dos Fornecedores</xLgr>\n' +
    '          <nro>100</nro>\n' +
    '          <xBairro>Distrito Industrial</xBairro>\n' +
    '          <cMun>3550308</cMun>\n' +
    '          <xMun>São Paulo</xMun>\n' +
    '          <UF>SP</UF>\n' +
    '          <CEP>01000000</CEP>\n' +
    '          <cPais>1058</cPais>\n' +
    '          <xPais>Brasil</xPais>\n' +
    '          <fone>11999999999</fone>\n' +
    '        </enderEmit>\n' +
    '        <IE>123456789</IE>\n' +
    '        <CRT>3</CRT>\n' +
    '      </emit>\n' +
    '      <dest>\n' +
    '        <CNPJ>98765432000188</CNPJ>\n' +
    '        <xNome>Pet Shop do User</xNome>\n' +
    '        <enderDest>\n' +
    '          <xLgr>Rua do Comércio</xLgr>\n' +
    '          <nro>200</nro>\n' +
    '          <xBairro>Centro</xBairro>\n' +
    '          <cMun>3550308</cMun>\n' +
    '          <xMun>São Paulo</xMun>\n' +
    '          <UF>SP</UF>\n' +
    '          <CEP>02000000</CEP>\n' +
    '          <cPais>1058</cPais>\n' +
    '          <xPais>Brasil</xPais>\n' +
    '        </enderDest>\n' +
    '        <indIEDest>1</indIEDest>\n' +
    '        <IE>987654321</IE>\n' +
    '      </dest>';

let totalProd = 0;
let totalICMS = 0;
let totalPIS = 0;
let totalCOFINS = 0;

products.forEach((prod, index) => {
    const nItem = index + 1;
    const cProd = 'PROD' + String(nItem).padStart(3, '0');
    const cEAN = '78910005' + String(nItem).padStart(4, '0');
    const qCom = 10.0000; // Quantidade fixa de 10
    const vUnCom = prod.price.toFixed(4);
    const vProdVal = (qCom * prod.price);
    const vProd = vProdVal.toFixed(2);

    // Tax calculations (approximate)
    const vBC = vProd;
    const vICMS = (vProdVal * 0.18).toFixed(2);
    const vPIS = (vProdVal * 0.0165).toFixed(2);
    const vCOFINS = (vProdVal * 0.076).toFixed(2);

    totalProd += vProdVal;
    totalICMS += parseFloat(vICMS);
    totalPIS += parseFloat(vPIS);
    totalCOFINS += parseFloat(vCOFINS);

    xml +=
        '      <det nItem="' + nItem + '">\n' +
        '        <prod>\n' +
        '          <cProd>' + cProd + '</cProd>\n' +
        '          <cEAN>' + cEAN + '</cEAN>\n' +
        '          <xProd>' + prod.name + '</xProd>\n' +
        '          <NCM>' + prod.ncm + '</NCM>\n' +
        '          <CEST>0100100</CEST>\n' +
        '          <CFOP>5102</CFOP>\n' +
        '          <uCom>UN</uCom>\n' +
        '          <qCom>' + qCom.toFixed(4) + '</qCom>\n' +
        '          <vUnCom>' + vUnCom + '</vUnCom>\n' +
        '          <vProd>' + vProd + '</vProd>\n' +
        '          <cEANTrib>' + cEAN + '</cEANTrib>\n' +
        '          <uTrib>UN</uTrib>\n' +
        '          <qTrib>' + qCom.toFixed(4) + '</qTrib>\n' +
        '          <vUnTrib>' + vUnCom + '</vUnTrib>\n' +
        '          <indTot>1</indTot>\n' +
        '        </prod>\n' +
        '        <imposto>\n' +
        '          <ICMS>\n' +
        '             <ICMS00>\n' +
        '                <orig>0</orig>\n' +
        '                <CST>00</CST>\n' +
        '                <modBC>3</modBC>\n' +
        '                <vBC>' + vBC + '</vBC>\n' +
        '                <pICMS>18.00</pICMS>\n' +
        '                <vICMS>' + vICMS + '</vICMS>\n' +
        '             </ICMS00>\n' +
        '          </ICMS>\n' +
        '          <PIS>\n' +
        '             <PISAliq>\n' +
        '                <CST>01</CST>\n' +
        '                <vBC>' + vBC + '</vBC>\n' +
        '                <pPIS>1.65</pPIS>\n' +
        '                <vPIS>' + vPIS + '</vPIS>\n' +
        '             </PISAliq>\n' +
        '          </PIS>\n' +
        '          <COFINS>\n' +
        '             <COFINSAliq>\n' +
        '                <CST>01</CST>\n' +
        '                <vBC>' + vBC + '</vBC>\n' +
        '                <pCOFINS>7.60</pCOFINS>\n' +
        '                <vCOFINS>' + vCOFINS + '</vCOFINS>\n' +
        '             </COFINSAliq>\n' +
        '          </COFINS>\n' +
        '        </imposto>\n' +
        '      </det>';
});

const vNF = (totalProd + totalICMS + totalPIS + totalCOFINS); // Simplified total

xml +=
    '      <total>\n' +
    '        <ICMSTot>\n' +
    '          <vBC>' + totalProd.toFixed(2) + '</vBC>\n' +
    '          <vICMS>' + totalICMS.toFixed(2) + '</vICMS>\n' +
    '          <vICMSDeson>0.00</vICMSDeson>\n' +
    '          <vFCP>0.00</vFCP>\n' +
    '          <vBCST>0.00</vBCST>\n' +
    '          <vST>0.00</vST>\n' +
    '          <vFCPST>0.00</vFCPST>\n' +
    '          <vFCPSTRet>0.00</vFCPSTRet>\n' +
    '          <vProd>' + totalProd.toFixed(2) + '</vProd>\n' +
    '          <vFrete>0.00</vFrete>\n' +
    '          <vSeg>0.00</vSeg>\n' +
    '          <vDesc>0.00</vDesc>\n' +
    '          <vII>0.00</vII>\n' +
    '          <vIPI>0.00</vIPI>\n' +
    '          <vIPIDevol>0.00</vIPIDevol>\n' +
    '          <vPIS>' + totalPIS.toFixed(2) + '</vPIS>\n' +
    '          <vCOFINS>' + totalCOFINS.toFixed(2) + '</vCOFINS>\n' +
    '          <vOutro>0.00</vOutro>\n' +
    '          <vNF>' + totalProd.toFixed(2) + '</vNF>\n' +
    '        </ICMSTot>\n' +
    '      </total>\n' +
    '    </infNFe>\n' +
    '  </NFe>\n' +
    '</nfeProc>';

// Write to root directory (../sample_nfe_large.xml)
const outputPath = path.resolve(__dirname, '../sample_nfe_large.xml');
fs.writeFileSync(outputPath, xml);
console.log(`XML generated at: ${outputPath}`);
