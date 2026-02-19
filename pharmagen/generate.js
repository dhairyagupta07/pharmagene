const fs = require('fs');

const filename = "too_large.vcf";
const targetBytes = 5.2 * 1024 * 1024;

let header = "##fileformat=VCFv4.2\n";
header += `##INFO=<ID=GENE,Number=1,Type=String,Description="Gene Name">\n`;
header += `##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">\n`;
header += "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSample1\n";

const stream = fs.createWriteStream(filename);
stream.write(header);

let pos = 10000;
let currentSize = Buffer.byteLength(header);

while (currentSize < targetBytes) {
let row = `1\t${pos}\t.\tA\tG\t100\tPASS\tGENE=CYP2D6\tGT\t0/1\n`;
stream.write(row);
currentSize += Buffer.byteLength(row);
pos++;
}

stream.end();
console.log("Done! File created.");