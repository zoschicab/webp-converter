import { ImagePool } from "@squoosh/lib";
import { cpus } from "os";
import fse from "fs-extra";
import path from "path";
import { Command } from "commander";

const imagePool = new ImagePool(cpus().length);

const program = new Command();
program
  .requiredOption("-i, --input <type>", "ソースディレクトリ（必須）")
  .option("-o, --out <type>", "出力先ディレクトリ")
  .option("-m, --minify", "画像の最適化を行う（同一拡張子での変換）", false)
  .option(
    "-r, --replace-suffix",
    "拡張子をwebpに置き換える（デフォルトはwebpを後ろに付ける）",
    false
  )
  .parse();

type Options = {
  input: string;
  out?: string;
  replaceSuffix: boolean;
  quality?: number;
};
const Options = program.opts<Options>();
const IMAGE_DIR = Options.input;
const OUTPUT_DIR = Options.out ?? IMAGE_DIR;
const REPLACE_SUFFIX = Options.replaceSuffix;
const QUALITY = Options.quality ?? 75;

if (!fse.existsSync(IMAGE_DIR)) {
  throw Error("ソースディレクトリが存在しません");
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

await Promise.all(
  imageFileList.map(async (imagePath) => {
    const fileExtension = path.extname(imagePath).substring(1);
    const sourcePath = path.join(IMAGE_DIR, imagePath);
    let destinationPath = path.join(OUTPUT_DIR, imagePath);

    const rawImageFile = await fse.readFile(sourcePath);

    const ingestedImage = imagePool.ingestImage(rawImageFile);

    await ingestedImage.encode({
      webp: {
        quality: QUALITY,
      },
    });

    const encodedImage = await ingestedImage.encodedWith.webp;

    if (encodedImage) {
      destinationPath = REPLACE_SUFFIX
        ? destinationPath.slice(0, fileExtension.length * -1) + "webp"
        : destinationPath + ".webp";

      await fse.outputFile(destinationPath, encodedImage.binary);
    }
  })
);

// 結果表示
console.info("done!", "(", "total:", Date.now() - ts_start, "ms", ")");
await imagePool.close();
