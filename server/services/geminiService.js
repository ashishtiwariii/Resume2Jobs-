const GEMINI_MODEL = 'gemini-flash-lite-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function stripJsonFences(value) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function getResponseText(responseBody) {
  return responseBody?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
}

async function requestGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  const responseBody = await response.json();
  if (!response.ok) {
    const error = new Error(responseBody?.error?.message || `Gemini request failed with status ${response.status}`);
    error.status = response.status;
    error.isQuotaError = response.status === 429 || /quota|rate limit|resource exhausted/i.test(error.message);
    throw error;
  }

  const responseText = getResponseText(responseBody);
  if (!responseText) {
    throw new Error('Gemini returned an empty response');
  }

  return responseText;
}

async function generateJson(prompt) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const responseText = await requestGemini(
        attempt === 0
          ? prompt
          : `${prompt}\nReturn only valid JSON. Do not use markdown code fences or explanatory text.`
      );
      return JSON.parse(stripJsonFences(responseText));
    } catch (error) {
      lastError = error;
      if (error.isQuotaError || error.status >= 500) {
        throw error;
      }
    }
  }

  throw new Error(`Gemini returned invalid JSON after retry: ${lastError.message}`);
}

async function structureResume(rawText) {
  return generateJson(`
Extract structured resume data from the text below.
Return exactly this JSON shape, using arrays and concise strings:
{"skills":[],"experience":[],"education":[],"projects":[]}
Do not invent information that is not present.

RESUME TEXT:
${rawText}
`);
}

async function analyzeResumeAgainstJob(resumeText, jobDescription) {
  return generateJson(`
Compare the resume to the job description.
Return exactly this JSON shape:
{"matchScore":0,"matchedSkills":[],"missingSkills":[],"atsIssues":[],"suggestions":[]}
matchScore must be an integer from 0 to 100. All other values must be arrays of concise strings.
Only use evidence from the supplied resume and job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`);
}

module.exports = { structureResume, analyzeResumeAgainstJob };
