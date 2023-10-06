import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from 'url';
import { load } from "js-yaml";
import Toc from "./toc.zod.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const toc = load(readFileSync(resolve(__dirname, "./toc.yaml")));

console.log(JSON.stringify(Toc.parse(toc), null, 2));
