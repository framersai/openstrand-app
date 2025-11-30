#!/usr/bin/env node

/**
 * Oracle Embeddings Generator
 *
 * Build-time script to generate pre-computed embeddings for the Oracle Q&A system.
 * Outputs to public/oracle-embeddings.json for client-side semantic search.
 *
 * Usage:
 *   node scripts/generate-oracle-embeddings.js [options]
 *
 * Options:
 *   --output <path>     Output file path (default: public/oracle-embeddings.json)
 *   --model <name>      Embedding model (default: all-MiniLM-L6-v2)
 *   --chunk-size <n>    Max tokens per chunk (default: 512)
 *   --overlap <n>       Overlap tokens (default: 50)
 *   --max-docs <n>      Max documents to embed (default: 10000)
 *   --source <type>     Data source: 'db' or 'files' (default: db)
 *   --db-url <url>      Database URL (default: from env)
 *   --files-dir <path>  Directory for file-based source
 *   --verbose           Enable verbose logging
 *   --dry-run           Show what would be embedded without generating
 *
 * Build-time vs Runtime Embedding Strategy:
 *
 * This script implements BUILD-TIME embedding generation, which has the following
 * characteristics compared to runtime embedding:
 *
 * BUILD-TIME (this script):
 *   Pros:
 *   - Zero startup latency for searches
 *   - Works completely offline after initial load
 *   - Consistent embeddings (same model version)
 *   - No client-side compute for documents
 *   - Smaller runtime bundle (no model weights for docs)
 *
 *   Cons:
 *   - Requires rebuild on content changes
 *   - Larger static assets (~500KB-5MB)
 *   - Cache invalidation complexity
 *   - CI/CD pipeline dependency
 *
 * RUNTIME:
 *   Pros:
 *   - Always up-to-date with content
 *   - No rebuild required
 *   - Dynamic corpus support
 *
 *   Cons:
 *   - Cold start delay
 *   - Higher client compute
 *   - Larger runtime bundle
 *
 * Recommended approach: Use build-time for published/stable content,
 * runtime for user queries, and background indexing for new content.
 *
 * @author OpenStrand <team@frame.dev>
 * @since 2.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  output: 'public/oracle-embeddings.json',
  model: 'all-MiniLM-L6-v2',
  dimensions: 384,
  chunkSize: 512,
  chunkOverlap: 50,
  maxDocuments: 10000,
  source: 'db',
  dbUrl: process.env.DATABASE_URL,
  filesDir: null,
  verbose: false,
  dryRun: false,
};

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--output':
        config.output = next;
        i++;
        break;
      case '--model':
        config.model = next;
        i++;
        break;
      case '--chunk-size':
        config.chunkSize = parseInt(next, 10);
        i++;
        break;
      case '--overlap':
        config.chunkOverlap = parseInt(next, 10);
        i++;
        break;
      case '--max-docs':
        config.maxDocuments = parseInt(next, 10);
        i++;
        break;
      case '--source':
        config.source = next;
        i++;
        break;
      case '--db-url':
        config.dbUrl = next;
        i++;
        break;
      case '--files-dir':
        config.filesDir = next;
        i++;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Oracle Embeddings Generator

Usage:
  node scripts/generate-oracle-embeddings.js [options]

Options:
  --output <path>     Output file path (default: public/oracle-embeddings.json)
  --model <name>      Embedding model (default: all-MiniLM-L6-v2)
  --chunk-size <n>    Max tokens per chunk (default: 512)
  --overlap <n>       Overlap tokens (default: 50)
  --max-docs <n>      Max documents to embed (default: 10000)
  --source <type>     Data source: 'db' or 'files' (default: db)
  --db-url <url>      Database URL (default: from DATABASE_URL env)
  --files-dir <path>  Directory for file-based source
  --verbose           Enable verbose logging
  --dry-run           Show what would be embedded without generating
  --help              Show this help message

Examples:
  # Generate from database
  node scripts/generate-oracle-embeddings.js --verbose

  # Generate from markdown files
  node scripts/generate-oracle-embeddings.js --source files --files-dir ./content

  # Dry run to see what would be embedded
  node scripts/generate-oracle-embeddings.js --dry-run --verbose
`);
}

// ============================================================================
// Logging
// ============================================================================

class Logger {
  constructor(verbose) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  info(message) {
    console.log(`[INFO] ${message}`);
  }

  debug(message) {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  warn(message) {
    console.warn(`[WARN] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }

  progress(current, total, message) {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    process.stdout.write(`\r[${bar}] ${percent}% - ${message}    `);
  }

  done() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`\n[DONE] Completed in ${elapsed}s`);
  }
}

// ============================================================================
// Text Chunking
// ============================================================================

function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';
  let currentTokens = 0;
  let position = 0;

  for (const sentence of sentences) {
    const sentenceTokens = Math.ceil(sentence.length / 4); // Rough token estimate

    if (currentTokens + sentenceTokens > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        position,
        tokenCount: currentTokens,
      });
      position++;

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap * 4);
      currentChunk = overlapText + ' ' + sentence;
      currentTokens = Math.ceil(currentChunk.length / 4);
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      position,
      tokenCount: currentTokens,
    });
  }

  return chunks;
}

function generateChunkId(strandId, position, text) {
  const hash = crypto.createHash('sha256');
  hash.update(`${strandId}:${position}:${text.slice(0, 100)}`);
  return hash.digest('hex').slice(0, 16);
}

// ============================================================================
// Data Fetching
// ============================================================================

async function fetchFromDatabase(config, logger) {
  logger.info('Connecting to database...');

  // Dynamic import of Prisma client
  let PrismaClient;
  try {
    const prismaModule = await import('@prisma/client');
    PrismaClient = prismaModule.PrismaClient;
  } catch (error) {
    logger.error('Failed to import Prisma client. Make sure @prisma/client is installed.');
    throw error;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: config.dbUrl },
    },
  });

  try {
    // Fetch strands with content
    logger.info(`Fetching strands (max ${config.maxDocuments})...`);

    const strands = await prisma.strand.findMany({
      take: config.maxDocuments,
      where: {
        plainText: { not: null },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        strandType: true,
        plainText: true,
        metadata: true,
        primaryScopeId: true,
        created: true,
        updated: true,
      },
      orderBy: {
        updated: 'desc',
      },
    });

    logger.info(`Found ${strands.length} strands with content`);

    // Transform to documents
    const documents = strands.map((strand) => ({
      strandId: strand.id,
      title: strand.title || 'Untitled',
      summary: strand.summary || '',
      type: strand.strandType || 'document',
      text: strand.plainText || '',
      tags: extractTags(strand.metadata),
      loomId: strand.primaryScopeId,
      updated: strand.updated?.toISOString() || new Date().toISOString(),
    }));

    return documents;
  } finally {
    await prisma.$disconnect();
  }
}

async function fetchFromFiles(config, logger) {
  logger.info(`Scanning directory: ${config.filesDir}`);

  const documents = [];
  const extensions = ['.md', '.mdx', '.txt', '.json'];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const relativePath = path.relative(config.filesDir, fullPath);
          const { title, summary, tags, text } = parseDocument(content, entry.name);

          documents.push({
            strandId: relativePath,
            title,
            summary,
            type: 'document',
            text,
            tags,
            updated: fs.statSync(fullPath).mtime.toISOString(),
          });
        } catch (error) {
          logger.warn(`Failed to read ${fullPath}: ${error.message}`);
        }
      }
    }
  }

  scanDir(config.filesDir);
  logger.info(`Found ${documents.length} documents`);

  return documents;
}

function parseDocument(content, filename) {
  // Extract frontmatter if present
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    const title = frontmatter.match(/title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] || filename;
    const summary = frontmatter.match(/summary:\s*['"]?(.+?)['"]?\s*$/m)?.[1] || '';
    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, ''))
      : [];

    return { title, summary, tags, text: body };
  }

  // No frontmatter
  const title = filename.replace(/\.(md|mdx|txt|json)$/, '');
  return { title, summary: '', tags: [], text: content };
}

function extractTags(metadata) {
  if (!metadata) return [];
  if (Array.isArray(metadata.tags)) return metadata.tags;
  if (typeof metadata.tags === 'string') return [metadata.tags];
  return [];
}

// ============================================================================
// Embedding Generation
// ============================================================================

async function generateEmbeddings(documents, config, logger) {
  logger.info('Loading embedding model...');

  // Dynamic import of transformers.js
  let pipeline;
  try {
    const transformers = await import('@huggingface/transformers');
    pipeline = transformers.pipeline;
  } catch (error) {
    logger.error('Failed to import @huggingface/transformers. Install it with: npm install @huggingface/transformers');
    throw error;
  }

  const extractor = await pipeline('feature-extraction', `Xenova/${config.model}`, {
    quantized: true,
  });

  logger.info('Embedding model loaded');

  const result = {
    version: '1.0.0',
    model: config.model,
    dimensions: config.dimensions,
    generatedAt: new Date().toISOString(),
    buildId: crypto.randomBytes(8).toString('hex'),
    documentCount: 0,
    chunkCount: 0,
    documents: {},
  };

  let totalChunks = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    logger.progress(i + 1, documents.length, `Embedding: ${doc.title.slice(0, 30)}...`);

    if (!doc.text || doc.text.trim().length < 10) {
      logger.debug(`Skipping ${doc.strandId}: no content`);
      continue;
    }

    // Chunk the document
    const textChunks = chunkText(doc.text, config.chunkSize, config.chunkOverlap);

    if (textChunks.length === 0) {
      logger.debug(`Skipping ${doc.strandId}: no chunks generated`);
      continue;
    }

    const chunks = [];

    for (const chunk of textChunks) {
      if (config.dryRun) {
        // Dry run: don't generate embeddings
        chunks.push({
          id: generateChunkId(doc.strandId, chunk.position, chunk.text),
          strandId: doc.strandId,
          text: chunk.text,
          position: chunk.position,
          tokenCount: chunk.tokenCount,
          embedding: [],
        });
      } else {
        // Generate embedding
        try {
          const output = await extractor(chunk.text, {
            pooling: 'mean',
            normalize: true,
          });

          const embedding = Array.from(output.data);

          chunks.push({
            id: generateChunkId(doc.strandId, chunk.position, chunk.text),
            strandId: doc.strandId,
            text: chunk.text,
            position: chunk.position,
            tokenCount: chunk.tokenCount,
            embedding,
          });
        } catch (error) {
          logger.warn(`Failed to embed chunk ${chunk.position} of ${doc.strandId}: ${error.message}`);
        }
      }
    }

    if (chunks.length > 0) {
      result.documents[doc.strandId] = {
        strandId: doc.strandId,
        title: doc.title,
        summary: doc.summary,
        type: doc.type,
        tags: doc.tags,
        chunks,
      };
      result.documentCount++;
      totalChunks += chunks.length;
    }
  }

  result.chunkCount = totalChunks;

  return result;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const config = parseArgs();
  const logger = new Logger(config.verbose);

  logger.info('Oracle Embeddings Generator');
  logger.info('===========================');
  logger.debug(`Config: ${JSON.stringify(config, null, 2)}`);

  try {
    // Fetch documents
    let documents;
    if (config.source === 'files') {
      if (!config.filesDir) {
        logger.error('--files-dir is required when source is "files"');
        process.exit(1);
      }
      documents = await fetchFromFiles(config, logger);
    } else {
      if (!config.dbUrl) {
        logger.error('DATABASE_URL environment variable or --db-url is required');
        process.exit(1);
      }
      documents = await fetchFromDatabase(config, logger);
    }

    if (documents.length === 0) {
      logger.warn('No documents found to embed');
      process.exit(0);
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(documents, config, logger);

    // Write output
    if (!config.dryRun) {
      const outputPath = path.resolve(process.cwd(), config.output);
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
      logger.info(`\nWritten to: ${outputPath}`);

      const stats = fs.statSync(outputPath);
      logger.info(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      logger.info('\n[DRY RUN] No files written');
    }

    // Summary
    logger.info('\nSummary:');
    logger.info(`  Documents: ${embeddings.documentCount}`);
    logger.info(`  Chunks: ${embeddings.chunkCount}`);
    logger.info(`  Model: ${embeddings.model}`);
    logger.info(`  Dimensions: ${embeddings.dimensions}`);

    logger.done();
  } catch (error) {
    logger.error(`Failed: ${error.message}`);
    if (config.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

