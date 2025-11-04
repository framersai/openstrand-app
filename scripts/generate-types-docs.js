"use strict";

/**
 * Generate Markdown documentation for exported TypeScript interfaces and type aliases.
 *
 * Usage:
 *   node scripts/generate-types-docs.js --input src/types/openstrand.ts --output ../docs/generated/frontend_types.md
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const DEFAULT_INPUT = "src/types/openstrand.ts";
const DEFAULT_OUTPUT = path.join("..", "docs", "generated", "frontend_types.md");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if ((arg === "-i" || arg === "--input") && args[i + 1]) {
      options.input = args[i + 1];
      i += 1;
    } else if ((arg === "-o" || arg === "--output") && args[i + 1]) {
      options.output = args[i + 1];
      i += 1;
    }
  }

  return options;
}

function isNodeExported(node) {
  return (
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
    (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

function buildProgram(inputFile) {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: false,
    skipLibCheck: true,
  };

  return ts.createProgram([inputFile], compilerOptions);
}

function extractDocs({ checker, sourceFile }) {
  const entries = [];

  function visit(node) {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      isNodeExported(node) &&
      node.name
    ) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (!symbol) {
        return;
      }

      const type = checker.getTypeAtLocation(node);
      const documentation = ts.displayPartsToString(symbol.getDocumentationComment(checker));
      const kind = ts.isInterfaceDeclaration(node) ? "interface" : "type";

      const entry = {
        name: node.name.text,
        kind,
        documentation: documentation || null,
        members: [],
        definition: kind === "type" && node.type ? node.type.getText(sourceFile) : null,
      };

      if (kind === "interface") {
        const properties = checker.getPropertiesOfType(type);
        entry.members = properties.map((prop) => {
          const propType = checker.getTypeOfSymbolAtLocation(
            prop,
            prop.valueDeclaration || prop.declarations?.[0] || node
          );
          const decl = prop.valueDeclaration || prop.declarations?.[0];
          const doc = ts.displayPartsToString(prop.getDocumentationComment(checker));
          const isOptional = !!(prop.flags & ts.SymbolFlags.Optional);
          return {
            name: prop.getName(),
            type: checker.typeToString(propType),
            optional: isOptional,
            documentation: doc || null,
            location:
              decl && ts.isNamedDeclaration(decl) && decl.name
                ? sourceFile.fileName + ":" + sourceFile.getLineAndCharacterOfPosition(decl.name.getStart()).line
                : null,
          };
        });
      }

      entries.push(entry);
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function renderMarkdown(entries, relativeInputPath) {
  const lines = [
    "# Frontend Type Reference",
    "",
    `> Generated from \`${relativeInputPath}\` using \`frontend/scripts/generate-types-docs.js\`.`,
    "",
  ];

  entries.forEach((entry) => {
    const headingLabel =
      entry.kind === "interface" ? `Interface \`${entry.name}\`` : `Type \`${entry.name}\``;
    lines.push(`## ${headingLabel}`);
    if (entry.documentation) {
      lines.push(entry.documentation);
      lines.push("");
    }

    if (entry.kind === "type" && entry.definition) {
      lines.push("```ts");
      lines.push(`type ${entry.name} = ${entry.definition};`);
      lines.push("```");
      lines.push("");
      return;
    }

    if (entry.members.length === 0) {
      lines.push("_No properties defined._");
      lines.push("");
      return;
    }

    lines.push("| Property | Type | Optional | Description |");
    lines.push("| --- | --- | --- | --- |");
    entry.members.forEach((member) => {
      const description = member.documentation ? member.documentation.replace(/\|/g, "\\|") : "";
      lines.push(
        `| \`${member.name}\` | \`${member.type}\` | ${member.optional ? "Yes" : "No"} | ${description} |`
      );
    });
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}

function main() {
  const { input, output } = parseArgs();
  const projectRoot = path.resolve(__dirname, "..");
  const inputPath = path.resolve(projectRoot, input);
  const outputPath = path.resolve(projectRoot, output);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const program = buildProgram(inputPath);
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(inputPath);
  if (!sourceFile) {
    console.error(`Unable to parse TypeScript source: ${inputPath}`);
    process.exit(1);
  }

  const entries = extractDocs({ checker, sourceFile });
  const relativeInput = path.relative(projectRoot, inputPath).split(path.sep).join("/");
  const markdown = renderMarkdown(entries, relativeInput);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");
  console.log(`Wrote ${entries.length} type definitions to ${outputPath}`);
}

main();
