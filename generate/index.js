import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { load } from "js-yaml";
import { parseSchema } from "json-schema-to-zod";
import { transform } from "esbuild";

import { parseOneOf } from "./parseOneOf.js";

const from = resolve(process.argv[2]);
const to = resolve(process.argv[3]);
const tocSchema = load(readFileSync(from, 'utf8'));

const overrideParser = (schema, refs) => {
  if (schema.$ref && schema.$ref.startsWith("#/$defs/")) {
    return `z.lazy(() => defs['${schema.$ref.slice(8)}'])`;
  }

  if (schema.type === "string" && schema.translate) {
    return "translate()";
  }

  if (schema.oneOf !== undefined) {
    return parseOneOf(schema, refs);
  }
};

const zod = parseSchema(tocSchema, {
  seen: new Map(),
  path: [],
  overrideParser,
});

const ts = `import { z } from 'zod';

let key = 0;

const translate = () => z.string().transform((val) => \`$$\${key++}$$\`);

const defs = {
${Object.keys(tocSchema.$defs)
  .map(
    (def) =>
      `  ['${def}']: ${parseSchema(tocSchema.$defs[def], {
        seen: new Map(),
        path: [],
        name: def,
        overrideParser,
      })},`
  )
  .join("\n")}
};

export default ${zod};
`;

const js = await transform(ts, {
  loader: "ts",
});

writeFileSync(to, js.code, 'utf8');
