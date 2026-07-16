const { CLOUDFLOW_DOCS } = require("./cloudflow");

var cachedEmbeddings = null;

function cosineSimilarity(a, b) {
  var dot = 0;
  var normA = 0;
  var normB = 0;
  for (var i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedTexts(openai, texts) {
  var result = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: texts
  });
  return result.data
    .sort(function (a, b) {
      return a.index - b.index;
    })
    .map(function (row) {
      return row.embedding;
    });
}

async function ensureDocEmbeddings(openai) {
  if (cachedEmbeddings) return cachedEmbeddings;

  var inputs = CLOUDFLOW_DOCS.map(function (doc) {
    return doc.title + "\n" + doc.content;
  });
  var vectors = await embedTexts(openai, inputs);
  cachedEmbeddings = CLOUDFLOW_DOCS.map(function (doc, index) {
    return { doc: doc, embedding: vectors[index] };
  });
  return cachedEmbeddings;
}

async function retrieveDocs(openai, query, topK) {
  var k = topK || 3;
  var docsWithVectors = await ensureDocEmbeddings(openai);
  var queryEmbedding = (await embedTexts(openai, [query]))[0];

  var ranked = docsWithVectors
    .map(function (row) {
      return {
        doc: row.doc,
        score: cosineSimilarity(queryEmbedding, row.embedding)
      };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, k);

  return ranked;
}

module.exports = {
  retrieveDocs: retrieveDocs,
  CLOUDFLOW_DOCS: CLOUDFLOW_DOCS
};
