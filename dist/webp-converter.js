import sharp from "sharp";
import fse from "fs-extra";
import path from "path";
import { Command, InvalidArgumentError } from "commander";
const parseQuality = (value) => {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError("Not a number.");
    }
    if (!(0 <= parsedValue && parsedValue <= 100)) {
        throw new InvalidArgumentError(`Must be between 0 to 100. given ${parsedValue}.`);
    }
    return parsedValue;
};
const program = new Command();
program
    .requiredOption("-i, --input <string>", "ソースディレクトリ（必須）")
    .option("-o, --out <string>", "出力先ディレクトリ (default: ソースディレクトリ)")
    .option("-q, --quality <number>", "画質", parseQuality, 75)
    .option("-r, --replace-suffix", "拡張子をwebpに置き換える", false)
    .parse();
const Options = program.opts();
const IMAGE_DIR = Options.input;
const OUTPUT_DIR = Options.out ?? IMAGE_DIR;
const REPLACE_SUFFIX = Options.replaceSuffix;
const QUALITY = Options.quality;
if (!fse.existsSync(IMAGE_DIR)) {
    throw Error("ソースディレクトリが存在しません");
}
if (!fse.existsSync(OUTPUT_DIR)) {
    fse.mkdirSync(OUTPUT_DIR, { recursive: true });
}
const imageFileList = fse
    .readdirSync(IMAGE_DIR)
    .filter((file) => {
    const regex = /\.(jpe?g|png)$/i;
    return regex.test(file);
})
    .map(function (file) {
    return file.replace(IMAGE_DIR, ".");
});
const ts_start = Date.now();
let successCount = 0;
let errorCount = 0;
await Promise.all(imageFileList.map(async (imagePath) => {
    const fileExtension = path.extname(imagePath).substring(1);
    const sourcePath = path.join(IMAGE_DIR, imagePath);
    let outputPath = path.join(OUTPUT_DIR, imagePath);
    outputPath = REPLACE_SUFFIX
        ? outputPath.slice(0, fileExtension.length * -1) + "webp"
        : outputPath + ".webp";
    await sharp(sourcePath)
        .webp({
        quality: QUALITY,
        lossless: false,
    })
        .toFile(outputPath)
        .then(() => {
        successCount++;
    })
        .catch(() => {
        errorCount++;
    });
}));
// 結果表示
console.info("done!", "(", "total:", Date.now() - ts_start, "ms", ")");
console.info("success: ", successCount, "  error: ", errorCount);
